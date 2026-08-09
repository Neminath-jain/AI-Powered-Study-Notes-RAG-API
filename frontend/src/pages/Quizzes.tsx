import React, { useState } from "react";
import { useNotes } from "../hooks/useNotes";
import { useStudy, Quiz, FlashcardDeck, ChapterSummary } from "../hooks/useStudy";
import { useToast } from "../components/Toast";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import {
  Layers,
  FileText,
  Sparkles,
  CheckCircle,
  XCircle,
  RotateCw,
  Award,
  ChevronRight,
  BookOpen,
  HelpCircle
} from "lucide-react";

export const Quizzes: React.FC = () => {
  const { notes } = useNotes();
  const { addToast } = useToast();
  const { generateQuiz, isGeneratingQuiz, generateFlashcards, isGeneratingFlashcards, fetchSummary } = useStudy();

  const [activeTab, setActiveTab] = useState<"quiz" | "flashcards" | "summary">("quiz");
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");

  // Quiz state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Flashcards state
  const [flashcardDeck, setFlashcardDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<ChapterSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Reset active study materials when selected note scope changes
  React.useEffect(() => {
    setQuiz(null);
    setFlashcardDeck(null);
    setSummary(null);
  }, [selectedNoteId]);

  const handleGenerateQuiz = async () => {
    try {
      setQuiz(null);
      setSubmittedQuiz(false);
      setCurrentQuestionIdx(0);
      setSelectedOptions({});
      const data = await generateQuiz({ noteId: selectedNoteId || undefined, numQuestions: 5 });
      setQuiz(data);
      addToast("AI Quiz generated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to generate quiz.", "error");
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      setFlashcardDeck(null);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      const data = await generateFlashcards({ noteId: selectedNoteId || undefined, numCards: 8 });
      setFlashcardDeck(data);
      addToast("Flashcard deck created!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to generate flashcards.", "error");
    }
  };

  const handleFetchSummary = async () => {
    try {
      setIsLoadingSummary(true);
      setSummary(null);
      const data = await fetchSummary(selectedNoteId || undefined);
      setSummary(data);
      addToast("Chapter summary loaded!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to generate summary.", "error");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct_option_idx) score++;
    });
    return score;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans text-[#1d1d1f]">
      
      {/* 1. Header Card Tile */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0066cc]/30 bg-[#0066cc]/10 px-3.5 py-1 text-xs font-bold text-[#0066cc]">
            <Sparkles size={14} />
            <span>AI Practice & Knowledge Test</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">AI Study & Practice Hub</h1>
          <p className="text-sm text-[#6e6e73]">
            Generate instant practice quizzes, flashcard decks, and chapter summaries from your course materials.
          </p>
        </div>

        {/* Source Note Selector Pill */}
        <div className="w-full md:w-auto bg-[#ffffff] border border-[#e0e0e0] rounded-2xl p-4 shadow-sm space-y-1.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Source Scope:</span>
          <select
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            className="w-full bg-[#f5f5f7] text-xs sm:text-sm font-semibold text-[#1d1d1f] border border-[#d2d2d7] rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#0066cc]"
          >
            <option value="">All Uploaded Course Notes</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Apple Segmented Tab Switcher */}
      <div className="flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] p-1.5 shadow-inner max-w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "quiz"
              ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25"
              : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#ffffff]"
          }`}
        >
          <HelpCircle size={16} />
          <span>Interactive Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "flashcards"
              ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25"
              : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#ffffff]"
          }`}
        >
          <Layers size={16} />
          <span>Flashcard Decks</span>
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "summary"
              ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25"
              : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#ffffff]"
          }`}
        >
          <FileText size={16} />
          <span>Chapter Summarizer</span>
        </button>
      </div>

      {/* Tab 1: Quiz Mode */}
      {activeTab === "quiz" && (
        <div className="space-y-6">
          {!quiz ? (
            <div className="text-center py-16 rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 space-y-4 shadow-sm">
              <div className="p-4 bg-[#0066cc]/10 rounded-2xl text-[#0066cc] w-fit mx-auto">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Generate an AI Practice Quiz</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] max-w-md mx-auto">
                Test your knowledge before exams. Our AI builds custom multiple-choice questions directly from your course notes.
              </p>
              <button
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                className="mt-3 rounded-full bg-[#0066cc] px-8 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#0071e3] shadow-md shadow-[#0066cc]/25 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isGeneratingQuiz && <RotateCw className="animate-spin" size={16} />}
                <span>{isGeneratingQuiz ? "Generating Quiz..." : "Start AI Quiz"}</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">{quiz.title}</h3>
                  <span className="text-xs font-semibold text-[#6e6e73]">
                    Question {currentQuestionIdx + 1} of {quiz.questions.length}
                  </span>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  className="flex items-center gap-1.5 text-xs text-[#0066cc] hover:underline font-bold"
                >
                  <RotateCw size={14} />
                  <span>Generate New Quiz</span>
                </button>
              </div>

              {/* Current Question View */}
              {quiz.questions[currentQuestionIdx] && (
                <div className="space-y-5">
                  <h4 className="text-base sm:text-lg font-bold text-[#1d1d1f]">
                    {currentQuestionIdx + 1}. {quiz.questions[currentQuestionIdx].question_text}
                  </h4>

                  <div className="space-y-3">
                    {quiz.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                      const isSelected = selectedOptions[currentQuestionIdx] === optIdx;
                      const isCorrect = quiz.questions[currentQuestionIdx].correct_option_idx === optIdx;
                      
                      let btnStyle = "border-[#e0e0e0] bg-[#ffffff] text-[#1d1d1f] hover:border-[#0066cc]";
                      if (submittedQuiz) {
                        if (isCorrect) btnStyle = "border-[#34c759] bg-[#34c759]/10 text-[#34c759] font-bold";
                        else if (isSelected && !isCorrect) btnStyle = "border-[#ff3b30] bg-[#ff3b30]/10 text-[#ff3b30]";
                      } else if (isSelected) {
                        btnStyle = "border-[#0066cc] bg-[#0066cc]/10 text-[#0066cc] font-bold ring-2 ring-[#0066cc]/20";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submittedQuiz}
                          onClick={() => setSelectedOptions({ ...selectedOptions, [currentQuestionIdx]: optIdx })}
                          className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between shadow-xs ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {submittedQuiz && isCorrect && <CheckCircle size={18} className="text-[#34c759]" />}
                          {submittedQuiz && isSelected && !isCorrect && <XCircle size={18} className="text-[#ff3b30]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation box after submission */}
                  {submittedQuiz && (
                    <div className="p-5 bg-[#ffffff] border border-[#e0e0e0] rounded-2xl text-xs sm:text-sm space-y-1 shadow-sm">
                      <span className="font-bold text-[#0066cc] block uppercase tracking-wider">Verified Explanation:</span>
                      <p className="text-[#1d1d1f] leading-relaxed">
                        {quiz.questions[currentQuestionIdx].explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Navigation Bar */}
              <div className="flex items-center justify-between pt-5 border-t border-[#e0e0e0]">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                  className="px-5 py-2.5 rounded-full bg-[#ffffff] border border-[#e0e0e0] text-xs font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed] disabled:opacity-40"
                >
                  Previous
                </button>

                {!submittedQuiz ? (
                  currentQuestionIdx === quiz.questions.length - 1 ? (
                    <button
                      onClick={() => setSubmittedQuiz(true)}
                      className="px-7 py-2.5 rounded-full bg-[#34c759] text-xs font-bold text-white hover:bg-[#30d158] shadow-md shadow-[#34c759]/25"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                      className="px-6 py-2.5 rounded-full bg-[#0066cc] text-xs font-semibold text-white hover:bg-[#0071e3] inline-flex items-center gap-1 shadow-md shadow-[#0066cc]/25"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-xs sm:text-sm font-bold text-[#34c759] flex items-center gap-1.5">
                      <Award size={18} />
                      <span>Score: {calculateScore()} / {quiz.questions.length}</span>
                    </span>
                    {currentQuestionIdx < quiz.questions.length - 1 && (
                      <button
                        onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                        className="px-5 py-2.5 rounded-full bg-[#0066cc] text-xs font-semibold text-white"
                      >
                        Next Explanation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Flashcards Mode */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          {!flashcardDeck ? (
            <div className="text-center py-16 rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 space-y-4 shadow-sm">
              <div className="p-4 bg-[#0066cc]/10 rounded-2xl text-[#0066cc] w-fit mx-auto">
                <Layers size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Generate Flashcards Deck</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] max-w-md mx-auto">
                Create interactive study flashcards to memorize definitions, key terms, and formulas efficiently.
              </p>
              <button
                onClick={handleGenerateFlashcards}
                disabled={isGeneratingFlashcards}
                className="mt-3 rounded-full bg-[#0066cc] px-8 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#0071e3] shadow-md shadow-[#0066cc]/25 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isGeneratingFlashcards && <RotateCw className="animate-spin" size={16} />}
                <span>{isGeneratingFlashcards ? "Building Cards..." : "Create Flashcards"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">{flashcardDeck.title}</h3>
                <span className="text-xs font-bold text-[#6e6e73]">
                  Card {currentCardIdx + 1} of {flashcardDeck.cards.length}
                </span>
              </div>

              {/* Interactive Flippable Card */}
              {flashcardDeck.cards[currentCardIdx] && (
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer h-80 w-full bg-[#f5f5f7] border border-[#e0e0e0] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-md transition-transform duration-300 hover:scale-[1.01]"
                >
                  <span className="text-xs uppercase font-bold tracking-wider text-[#0066cc] mb-4 bg-[#0066cc]/10 px-3 py-1 rounded-full">
                    {isFlipped ? "Answer (Click to Flip)" : "Term / Question (Click to Flip)"}
                  </span>
                  <p className="text-base sm:text-xl font-bold text-[#1d1d1f] leading-relaxed max-w-xl">
                    {isFlipped ? flashcardDeck.cards[currentCardIdx].back : flashcardDeck.cards[currentCardIdx].front}
                  </p>
                </div>
              )}

              {/* Flashcards Navigation */}
              <div className="flex items-center justify-between">
                <button
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setCurrentCardIdx((prev) => prev - 1);
                    setIsFlipped(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed] disabled:opacity-40"
                >
                  Previous Card
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-6 py-2.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 text-xs font-bold text-[#0066cc] hover:bg-[#0066cc]/20"
                >
                  Flip Card
                </button>
                <button
                  disabled={currentCardIdx === flashcardDeck.cards.length - 1}
                  onClick={() => {
                    setCurrentCardIdx((prev) => prev + 1);
                    setIsFlipped(false);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-xs font-semibold text-[#1d1d1f] hover:bg-[#e8e8ed] disabled:opacity-40"
                >
                  Next Card
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Summary & Cheat Sheet Mode */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {!summary ? (
            <div className="text-center py-16 rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 space-y-4 shadow-sm">
              <div className="p-4 bg-[#0066cc]/10 rounded-2xl text-[#0066cc] w-fit mx-auto">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Generate Executive Chapter Summary</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] max-w-md mx-auto">
                Extract high-yield takeaways, concept definitions, and formula cheat sheets instantly.
              </p>
              <button
                onClick={handleFetchSummary}
                disabled={isLoadingSummary}
                className="mt-3 rounded-full bg-[#0066cc] px-8 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#0071e3] shadow-md shadow-[#0066cc]/25 active:scale-95 transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isLoadingSummary && <RotateCw className="animate-spin" size={16} />}
                <span>{isLoadingSummary ? "Summarizing..." : "Generate Summary"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 bg-[#f5f5f7] border border-[#e0e0e0] rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[#1d1d1f] border-b border-[#e0e0e0] pb-4 tracking-tight">{summary.title}</h3>

              {/* Key Takeaways */}
              <div>
                <h4 className="text-xs uppercase font-bold text-[#0066cc] tracking-wider mb-3">Key Takeaways</h4>
                <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#1d1d1f] font-medium">
                  {summary.key_takeaways.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Core Concepts */}
              <div>
                <h4 className="text-xs uppercase font-bold text-[#0066cc] tracking-wider mb-3">Core Concepts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summary.core_concepts.map((c, idx) => (
                    <div key={idx} className="p-4 bg-[#ffffff] border border-[#e0e0e0] rounded-2xl text-xs sm:text-sm space-y-1 shadow-xs">
                      <span className="font-bold text-[#1d1d1f] block">{c.term}</span>
                      <p className="text-[#6e6e73] leading-relaxed">{c.definition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concept Cheat Sheet Markdown */}
              <div>
                <h4 className="text-xs uppercase font-bold text-[#0066cc] tracking-wider mb-3">Exam Cheat Sheet</h4>
                <div className="p-6 bg-[#ffffff] border border-[#e0e0e0] rounded-2xl text-xs sm:text-sm text-[#1d1d1f] shadow-xs">
                  <MarkdownRenderer content={summary.cheat_sheet} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
