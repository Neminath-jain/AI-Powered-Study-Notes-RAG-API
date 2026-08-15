import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat, Citation, ChatSession } from "../hooks/useChat";
import { useNotes } from "../hooks/useNotes";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../components/Toast";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { PDFViewerModal } from "../components/PDFViewerModal";
import { 
  Send, 
  BookOpen, 
  ArrowDown, 
  Layers, 
  X,
  Sparkles,
  Info,
  Globe,
  Share2,
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Edit2,
  Check,
  Search,
  Clock
} from "lucide-react";

export const Chat: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { notes } = useNotes();
  const { settings } = useSettings();
  const { 
    sessions,
    isLoadingSessions,
    messages, 
    isLoadingHistory, 
    createSession,
    renameSession,
    deleteSession,
    askQuestion, 
    isAsking 
  } = useChat(sessionId);

  // Left sidebar & filters state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState("");

  const [query, setQuery] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(settings.answerLanguage || "auto");

  useEffect(() => {
    if (settings.answerLanguage) {
      setSelectedLanguage(settings.answerLanguage);
    }
  }, [settings.answerLanguage]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShareChat = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast("Chat link copied to clipboard! Share this link with classmates to collaborate.", "success");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBottomBtn(isScrolledUp);
  };

  const handleCreateNewSession = async () => {
    try {
      const title = `Quick Session #${sessions.length + 1}`;
      const newSession = await createSession(title);
      navigate(`/chat/${newSession.id}`);
    } catch (err: any) {
      addToast("Failed to create new study session.", "error");
    }
  };

  const handleStartRenameSession = (e: React.MouseEvent, session: ChatSession) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingSessionTitle(session.title);
  };

  const handleSaveRenameSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingSessionTitle.trim()) return;
    try {
      await renameSession({ id, title: editingSessionTitle.trim() });
      addToast("Thread title updated.", "success");
      setEditingSessionId(null);
    } catch (err: any) {
      addToast("Failed to rename thread.", "error");
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this study thread?")) {
      try {
        await deleteSession(id);
        addToast("Thread deleted successfully.", "success");
        if (sessionId === id) {
          navigate("/dashboard");
        }
      } catch (err: any) {
        addToast(err.message || "Failed to delete thread.", "error");
      }
    }
  };

  const handleToggleNoteFilter = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAsking) return;

    const userQuery = query.trim();
    setQuery("");

    try {
      await askQuestion({
        query: userQuery,
        noteIds: selectedNoteIds.length > 0 ? selectedNoteIds : undefined,
        language: selectedLanguage,
      });
    } catch (err: any) {
      addToast(err.message || "Failed to query the note search engine.", "error");
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full gap-4 overflow-hidden relative font-sans text-[#1d1d1f]">
      
      {/* 1. ChatGPT-Style Left Sidebar for Chat History Threads */}
      {sidebarOpen && (
        <div className="w-72 flex-shrink-0 flex flex-col rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-4 shadow-sm transition-all duration-300">
          
          {/* Top Actions: + New Session & Close Sidebar Toggle */}
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3 mb-3">
            <button
              onClick={handleCreateNewSession}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all py-2.5 text-xs font-semibold text-white shadow-md shadow-[#0066cc]/25 mr-2"
            >
              <Plus size={16} />
              <span>New Session</span>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2 text-[#6e6e73] hover:bg-[#e8e8ed] hover:text-[#1d1d1f] transition-all"
              title="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* Search Threads input */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search chat history..."
              className="w-full rounded-full border border-[#d2d2d7] bg-[#ffffff] pl-8 pr-3 py-1.5 text-xs font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          {/* Chat Sessions Threads List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#86868b] px-2 mb-1">
              Recent Study Threads
            </span>

            {isLoadingSessions ? (
              <div className="p-4 text-center text-xs text-[#86868b]">Loading history...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#86868b] italic">No study threads found.</div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = sessionId === session.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/chat/${session.id}`)}
                    className={`group relative flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#ffffff] text-[#0066cc] font-bold border border-[#0066cc]/40 shadow-sm"
                        : "text-[#1d1d1f] hover:bg-[#ffffff]/80 border border-transparent font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                      <MessageSquare size={15} className={isActive ? "text-[#0066cc]" : "text-[#86868b]"} />
                      
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editingSessionTitle}
                            onChange={(e) => setEditingSessionTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-lg bg-[#f5f5f7] border border-[#0066cc] px-2 py-1 text-xs text-[#1d1d1f] focus:outline-none"
                          />
                          <button
                            onClick={(e) => handleSaveRenameSession(e, session.id)}
                            className="p-1 text-[#34c759] hover:bg-[#e8e8ed] rounded-full"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-hidden">
                          <span className="block truncate">{session.title}</span>
                          <span className="text-[10px] text-[#86868b] font-normal flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons on hover */}
                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={(e) => handleStartRenameSession(e, session)}
                          className="p-1 text-[#6e6e73] hover:text-[#0066cc] hover:bg-[#f5f5f7] rounded-full"
                          title="Rename thread"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="p-1 text-[#6e6e73] hover:text-[#ff3b30] hover:bg-[#f5f5f7] rounded-full"
                          title="Delete thread"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* 2. Main Messages Thread workspace */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm">
        
        {/* Scopes Filter Top panel */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f7] px-6 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            {/* Open Sidebar Toggle button when collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-full p-2 text-[#6e6e73] hover:bg-[#ffffff] hover:text-[#0066cc] border border-[#d2d2d7] transition-all"
                title="Open Chat Threads Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}

            <div className="flex items-center gap-2">
              <Layers className="text-[#0066cc]" size={18} />
              <span className="text-xs font-bold text-[#1d1d1f]">Scope Filter</span>
              {selectedNoteIds.length > 0 && (
                <span className="rounded-full bg-[#0066cc]/10 px-2.5 py-0.5 text-[10px] text-[#0066cc] font-bold">
                  {selectedNoteIds.length} notes active
                </span>
              )}
            </div>

            {/* Language Selection Selector */}
            <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#d2d2d7] rounded-full px-3 py-1 text-xs">
              <Globe size={14} className="text-[#0066cc]" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-xs text-[#1d1d1f] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="auto">Auto-Detect Language</option>
                <option value="en">English</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareChat}
              className="flex items-center gap-1.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 px-3.5 py-1.5 text-xs font-semibold text-[#0066cc] hover:bg-[#0066cc]/20 transition-all"
            >
              <Share2 size={14} />
              <span>Share Link</span>
            </button>
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className="text-xs font-bold text-[#0066cc] hover:underline"
            >
              {filterPanelOpen ? "Hide Filters" : "Select Specific Notes"}
            </button>
          </div>
        </div>

        {/* Notes selectors list */}
        {filterPanelOpen && (
          <div className="border-b border-[#e0e0e0] bg-[#f5f5f7] p-4 max-h-40 overflow-y-auto">
            <span className="block text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">
              Select specific course notes (defaults to all indexed documents if unselected)
            </span>
            <div className="flex flex-wrap gap-2">
              {notes.length === 0 ? (
                <span className="text-xs text-[#86868b] italic">No notes uploaded yet.</span>
              ) : (
                notes.map((note) => {
                  const isChecked = selectedNoteIds.includes(note.id);
                  return (
                    <button
                      key={note.id}
                      onClick={() => handleToggleNoteFilter(note.id)}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                        isChecked
                          ? "bg-[#0066cc] border-[#0066cc] text-white shadow-sm"
                          : "bg-[#ffffff] border-[#d2d2d7] text-[#6e6e73] hover:border-[#0066cc]"
                      }`}
                    >
                      <BookOpen size={13} />
                      <span className="max-w-[140px] truncate">{note.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Message Logs History viewport */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#ffffff]"
        >
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center text-xs text-[#86868b]">
              Loading chat room threads...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="p-4 bg-[#0066cc]/10 rounded-2xl text-[#0066cc]">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight">Ask your Course Material</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Type a question below. The AI looks up relevant pages from your uploaded notes and constructs answers backed by citations.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`fade-in flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-2xl rounded-3xl px-6 py-4.5 shadow-sm border ${
                      isUser
                        ? "bg-[#0066cc] text-white font-medium border-[#0066cc] rounded-br-none"
                        : "bg-[#f5f5f7] text-[#1d1d1f] border-[#e0e0e0] rounded-bl-none"
                    }`}
                  >
                    <MarkdownRenderer content={message.content} />
                    
                    {/* Citations panel indicators */}
                    {!isUser && message.citations && message.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] mr-1 flex items-center gap-1">
                          <Info size={12} />
                          <span>Grounded Source:</span>
                        </span>
                        {message.citations.map((citation, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setSelectedCitation(citation)}
                            className="rounded-full bg-[#ffffff] border border-[#d2d2d7] px-3 py-1 text-xs text-[#0066cc] hover:border-[#0066cc] transition-all font-semibold shadow-2xs"
                          >
                            {settings.citationFormat === "compact"
                              ? `Page ${citation.page}`
                              : `${citation.note_title}, p. ${citation.page}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isAsking && (
            <div className="flex gap-4 justify-start fade-in">
              <div className="bg-[#f5f5f7] rounded-3xl rounded-bl-none border border-[#e0e0e0] px-6 py-4 flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0066cc] [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0066cc] [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#0066cc]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Jump to bottom trigger */}
        {showScrollBottomBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-8 rounded-full bg-[#0066cc] p-3 text-white hover:bg-[#0071e3] shadow-lg transition-transform hover:scale-105"
          >
            <ArrowDown size={18} />
          </button>
        )}

        {/* Input Text Form Area */}
        <form onSubmit={handleSend} className="border-t border-[#e0e0e0] bg-[#f5f5f7] p-4 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isAsking}
            placeholder="Ask a question about your uploaded course notes (e.g. Explain MapReduce in 10 marks format)..."
            className="flex-1 rounded-full border border-[#d2d2d7] bg-[#ffffff] px-5 py-3 text-xs sm:text-sm font-medium text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0066cc] focus:outline-none focus:ring-1 focus:ring-[#0066cc] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!query.trim() || isAsking}
            className="rounded-full bg-[#0066cc] px-5 py-3 text-white hover:bg-[#0071e3] shadow-md shadow-[#0066cc]/20 transition-all disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Slide-out Citation details panel */}
      {selectedCitation && (
        <div className="absolute inset-y-0 right-0 z-20 w-96 max-w-full bg-[#ffffff] border-l border-[#e0e0e0] shadow-2xl flex flex-col p-6 fade-in font-sans">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3 mb-4">
            <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
              <BookOpen size={18} className="text-[#0066cc]" />
              <span>Verified Citation Snippet</span>
            </h3>
            <button
              onClick={() => setSelectedCitation(null)}
              className="rounded-full p-1 text-[#6e6e73] hover:bg-[#f5f5f7]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 text-xs sm:text-sm">
            <div>
              <span className="block text-xs font-bold text-[#86868b] uppercase tracking-wider">Source Document</span>
              <span className="block mt-1 text-sm font-bold text-[#1d1d1f]">{selectedCitation.note_title}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-[#86868b] uppercase tracking-wider">Page Number</span>
                <span className="block mt-1 text-xs sm:text-sm text-[#6e6e73] font-semibold">Page {selectedCitation.page}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#86868b] uppercase tracking-wider">Match Score</span>
                <span className="block mt-1 text-xs sm:text-sm text-[#34c759] font-bold">
                  {(selectedCitation.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setPdfModalOpen(true)}
              className="w-full mt-2 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 py-2.5 text-xs font-bold text-[#0066cc] hover:bg-[#0066cc]/20 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={15} />
              <span>View Page {selectedCitation.page} in Full PDF</span>
            </button>

            <div className="border-t border-[#e0e0e0] pt-4">
              <span className="block text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2">Original Extracted Text</span>
              <div className="rounded-2xl bg-[#f5f5f7] p-4 text-xs font-mono leading-relaxed text-[#1d1d1f] whitespace-pre-wrap border border-[#e0e0e0]">
                "{selectedCitation.text}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal Portal */}
      {selectedCitation && (
        <PDFViewerModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          title={selectedCitation.note_title}
          pdfUrl={`http://localhost:8000/static/storage/notes/${selectedCitation.note_id}.pdf`}
          initialPage={selectedCitation.page}
        />
      )}
    </div>
  );
};

export default Chat;
