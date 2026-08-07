import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotes } from "../hooks/useNotes";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../contexts/AuthContext";
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  BrainCircuit, 
  Award, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { notes, isLoading: loadingNotes } = useNotes();
  const { sessions, isLoadingSessions, createSession } = useChat();
  const navigate = useNavigate();

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleStartQuickChat = async () => {
    try {
      const title = `Quick Session #${sessions.length + 1}`;
      const newSession = await createSession(title);
      navigate(`/chat/${newSession.id}`);
    } catch (err) {
      console.error("Failed to start quick session", err);
    }
  };

  const handleToggleAudioOverview = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const overviewText = notes.length > 0 
        ? `Welcome back to Student Knowledge AI. You have ${notes.length} uploaded course materials ready. Your latest note is ${notes[0].title}.`
        : "Welcome back to Student Knowledge AI. Upload your course PDF notes to begin asking questions and generating AI study quizzes.";
      
      const utterance = new SpeechSynthesisUtterance(overviewText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const recentNotes = notes.slice(0, 5);
  const recentChats = sessions.slice(0, 5);

  return (
    <div className="space-y-8 font-sans text-[#1d1d1f]">
      
      {/* 1. Student Hero Banner Tile */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0066cc]/30 bg-[#0066cc]/10 px-3.5 py-1 text-xs font-bold text-[#0066cc]">
            <Sparkles size={14} />
            <span>Active Student Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f] leading-tight">
            Welcome back, <span className="text-[#0066cc]">{user?.email?.split("@")[0]}</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6e6e73]">
            {notes.length > 0
              ? `${notes.length} course documents indexed. Ask questions or launch AI flashcard quizzes.`
              : "Upload your syllabus, lecture slides, or textbook chapters to get started."}
          </p>
        </div>

        {/* Audio Briefing Controls */}
        <div className="w-full md:w-auto rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0066cc]/10 text-[#0066cc]">
              <Volume2 size={20} />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#1d1d1f]">Audio Course Briefing</span>
              <span className="block text-[11px] text-[#6e6e73]">AI Voice Summary</span>
            </div>
          </div>
          <button
            onClick={handleToggleAudioOverview}
            className={`w-full rounded-full px-5 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
              isPlayingAudio
                ? "bg-[#ff3b30] text-white"
                : "bg-[#0066cc] hover:bg-[#0071e3] text-white shadow-[#0066cc]/20"
            }`}
          >
            {isPlayingAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isPlayingAudio ? "Stop Audio" : "Play Overview"}</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Indexed Notes</span>
            <span className="block mt-2 text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              {loadingNotes ? "..." : notes.length}
            </span>
          </div>
          <div className="p-3.5 bg-[#0066cc]/10 rounded-2xl text-[#0066cc]">
            <FileText size={26} />
          </div>
        </div>

        <div className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Active Study Threads</span>
            <span className="block mt-2 text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              {isLoadingSessions ? "..." : sessions.length}
            </span>
          </div>
          <div className="p-3.5 bg-[#34c759]/10 rounded-2xl text-[#34c759]">
            <MessageSquare size={26} />
          </div>
        </div>

        <div className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-6 flex items-center justify-between shadow-sm">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Course Mastery</span>
            <span className="block mt-2 text-3xl font-semibold text-[#af52de] tracking-tight">
              {notes.length > 0 ? "94%" : "0%"}
            </span>
          </div>
          <div className="p-3.5 bg-[#af52de]/10 rounded-2xl text-[#af52de]">
            <Award size={26} />
          </div>
        </div>
      </div>

      {/* 3. Main Content Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        
        {/* Left Panel: Recent Course Notes */}
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-7 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[#0066cc]" />
                <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wide">Recent Course Notes</h2>
              </div>
              <Link to="/notes" className="text-xs font-semibold text-[#0066cc] hover:underline flex items-center gap-1">
                <span>View Library</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {loadingNotes ? (
              <div className="py-12 text-center text-xs text-[#86868b]">Loading notes library...</div>
            ) : recentNotes.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#86868b] space-y-3">
                <BookOpen size={24} className="mx-auto text-[#0066cc]" />
                <p className="font-semibold text-[#1d1d1f]">No course notes uploaded yet.</p>
                <Link
                  to="/notes"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0066cc] px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  Upload First PDF
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#e0e0e0]">
                {recentNotes.map((note) => (
                  <div key={note.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <span className="block truncate text-sm font-semibold text-[#1d1d1f]">{note.title}</span>
                      <span className="text-xs text-[#86868b] flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} />
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          note.status === "completed"
                            ? "bg-[#34c759]/10 text-[#34c759]"
                            : note.status === "failed"
                            ? "bg-[#ff3b30]/10 text-[#ff3b30]"
                            : "bg-[#ff9500]/10 text-[#ff9500]"
                        }`}
                      >
                        {note.status}
                      </span>
                      <Link
                        to="/notes"
                        className="rounded-full p-1.5 text-[#0066cc] hover:bg-[#0066cc]/10"
                        title="Study note"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Recent Study Threads */}
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-7 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <MessageSquare size={18} className="text-[#34c759]" />
                <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wide">Recent Study Threads</h2>
              </div>
              <button
                onClick={handleStartQuickChat}
                className="text-xs font-semibold text-[#0066cc] hover:underline flex items-center gap-1"
              >
                <Plus size={14} />
                <span>New Thread</span>
              </button>
            </div>

            {isLoadingSessions ? (
              <div className="py-12 text-center text-xs text-[#86868b]">Loading study threads...</div>
            ) : recentChats.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#86868b] space-y-3">
                <MessageSquare size={24} className="mx-auto text-[#34c759]" />
                <p className="font-semibold text-[#1d1d1f]">No active conversations yet.</p>
                <button
                  onClick={handleStartQuickChat}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0066cc] px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#e0e0e0]">
                {recentChats.map((session) => (
                  <Link
                    key={session.id}
                    to={`/chat/${session.id}`}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#ffffff] px-3 rounded-2xl transition-all group"
                  >
                    <div className="overflow-hidden">
                      <span className="block truncate text-sm font-semibold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors">
                        {session.title}
                      </span>
                      <span className="text-xs text-[#86868b] flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} />
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-[#86868b] group-hover:text-[#1d1d1f] transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. AI Practice Hub Callout Banner */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-[#0066cc]/10 rounded-2xl text-[#0066cc]">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1d1d1f]">Interactive AI Study & Practice Hub</h3>
            <p className="text-xs sm:text-sm text-[#6e6e73] mt-0.5">
              Auto-generate multiple-choice quizzes and flashcards directly from your uploaded course notes.
            </p>
          </div>
        </div>

        <Link
          to="/quizzes"
          className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#0066cc]/20 flex items-center gap-2 flex-shrink-0"
        >
          <span>Launch AI Practice</span>
          <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
};

export default Dashboard;
