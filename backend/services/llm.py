from typing import List, Dict, Any, Optional
import asyncio
from groq import Groq
from backend.core.config import settings
from backend.core.logging import logger
from backend.core.exceptions import ExternalServiceException

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if self.api_key:
            self.client = Groq(api_key=self.api_key, timeout=20.0, max_retries=0)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY is not set. The system will operate in Mock LLM mode.")
        self.model = settings.LLM_MODEL

    def _sync_generate(self, messages: List[Dict[str, str]], model_override: Optional[str] = None) -> str:
        """Executes synchronous Groq API call with fast timeout and multi-model fallback chain."""
        target_model = model_override or self.model
        fallback_candidates = ["llama-3.1-8b-instant", "openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.2-11b-vision-preview"]
        models_to_try = [target_model] + [m for m in fallback_candidates if m != target_model]

        last_err = None
        for current_model in models_to_try:
            try:
                client = Groq(api_key=self.api_key, timeout=12.0, max_retries=0)
                response = client.chat.completions.create(
                    messages=messages,
                    model=current_model,
                    temperature=0.0,
                    max_tokens=1800,
                )
                return response.choices[0].message.content
            except Exception as e:
                last_err = e
                logger.warning(f"LLM model '{current_model}' failed or rate-limited, attempting failover", error=str(e))
                continue

        err_str = str(last_err)
        if "429" in err_str or "rate_limit" in err_str.lower():
            raise ExternalServiceException("Groq AI daily rate limit reached. Please wait a minute before trying again.")
        raise ExternalServiceException("AI study assistant limit reached. Please wait a moment before asking again.")

    async def generate_response(
        self, 
        context: str, 
        question: str, 
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "Auto",
        model_override: Optional[str] = None
    ) -> str:
        """Sends the question and context to Groq, strictly instructing it to not hallucinate and respect output language."""
        if not self.client:
            logger.info("Mock LLM answer generated.")
            return (
                f"I have analyzed the documents context. The question is '{question}'. "
                f"Here is a mock response because the GROQ_API_KEY is missing. "
                f"Context details: {context[:200]}..."
            )

        LANG_MAP = {
            "en": "English",
            "english": "English",
            "kn": "Kannada",
            "kannada": "Kannada",
            "hi": "Hindi",
            "hindi": "Hindi",
            "es": "Spanish",
            "spanish": "Spanish",
        }
        target_lang = LANG_MAP.get(language.lower(), language) if language else "Auto"

        lang_instruction = ""
        if target_lang and target_lang.lower() not in ("auto", "default"):
            lang_instruction = (
                f"5. Response Language Override: The student has specifically requested the response in {target_lang}. "
                f"Regardless of the language of the uploaded notes or context (for example, even if the retrieved text or question is in Hindi, Kannada, or another language), "
                f"you MUST translate all extracted concepts and generate your ENTIRE answer strictly and completely in {target_lang}."
            )
        else:
            lang_instruction = (
                "5. Language Auto-Detection: Detect the primary language of the student's question and uploaded notes. "
                "Respond fluently in that same language. If technical terms are used in non-English responses, "
                "you can provide English technical terms in parentheses alongside the native language translation."
            )

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

        if history:
            for message in history:
                messages.append({"role": message["role"], "content": message["content"]})

        user_content = f"CONTEXT:\n---\n{context}\n---\n\nQUESTION: {question}"
        messages.append({"role": "user", "content": user_content})

        return await asyncio.to_thread(self._sync_generate, messages, model_override)
