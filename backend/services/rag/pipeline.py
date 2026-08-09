import uuid
from typing import List, Dict, Any, Tuple, Optional
from backend.services.embeddings.client import embedding_service
from backend.services.vectordb.client import vectordb_client
from backend.services.rag.prompts import get_system_prompt
from backend.services.llm import LLMService
from backend.core.config import settings
from backend.core.logging import logger
from backend.repositories.note import NoteRepository
from backend.repositories.chat import ChatRepository

class RAGPipeline:
    def __init__(self, db):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.chat_repo = ChatRepository(db)
        self.llm_service = LLMService()

    async def execute(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        query: str,
        note_ids: Optional[List[uuid.UUID]] = None,
        language: str = "Auto",
        prompt_version: str = "v1"
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Executes the full RAG pipeline:
        Query Embedding -> Similarity Search -> Threshold Guardrail -> LLM Call -> Citation Output.
        """
        # 1. Generate query embedding asynchronously in background thread
        query_vectors = await embedding_service.embed_texts([query])
        if not query_vectors:
            raise ValueError("Query embedding generation failed.")
        query_vector = query_vectors[0]

        # 2. Query vector database
        hits = await vectordb_client.search_similar(
            user_id=user_id,
            query_vector=query_vector,
            note_ids=note_ids,
            top_k=10
        )

        # Log retrieval quality metrics (top score and hit count)
        top_score = hits[0]["score"] if hits else 0.0
        logger.info(
            "Retrieval quality metrics",
            top_score=top_score,
            hit_count=len(hits),
            session_id=str(session_id),
            user_id=str(user_id)
        )

        # Enforce similarity threshold cutoff
        fallback_answer = "I cannot find this information in the uploaded notes."
        if not hits or top_score < settings.SCORE_THRESHOLD:
            logger.info(
                "Retrieval score below threshold. Bypassing LLM call.",
                top_score=top_score,
                threshold=settings.SCORE_THRESHOLD
            )
            return fallback_answer, []

        # Log full text details only at debug level
        for idx, hit in enumerate(hits):
            logger.debug(
                "Retrieved chunk details",
                idx=idx,
                score=hit["score"],
                text=hit["text"],
                page=hit["page"]
            )

        # 3. Retrieve note titles for citation names in a single batch query
        retrieved_note_ids = list({hit["note_id"] for hit in hits})
        note_objs = await self.note_repo.get_by_ids(retrieved_note_ids)
        note_title_lookup = {n.id: n.title for n in note_objs}

        # Format citations
        citations = []
        for hit in hits:
            citations.append({
                "note_id": str(hit["note_id"]),
                "note_title": note_title_lookup.get(hit["note_id"], "Deleted Note"),
                "page": hit["page"],
                "score": float(hit["score"]),
                "text": hit["text"],
                "figures": hit.get("figures", [])
            })

        # 4. Construct context text including figure URLs (bounded to prevent token limits)
        context_parts = []
        for hit in hits:
            title = note_title_lookup.get(hit["note_id"], "Deleted Note")
            figs = hit.get("figures", [])
            fig_str = f" [Attached Figures: {', '.join(figs)}]" if figs else ""
            raw_text = hit["text"]
            text_snippet = raw_text[:2000] + "..." if len(raw_text) > 2000 else raw_text
            context_parts.append(
                f"--- Source Note: '{title}', Page: {hit['page']}{fig_str} ---\n{text_snippet}"
            )
        context_str = "\n\n".join(context_parts)

        # 5. Fetch conversational history (bounded to last 4 turns & truncated to avoid prompt token explosion)
        history_msgs = await self.chat_repo.get_session_messages(session_id)
        history_payload = []
        for msg in history_msgs:
            if msg.role in ("user", "assistant") and msg.content != query:
                content_snippet = msg.content[:600] + "..." if len(msg.content) > 600 else msg.content
                history_payload.append({
                    "role": msg.role,
                    "content": content_snippet
                })
        history_payload = history_payload[-4:]

        # 6. Call LLM Service with language preference
        try:
            ans = await self.llm_service.generate_response(
                context=context_str,
                question=query,
                history=history_payload,
                language=language
            )
        except Exception as e:
            logger.error("LLM execution in pipeline failed", error=str(e))
            raise

        # Check if LLM output claims it doesn't know the answer
        if fallback_answer in ans or "I cannot find this information" in ans:
            return fallback_answer, []

        return ans, citations
