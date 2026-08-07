import json
import uuid
import random
from typing import List, Dict, Any, Optional
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
        context_str = await self._retrieve_note_context(user_id, note_id)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Generate a completely NEW and UNIQUE {num_questions}-question multiple-choice quiz based ONLY on the following study materials.\n"
            f"CRITICAL: Do NOT repeat standard or previously generated questions. Focus on different details, concepts, and specific facts. Unique seed: {seed_token}.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON strictly matching this structure:\n"
            f"{{\n"
            f'  "title": "Short Quiz Title",\n'
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
            language="English"
        )

        quiz_data = self._clean_and_parse_json(response_str)

        # Create Quiz in Database
        quiz = Quiz(
            user_id=user_id,
            note_id=note_id,
            title=quiz_data.get("title", "Study Note Practice Quiz"),
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
        context_str = await self._retrieve_note_context(user_id, note_id)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Generate a deck of {num_cards} NEW and UNIQUE study flashcards based ONLY on the following study materials.\n"
            f"Unique seed: {seed_token}.\n\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON strictly matching this structure:\n"
            f"{{\n"
            f'  "title": "Flashcard Deck Title",\n'
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
            language="English"
        )

        deck_data = self._clean_and_parse_json(response_str)

        deck = FlashcardDeck(
            user_id=user_id,
            note_id=note_id,
            title=deck_data.get("title", "Study Flashcards")
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
        context_str = await self._retrieve_note_context(user_id, note_id)
        seed_token = uuid.uuid4().hex[:6]
        
        prompt = (
            f"Create a comprehensive Chapter Summary and Cheat Sheet for these study materials. Unique seed: {seed_token}.\n"
            f"Context:\n{context_str}\n\n"
            f"Output MUST be valid JSON matching:\n"
            f"{{\n"
            f'  "title": "Executive Chapter Summary",\n'
            f'  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],\n'
            f'  "core_concepts": [{{"term": "Concept Name", "definition": "Brief description"}}],\n'
            f'  "cheat_sheet": "Markdown formatted cheat sheet with key formulas or rules"\n'
            f'}}\n'
            f"Do NOT wrap with markdown backticks or extra commentary. Return raw JSON only."
        )

        response_str = await self.llm_service.generate_response(
            context=context_str,
            question=prompt,
            language="English"
        )

        return self._clean_and_parse_json(response_str)

    async def _retrieve_note_context(
        self,
        user_id: uuid.UUID,
        note_id: Optional[uuid.UUID] = None
    ) -> str:
        # Create a random query vector to sample diverse document chunks from Qdrant
        random_vec = [random.uniform(-1.0, 1.0) for _ in range(384)]
        
        hits = await vectordb_client.search_similar(
            user_id=user_id,
            query_vector=random_vec,
            note_ids=[note_id] if note_id else None,
            top_k=20
        )
        if not hits:
            # Fallback to zero vector if random vector yielded no hits
            hits = await vectordb_client.search_similar(
                user_id=user_id,
                query_vector=[0.0] * 384,
                note_ids=[note_id] if note_id else None,
                top_k=20
            )
        if not hits:
            raise NotFoundException("No note content found to generate study materials.")

        # Randomly sample up to 10 chunks from the retrieved hits to vary study context
        sampled_hits = random.sample(hits, min(len(hits), 10))
        return "\n\n".join([hit["text"][:1500] for hit in sampled_hits])

    def _clean_and_parse_json(self, raw_str: str) -> Dict[str, Any]:
        cleaned = raw_str.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error("Failed to parse JSON from LLM study response", raw=raw_str, error=str(e))
            raise ExternalServiceException("Failed to structure generated study materials. Please try again.")
