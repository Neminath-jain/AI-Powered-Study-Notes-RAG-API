from typing import List, Dict, Any, Optional
from groq import AsyncGroq
from backend.core.config import settings
from backend.core.logging import logger
from backend.core.exceptions import ExternalServiceException

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY is not set. The system will operate in Mock LLM mode.")
        self.model = settings.LLM_MODEL

    async def generate_response(
        self, 
        context: str, 
        question: str, 
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "Auto"
    ) -> str:
        """Sends the question and context to Groq, strictly instructing it to not hallucinate and respect output language."""
        if not self.client:
            # Mock mode to allow out-of-the-box running without credential blocks
            logger.info("Mock LLM answer generated.")
            return (
                f"I have analyzed the documents context. The question is '{question}'. "
                f"Here is a mock response because the GROQ_API_KEY is missing. "
                f"Context details: {context[:200]}..."
            )

        lang_instruction = ""
        if language and language.lower() not in ("auto", "default"):
            lang_instruction = f"5. Response Language: The student specifically selected {language}. You MUST generate your entire answer in {language}."
        else:
            lang_instruction = "5. Language Auto-Detection: Detect the language of the student's question (e.g. Kannada, English, Hindi). Respond fluently in that EXACT SAME language (e.g. if asked in Kannada (ಕನ್ನಡ), answer in Kannada). If technical terms are used, you can provide English technical terms in parentheses alongside the native language translation."

        # Enforce strict RAG answering rules & Exam Marks formatting
        system_prompt = (
            "You are an advanced academic tutor helping a student study their uploaded notes.\n"
            "Instructions:\n"
            "1. Grounding & Zero Hallucination: Answer the student's question based strictly and exclusively on the context provided below. Do not invent details, extrapolate, or use outside knowledge.\n"
            "2. Not Found Fallback: If the context does not contain the answer, respond EXACTLY with: 'I cannot find this information in the uploaded notes.' Do not provide any other explanation.\n"
            "3. Answer Formatting Blueprint:\n"
            "   - **Title / Topic Header**: Main topic title (e.g. ## 6.1 Features of Cloud and Grid Platform).\n"
            "   - **Executive Overview**: 2-3 sentence overview paragraph introducing the concept.\n"
            "   - **Key Features / Core Concepts Subsections**: Explain each subsection (e.g. 6.1.1, 6.1.2) using bullet points in the format: `**Feature / Term Name**: Detailed explanation text extracted directly from the notes.`\n"
            "   - **Comparison Snapshot / Summary Tables**: At the very end of your response, provide clean markdown summary tables comparing features/platforms if applicable.\n"
            "4. STRICT TABLES RULE: DO NOT USE ANY MARKDOWN TABLES IN THE MAIN BODY OF YOUR EXPLANATION. Write detailed text paragraphs and bullet points for all main sections and subsections. ONLY output AT MOST ONE summary table at the VERY END of your response under the heading '## Summary Table'. Using tables inside the explanation body is strictly forbidden.\n"
            "5. Figures & Diagrams: ONLY include an image markdown tag `![Figure Title](url)` if the student explicitly asks for a diagram, figure, flowchart, visual representation, or asks about a specific Figure number. Otherwise, DO NOT output any image tags.\n"
            f"{lang_instruction}\n"
            "6. Exam Marks Format Guidelines:\n"
            "   - 2 Marks / Short Answer: Concise 2-3 sentence or bulleted answer covering core definition & key facts.\n"
            "   - 5 Marks Answer: Executive Overview + 4-5 Core Key Points/Subheadings + Short Conclusion.\n"
            "   - 10 Marks / 15 Marks Answer: Title + Executive Overview + Detailed Subsections with bullet points + Summary Tables at the bottom.\n"
            "7. Keep the answer well-formatted with markdown headers, bold terms, and bullet points. Standard GitHub Flavored Markdown table syntax with a newline after every row.\n"
            "8. Table Quality & Cell Completeness: NEVER output empty cells or blank columns in summary tables. Every table cell MUST contain a meaningful, factual description extracted from the notes. Format summary tables clearly as `| Feature Category / Term | Description & Key Details |` with complete explanations for every row."
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Inject chat history
        if history:
            for message in history:
                messages.append({"role": message["role"], "content": message["content"]})

        # Inject context + current question
        user_content = f"CONTEXT:\n---\n{context}\n---\n\nQUESTION: {question}"
        messages.append({"role": "user", "content": user_content})

        try:
            response = await self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.0,
                max_tokens=1800,
            )
            return response.choices[0].message.content
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Primary LLM model '{self.model}' failed, invoking ultra-fast fallback model 'llama-3.1-8b-instant'", error=err_msg)
            try:
                fallback_response = await self.client.chat.completions.create(
                    messages=messages,
                    model="llama-3.1-8b-instant",
                    temperature=0.0,
                    max_tokens=1500,
                )
                return fallback_response.choices[0].message.content
            except Exception as fallback_err:
                logger.error("Fallback LLM model execution failed", error=str(fallback_err))
                raise ExternalServiceException("AI study assistant limit reached. Please wait a moment before asking again.")
