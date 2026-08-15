import json
import uuid
import random
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.llm import LLMService
from backend.services.vectordb.client import vectordb_client
from backend.models.models import Quiz, QuizQuestion, FlashcardDeck, Flashcard
from backend.repositories.note import NoteRepository
from backend.core.logging import logger
from backend.core.exceptions import NotFoundException, ExternalServiceException

class StudyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm_service = LLMService()
        self.note_repo = NoteRepository(db)

    async def generate_quiz(
        self,
        user_id: uuid.UUID,
        note_id: Optional[uuid.UUID] = None,
        num_questions: int = 5
    ) -> Quiz:
        """Generates an interactive multiple-choice quiz from uploaded notes."""
        context_str, note_title = await self._retrieve_note_context(user_id, note_id, is_summary=False)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Generate a completely NEW and UNIQUE {num_questions}-question multiple-choice quiz for '{note_title}' based ONLY on the following study materials.\n"
            f"CRITICAL: Do NOT repeat standard or previously generated questions. Focus on different details, concepts, and specific facts. Unique seed: {seed_token}.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON strictly matching this structure:\n"
            f"{{\n"
            f'  "title": "{note_title} - Practice Quiz",\n'
            f'  "questions": [\n'
            f'    {{\n'
            f'      "question": "Question text?",\n'
            f'      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            f'      "correct_option_idx": 0,\n'
            f'      "explanation": "Why Option A is correct based on the text."\n'
            f'    }}\n'
            f'  ]\n'
            f'}}\n'
            f"Do NOT wrap with markdown backticks or extra commentary. Return raw JSON only."
        )

        response_str = await self.llm_service.generate_response(
            context=context_str,
            question=prompt,
            language="English",
            model_override="llama-3.1-8b-instant"
        )

        quiz_data = self._clean_and_parse_json(response_str)

        # Create Quiz in Database
        quiz = Quiz(
            user_id=user_id,
            note_id=note_id,
            title=quiz_data.get("title", f"{note_title} - Practice Quiz"),
            total_questions=len(quiz_data.get("questions", []))
        )
        self.db.add(quiz)
        await self.db.flush()

        for q_item in quiz_data.get("questions", []):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_item.get("question", ""),
                options=q_item.get("options", []),
                correct_option_idx=q_item.get("correct_option_idx", 0),
                explanation=q_item.get("explanation", "")
            )
            self.db.add(question)

        await self.db.commit()
        await self.db.refresh(quiz)
        return quiz

    async def generate_flashcards(
        self,
        user_id: uuid.UUID,
        note_id: Optional[uuid.UUID] = None,
        num_cards: int = 8
    ) -> FlashcardDeck:
        """Generates a study flashcard deck from uploaded notes."""
        context_str, note_title = await self._retrieve_note_context(user_id, note_id, is_summary=False)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Generate a deck of {num_cards} NEW and UNIQUE study flashcards for '{note_title}' based ONLY on the following study materials.\n"
            f"Unique seed: {seed_token}.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON strictly matching this structure:\n"
            f"{{\n"
            f'  "title": "{note_title} - Flashcard Deck",\n'
            f'  "cards": [\n'
            f'    {{\n'
            f'      "front": "Key Term / Question",\n'
            f'      "back": "Clear Concise Answer / Definition"\n'
            f'    }}\n'
            f'  ]\n'
            f'}}\n'
            f"Do NOT wrap with markdown backticks or extra commentary. Return raw JSON only."
        )

        response_str = await self.llm_service.generate_response(
            context=context_str,
            question=prompt,
            language="English",
            model_override="llama-3.1-8b-instant"
        )

        deck_data = self._clean_and_parse_json(response_str)

        deck = FlashcardDeck(
            user_id=user_id,
            note_id=note_id,
            title=deck_data.get("title", f"{note_title} - Flashcards")
        )
        self.db.add(deck)
        await self.db.flush()

        for c_item in deck_data.get("cards", []):
            card = Flashcard(
                deck_id=deck.id,
                front=c_item.get("front", ""),
                back=c_item.get("back", "")
            )
            self.db.add(card)

        await self.db.commit()
        await self.db.refresh(deck)
        return deck

    async def generate_summary(
        self,
        user_id: uuid.UUID,
        note_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """Generates a chapter summary and formula/concept cheat sheet."""
        context_str, note_title = await self._retrieve_note_context(user_id, note_id, is_summary=True)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Create a comprehensive Chapter Summary and Cheat Sheet for '{note_title}'. Unique seed: {seed_token}.\n"
            f"CRITICAL: Base the summary, key takeaways, core concepts, and cheat sheet STRICTLY AND EXCLUSIVELY on the provided context below.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON strictly matching this structure:\n"
            f"{{\n"
            f'  "title": "{note_title} - Executive Summary",\n'
            f'  "key_takeaways": ["Key Takeaway 1", "Key Takeaway 2", "Key Takeaway 3"],\n'
            f'  "core_concepts": [{{"term": "Concept Name", "definition": "Brief description"}}],\n'
            f'  "cheat_sheet": "Markdown formatted cheat sheet with key formulas or rules"\n'
            f'}}\n'
            f"IMPORTANT: Escape all line breaks in 'cheat_sheet' as \\n. Return valid raw JSON only without commentary."
        )

        response_str = await self.llm_service.generate_response(
            context=context_str,
            question=prompt,
            language="English",
            model_override="llama-3.1-8b-instant"
        )

        return self._clean_and_parse_json(response_str)

    async def _retrieve_note_context(
        self,
        user_id: uuid.UUID,
        note_id: Optional[uuid.UUID] = None,
        is_summary: bool = False
    ) -> Tuple[str, str]:
        import asyncio
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        must_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=str(user_id)))
        ]

        note_title = "Uploaded Course Notes"
        if note_id:
            note_obj = await self.note_repo.get_by_id(note_id)
            if note_obj:
                note_title = note_obj.title
                must_conditions.append(
                    FieldCondition(key="note_id", match=MatchValue(value=str(note_id)))
                )

        query_filter = Filter(must=must_conditions)

        try:
            def _sync_scroll():
                points, _ = vectordb_client.client.scroll(
                    collection_name=vectordb_client.collection_name,
                    scroll_filter=query_filter,
                    limit=40,
                    with_payload=True,
                    with_vectors=False
                )
                return points
            points = await asyncio.to_thread(_sync_scroll)
        except Exception as e:
            logger.error("Failed to scroll points for study context", error=str(e))
            points = []

        valid_points = [p for p in points if p.payload.get("text", "").strip()]

        if not valid_points or sum(len(p.payload.get("text", "").strip()) for p in valid_points) < 50:
            raise NotFoundException(
                f"No readable text found in '{note_title}'. If this is a scanned image PDF, please re-upload a text-searchable PDF."
            )

        doc_header = f"Target Document Title: '{note_title}'\n\n"

        if is_summary:
            valid_points.sort(key=lambda p: p.payload.get("page", 1))
            if len(valid_points) <= 10:
                selected_points = valid_points
            else:
                step = len(valid_points) / 10.0
                selected_points = [valid_points[int(i * step)] for i in range(10)]
        else:
            selected_points = random.sample(valid_points, min(len(valid_points), 5))

        extracted_text = "\n\n".join([f"[Page {p.payload.get('page', 1)}]: {p.payload.get('text', '').strip()[:600]}" for p in selected_points])
        return f"{doc_header}{extracted_text}", note_title

    def _clean_and_parse_json(self, raw_str: str) -> Dict[str, Any]:
        import re
        cleaned = raw_str.strip()

        # Remove markdown code block fences if present
        if "```" in cleaned:
            fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
            if fence_match:
                cleaned = fence_match.group(1)
            else:
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
        else:
            json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)

        cleaned = cleaned.strip()

        # Remove trailing commas in objects or arrays: ,} -> } and ,] -> ]
        cleaned_no_trailing = re.sub(r",\s*([\}\]])", r"\1", cleaned)

        try:
            return json.loads(cleaned_no_trailing, strict=False)
        except Exception:
            try:
                return json.loads(cleaned, strict=False)
            except Exception as e:
                logger.error("Failed to parse JSON from LLM study response", raw=raw_str, error=str(e))
                raise ExternalServiceException("Failed to structure generated study materials. Please try again.")
