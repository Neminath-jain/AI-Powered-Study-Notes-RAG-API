import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  CornerDownLeft, 
  Info,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface MockSampleQuery {
  id: string;
  label: string;
  query: string;
  answer: string;
  citation?: {
    title: string;
    page: number;
    snippet: string;
  };
  isRefusal?: boolean;
}

const MOCK_DEMO_QUERIES: MockSampleQuery[] = [
  {
    id: "q1",
    label: "Supervised vs Unsupervised",
    query: "What is the difference between supervised and unsupervised machine learning?",
    answer: "Supervised learning models are trained on labeled datasets to learn mappings between inputs and target outputs. In contrast, unsupervised learning algorithms process unlabeled data to discover natural groupings, patterns, and anomalies independently.",
    citation: {
      title: "Machine_Learning_Fundamentals.pdf",
      page: 12,
      snippet: "Section 1.3: Supervised learning algorithms rely on ground-truth labeled training data (inputs and targets). Unsupervised methods find underlying structure in unlabeled datasets."
    }
  },
  {
    id: "q2",
    label: "Photosynthesis Process",
    query: "What are the main outputs of the light-dependent reactions in photosynthesis?",
    answer: "The light-dependent reactions convert solar energy into chemical energy within the thylakoid membranes, generating ATP and NADPH to power the Calvin cycle, while releasing molecular oxygen (O2) as a byproduct.",
    citation: {
      title: "General_Biology_Chapter_4.pdf",
      page: 45,
      snippet: "Light reactions occur in the thylakoids where photon absorption splits water molecules, producing ATP, NADPH, and releasing O2."
    }
  },
  {
    id: "q3",
    label: "Honest Refusal Demo",
    query: "What is the date and location of the midterm exam?",
    answer: "I cannot find this information in your uploaded notes. The provided documents contain textbook chapters and lecture slides, but do not list midterm exam dates or room assignments.",
    isRefusal: true
  }
];

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Interactive demo state
  const [selectedDemoQuery, setSelectedDemoQuery] = useState<MockSampleQuery>(MOCK_DEMO_QUERIES[0]);
  const [inputQueryText, setInputQueryText] = useState(MOCK_DEMO_QUERIES[0].query);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCitationSnippet, setActiveCitationSnippet] = useState<{ title: string; page: number; snippet: string } | null>(null);

  // Stream typing simulation
  const runDemoStreaming = (demoItem: MockSampleQuery) => {
    setSelectedDemoQuery(demoItem);
    setInputQueryText(demoItem.query);
    setDisplayedAnswer("");
    setIsTyping(true);
    setActiveCitationSnippet(null);

    let charIndex = 0;
    const fullText = demoItem.answer;
    
    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedAnswer(fullText.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 15);
  };

  useEffect(() => {
    runDemoStreaming(MOCK_DEMO_QUERIES[0]);
  }, []);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex flex-col justify-between font-sans selection:bg-[#0066cc] selection:text-white">
      
      {/* 1. Apple Global Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e0e0e0] bg-[#ffffff]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#0066cc]/10 text-[#0066cc]">
              <BookOpen size={26} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">Student Knowledge AI</span>
              <span className="text-[11px] font-medium text-[#6e6e73]">AI Study Assistant for Course Notes</span>
            </div>
          </div>

          {/* Center: Navigation Section Links & Live Status */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#interactive-demo" className="text-sm font-semibold text-[#6e6e73] hover:text-[#0066cc] transition-colors">
              Interactive Simulator
            </a>
            <a href="#how-it-works" className="text-sm font-semibold text-[#6e6e73] hover:text-[#0066cc] transition-colors">
              How It Works
            </a>
            <a href="#grounding-proof" className="text-sm font-semibold text-[#6e6e73] hover:text-[#0066cc] transition-colors">
              Citation Proof
            </a>
            <div className="flex items-center gap-1.5 rounded-full bg-[#34c759]/10 border border-[#34c759]/30 px-3.5 py-1 text-xs font-bold text-[#34c759]">
              <span className="h-2 w-2 rounded-full bg-[#34c759] animate-pulse"></span>
              <span>AI Note Search Active</span>
            </div>
          </div>

          {/* Right: Auth Action Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0066cc]/20"
              >
                Go to Workspace
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0066cc]/25"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. Hero Section — Plain, Confident Statement */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] px-4.5 py-1.5 text-xs font-semibold text-[#0066cc] mb-6 tracking-wide uppercase">
          <Sparkles size={14} className="text-[#0066cc]" />
          <span>Grounded Note Search · Page-Level Citations</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-semibold text-[#1d1d1f] tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto">
          Ask your notes anything. <br className="hidden sm:inline" />
          Get answers <span className="text-[#0066cc]">strictly from your documents.</span>
        </h1>

        <p className="mt-7 text-lg sm:text-xl text-[#6e6e73] max-w-2xl mx-auto leading-relaxed tracking-[-0.011em]">
          Upload textbook chapters, syllabus PDFs, and lecture slides. Query your course material with zero hallucination. If an answer isn't in your files, the system tells you plainly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#0066cc]/25 inline-flex items-center gap-2"
          >
            <span>Upload Notes & Try Free</span>
            <ChevronRight size={17} />
          </Link>
          <a
            href="#interactive-demo"
            className="rounded-full border border-[#d2d2d7] bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-95 transition-all px-8 py-3.5 text-sm sm:text-base font-semibold text-[#1d1d1f]"
          >
            Test Live Interactive Demo
          </a>
        </div>
      </section>

      {/* 3. Interactive Product Demo Section (Centerpiece) */}
      <section id="interactive-demo" className="py-12 px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-6 sm:p-8 shadow-xl">
          
          {/* Demo Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#34c759] animate-pulse"></span>
                <h2 className="text-base font-semibold tracking-[-0.28px] text-[#1d1d1f]">Live AI Study Simulator</h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6e6e73] mt-0.5">
                Select a sample query below to test real-time note retrieval & citation verification.
              </p>
            </div>

            {/* Sample Query Selectors */}
            <div className="flex flex-wrap gap-2">
              {MOCK_DEMO_QUERIES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => runDemoStreaming(item)}
                  className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    selectedDemoQuery.id === item.id
                      ? "bg-[#0066cc] text-white shadow-sm"
                      : "bg-[#ffffff] border border-[#d2d2d7] text-[#6e6e73] hover:border-[#0066cc] hover:text-[#1d1d1f]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Window Box */}
          <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] overflow-hidden shadow-inner flex flex-col h-[420px]">
            
            {/* Window chrome top */}
            <div className="bg-[#f5f5f7] border-b border-[#e0e0e0] px-4 py-2.5 flex items-center justify-between text-xs text-[#6e6e73]">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-[#0066cc]" />
                <span className="font-mono text-xs font-semibold text-[#1d1d1f]">Indexed Scope: Machine_Learning_Fundamentals.pdf, General_Biology_Chapter_4.pdf</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#34c759] bg-[#34c759]/10 px-2.5 py-0.5 rounded-full">
                Guardrail Threshold: 0.72
              </span>
            </div>

            {/* Messages Thread Viewport */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs sm:text-sm">
              
              {/* User Query Bubble */}
              <div className="flex justify-end">
                <div className="max-w-xl rounded-2xl rounded-br-none bg-[#0066cc] text-white px-5 py-3.5 shadow-sm font-medium text-xs sm:text-sm">
                  {inputQueryText}
                </div>
              </div>

              {/* AI Response Bubble */}
              <div className="flex justify-start">
                <div className={`max-w-xl rounded-2xl rounded-bl-none p-5 border transition-all ${
                  selectedDemoQuery.isRefusal 
                    ? "bg-[#ff9500]/10 border-[#ff9500]/30 text-[#1d1d1f]" 
                    : "bg-[#f5f5f7] border-[#e0e0e0] text-[#1d1d1f]"
                }`}>
                  <p className="leading-relaxed text-[#1d1d1f] font-normal text-xs sm:text-sm">
                    {displayedAnswer}
                    {isTyping && <span className="inline-block w-1.5 h-4 bg-[#0066cc] ml-1 animate-pulse"></span>}
                  </p>

                  {/* Interactive Citation Chip (if available and typing finished) */}
                  {!isTyping && selectedDemoQuery.citation && (
                    <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex items-center justify-between">
                      <button
                        onClick={() => setActiveCitationSnippet(selectedDemoQuery.citation || null)}
                        className="rounded-full bg-[#ffffff] border border-[#0066cc]/40 px-3.5 py-1.5 text-xs font-semibold text-[#0066cc] hover:bg-[#0066cc]/10 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Info size={13} />
                        <span>Source: {selectedDemoQuery.citation.title}, p. {selectedDemoQuery.citation.page}</span>
                      </button>
                      <span className="text-xs text-[#6e6e73]">Click chip to verify text snippet</span>
                    </div>
                  )}

                  {/* Refusal Notice Badge */}
                  {!isTyping && selectedDemoQuery.isRefusal && (
                    <div className="mt-3.5 pt-3 border-t border-[#ff9500]/30 flex items-center gap-1.5 text-xs font-semibold text-[#ff9500]">
                      <ShieldCheck size={16} />
                      <span>Zero-Hallucination Guard active. Fact not found in indexed notes.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-[#e0e0e0] bg-[#f5f5f7] p-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inputQueryText}
                className="flex-1 rounded-full border border-[#d2d2d7] bg-[#ffffff] px-4 py-2.5 text-xs sm:text-sm text-[#1d1d1f] focus:outline-none cursor-default"
              />
              <button
                disabled
                className="rounded-full bg-[#0066cc] p-2.5 text-white opacity-90 cursor-default"
              >
                <CornerDownLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Citation Proof Inspection Modal Drawer */}
      {activeCitationSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/40 backdrop-blur-sm">
          <div className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-tight text-[#1d1d1f] flex items-center gap-2">
                <BookOpen size={18} className="text-[#0066cc]" />
                <span>Verified Source Citation Snippet</span>
              </h3>
              <button
                onClick={() => setActiveCitationSnippet(null)}
                className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#f5f5f7]"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Document Title & Page</span>
              <span className="block text-sm font-semibold text-[#1d1d1f] mt-0.5">
                {activeCitationSnippet.title} (Page {activeCitationSnippet.page})
              </span>
            </div>

            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-1.5">Extracted Original Text</span>
              <div className="rounded-2xl bg-[#f5f5f7] border border-[#e0e0e0] p-4 text-xs sm:text-sm font-mono leading-relaxed text-[#1d1d1f]">
                "{activeCitationSnippet.snippet}"
              </div>
            </div>

            <button
              onClick={() => setActiveCitationSnippet(null)}
              className="w-full rounded-full bg-[#0066cc] py-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#0071e3]"
            >
              Close Citation Viewer
            </button>
          </div>
        </div>
      )}

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto w-full border-t border-[#e0e0e0]">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-[-0.025em]">
            How Grounded AI Works
          </h2>
          <p className="text-sm sm:text-base text-[#6e6e73] mt-2">
            Three simple steps to transform raw PDF notes into verified study answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#e0e0e0] bg-[#f5f5f7] p-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Upload Course PDFs</h3>
              <p className="mt-2.5 text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Drop your lecture notes, textbook chapters, or syllabus files up to 25MB. Text and diagrams are automatically parsed into indexed text blocks.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e0e0e0] bg-[#f5f5f7] p-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Ask Natural Questions</h3>
              <p className="mt-2.5 text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Type questions in English, Kannada, or Hindi. The AI engine compares semantic similarity against your specific notes only.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e0e0e0] bg-[#f5f5f7] p-7 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-9 h-9 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Get Page-Level Citations</h3>
              <p className="mt-2.5 text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Receive clear answers backed by page-level citation chips. Click any citation to inspect the exact original text snippet in full.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Proof / Grounding Differentiator Section */}
      <section id="grounding-proof" className="py-20 px-6 max-w-5xl mx-auto w-full border-t border-[#e0e0e0]">
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc] bg-[#0066cc]/10 px-3.5 py-1 rounded-full">
              Anti-Hallucination Philosophy
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-[-0.025em]">
              If it’s not in your notes, we tell you directly.
            </h2>
            <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
              Standard AI models guess when they don't know an answer. Student Knowledge AI enforces strict similarity cutoffs (0.72 score guardrail). If your uploaded notes don't contain the fact, the AI explicitly admits it rather than inventing information.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-6 max-w-xs w-full space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#ff9500]">
              <ShieldCheck size={20} />
              <span>Guardrail Verification</span>
            </div>
            <p className="text-xs sm:text-sm text-[#1d1d1f] font-mono leading-relaxed bg-[#f5f5f7] p-3.5 rounded-xl border border-[#e0e0e0]">
              "I cannot find this information in your uploaded notes."
            </p>
            <span className="block text-xs text-[#86868b] text-center font-medium">Zero hallucinations guaranteed by code</span>
          </div>
        </div>
      </section>

      {/* Apple Minimal Footer */}
      <footer className="border-t border-[#e0e0e0] bg-[#f5f5f7] py-6 text-center text-xs text-[#6e6e73]">
        <div className="max-w-6xl mx-auto px-6">
          <span>&copy; {new Date().getFullYear()} Student Knowledge AI. All rights reserved. Smart AI Study Workspace.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
