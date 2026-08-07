import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  LayoutDashboard, 
  FileText, 
  BrainCircuit, 
  Settings, 
  MessageSquare, 
  Plus, 
  Upload, 
  X,
  ChevronRight
} from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import { useChat } from "../hooks/useChat";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { notes } = useNotes();
  const { sessions, createSession } = useChat();

  // Keyboard shortcut listener (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open palette
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
    setQuery("");
  };

  const handleCreateNewChat = async () => {
    try {
      const title = `Quick Session #${sessions.length + 1}`;
      const newSession = await createSession(title);
      navigate(`/chat/${newSession.id}`);
      onClose();
      setQuery("");
    } catch (err) {
      console.error("Failed to create chat session", err);
    }
  };

  // Filter notes & chats by query
  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase()));
  const filteredChats = sessions.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#000000]/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#e0e0e0] bg-[#ffffff] shadow-2xl overflow-hidden font-sans text-[#1d1d1f]">
        
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-[#e0e0e0] px-5 py-4 bg-[#f5f5f7]">
          <Search size={20} className="text-[#0066cc]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, study threads, or jump to page... (Esc to exit)"
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-[#1d1d1f] placeholder-[#86868b] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#e8e8ed] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-4 space-y-5">
          
          {/* Quick Actions */}
          {!query && (
            <div>
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Quick Actions</span>
              <div className="mt-2 space-y-1">
                <button
                  onClick={handleCreateNewChat}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-[#0066cc]/10 text-[#0066cc]">
                      <Plus size={16} />
                    </div>
                    <span>Start New AI Study Session</span>
                  </div>
                  <ChevronRight size={16} className="text-[#86868b] group-hover:text-[#0066cc]" />
                </button>

                <button
                  onClick={() => handleNavigate("/notes")}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-[#34c759]/10 text-[#34c759]">
                      <Upload size={16} />
                    </div>
                    <span>Upload New Course PDF Note</span>
                  </div>
                  <ChevronRight size={16} className="text-[#86868b] group-hover:text-[#34c759]" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div>
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Navigation Pages</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { name: "Notes Library", href: "/notes", icon: FileText },
                { name: "AI Study & Practice", href: "/quizzes", icon: BrainCircuit },
                { name: "Settings", href: "/settings", icon: Settings },
              ].map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.name}
                    onClick={() => handleNavigate(nav.href)}
                    className="flex items-center gap-3 rounded-2xl p-3 text-xs sm:text-sm font-semibold text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#0066cc] hover:text-white transition-all text-left group"
                  >
                    <Icon size={16} className="text-[#0066cc] group-hover:text-white" />
                    <span>{nav.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matching Notes */}
          {filteredNotes.length > 0 && (
            <div>
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Indexed Notes ({filteredNotes.length})</span>
              <div className="mt-2 space-y-1">
                {filteredNotes.slice(0, 4).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleNavigate("/notes")}
                    className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all text-left"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={16} className="text-[#0066cc]" />
                      <span className="truncate">{note.title}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#34c759] bg-[#34c759]/10 px-2 py-0.5 rounded-full">
                      {note.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Study Threads */}
          {filteredChats.length > 0 && (
            <div>
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#86868b]">Active Study Threads ({filteredChats.length})</span>
              <div className="mt-2 space-y-1">
                {filteredChats.slice(0, 4).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleNavigate(`/chat/${session.id}`)}
                    className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all text-left"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className="text-[#34c759]" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <ChevronRight size={14} className="text-[#86868b]" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Command Palette Footer */}
        <div className="border-t border-[#e0e0e0] bg-[#f5f5f7] px-5 py-2.5 flex items-center justify-between text-xs text-[#86868b]">
          <span>Type to filter items</span>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-[#ffffff] border border-[#d2d2d7] rounded-md font-mono text-[10px]">⌘K</kbd>
            <span>or</span>
            <kbd className="px-2 py-0.5 bg-[#ffffff] border border-[#d2d2d7] rounded-md font-mono text-[10px]">ESC</kbd>
          </div>
        </div>

      </div>
    </div>
  );
};
