import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../hooks/useChat";
import { CommandPalette } from "../components/CommandPalette";
import { 
  LayoutDashboard, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  MessageSquare, 
  Plus, 
  Trash2,
  BookOpen,
  BrainCircuit,
  Search,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threadsDrawerOpen, setThreadsDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { sessions, createSession, deleteSession } = useChat();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Notes Library", href: "/notes", icon: FileText },
    { name: "AI Study & Practice", href: "/quizzes", icon: BrainCircuit },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const handleCreateNewChat = async () => {
    try {
      const title = `Quick Session #${sessions.length + 1}`;
      const newSession = await createSession(title);
      navigate(`/chat/${newSession.id}`);
      setThreadsDrawerOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Failed to create chat session", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this study thread?")) {
      try {
        await deleteSession(id);
        if (location.pathname.startsWith(`/chat/${id}`)) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Failed to delete session", err);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#ffffff] font-sans text-[#1d1d1f] selection:bg-[#0066cc] selection:text-white">
      
      {/* Global ⌘K Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Apple Frosted Glass Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full h-18 sm:h-20 border-b border-[#e0e0e0] bg-[#ffffff]/90 backdrop-blur-xl transition-all">
        <div className="w-full max-w-full px-4 sm:px-6 md:px-8 h-full flex items-center justify-between gap-3">
          
          {/* Left Cluster: Brand Logo & ⌘K Search Pill */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
              <div className="p-2 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] group-hover:bg-[#0066cc] group-hover:text-white transition-all flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="hidden sm:flex flex-col whitespace-nowrap">
                <span className="text-sm font-bold tracking-tight text-[#1d1d1f] whitespace-nowrap">Student Knowledge AI</span>
                <span className="text-[10px] font-semibold uppercase text-[#0066cc] whitespace-nowrap">Course Note Search</span>
              </div>
            </Link>

            {/* Command Palette Trigger Pill */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] hover:border-[#0066cc] hover:bg-[#ffffff] px-3 py-1.5 text-xs text-[#6e6e73] transition-all shadow-sm whitespace-nowrap flex-shrink-0"
              title="Search or press ⌘K"
            >
              <Search size={14} className="text-[#0066cc] flex-shrink-0" />
              <span className="hidden md:inline font-semibold whitespace-nowrap">Search ⌘K</span>
              <span className="md:hidden font-medium whitespace-nowrap">Search</span>
            </button>
          </div>

          {/* Center Cluster: Apple Segmented Pill Navigation Switcher (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] p-1.5 shadow-inner flex-shrink-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#0066cc] text-white shadow-md shadow-[#0066cc]/25"
                      : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#ffffff]"
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Cluster: Quick Actions, Study Threads Drawer & User Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Start New Chat Action Pill */}
            <button
              onClick={handleCreateNewChat}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#0066cc]/25 whitespace-nowrap flex-shrink-0"
            >
              <Plus size={15} />
              <span className="whitespace-nowrap">+ New Session</span>
            </button>

            {/* Study Threads Drawer Trigger */}
            <button
              onClick={() => setThreadsDrawerOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-[#f5f5f7] hover:bg-[#e8e8ed] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1d1d1f] transition-all whitespace-nowrap flex-shrink-0"
              title="View Study Threads"
            >
              <MessageSquare size={15} className="text-[#34c759] flex-shrink-0" />
              <span className="hidden 2xl:inline whitespace-nowrap">Study Threads</span>
              <span className="rounded-full bg-[#34c759] text-white px-2 py-0.5 text-[10px] font-bold">
                {sessions.length}
              </span>
            </button>

            {/* User Account Profile Pill */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-[#e0e0e0] bg-[#f5f5f7] p-1.5 pr-3 hover:bg-[#e8e8ed] transition-all flex-shrink-0"
                title={user?.email || "Account"}
              >
                <div className="w-7 h-7 rounded-full bg-[#0066cc] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                  {user?.email?.charAt(0).toUpperCase() || "S"}
                </div>
                <span className="hidden 2xl:inline text-xs font-bold text-[#1d1d1f] max-w-[90px] truncate whitespace-nowrap">
                  {user?.email?.split("@")[0]}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-3 shadow-2xl z-50 animate-fadeIn space-y-2">
                  <div className="px-3 py-2 border-b border-[#e0e0e0]">
                    <span className="block text-xs font-bold text-[#1d1d1f] truncate">{user?.email}</span>
                    <span className="block text-[10px] uppercase font-bold text-[#0066cc]">{user?.role}</span>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]"
                  >
                    <SettingsIcon size={15} className="text-[#0066cc]" />
                    <span>System Settings</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 text-left"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-full p-2 text-[#6e6e73] hover:bg-[#f5f5f7]"
            >
              <Menu size={22} />
            </button>

          </div>

        </div>
      </header>

      {/* Main Workspace Portal Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* 1. Slide-Over Study Threads Drawer */}
      {threadsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#000000]/30 backdrop-blur-xs transition-opacity"
            onClick={() => setThreadsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#ffffff] border-l border-[#e0e0e0] shadow-2xl flex flex-col h-full z-10 animate-slideInRight font-sans">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#e0e0e0] bg-[#f5f5f7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#34c759]/10 text-[#34c759]">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">Active Study Threads</h3>
                  <p className="text-xs text-[#6e6e73]">Persistent AI conversation rooms</p>
                </div>
              </div>

              <button
                onClick={() => setThreadsDrawerOpen(false)}
                className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#e8e8ed]"
              >
                <X size={18} />
              </button>
            </div>

            {/* New Thread Launcher CTA */}
            <div className="p-4 border-b border-[#e0e0e0] bg-[#ffffff]">
              <button
                onClick={handleCreateNewChat}
                className="w-full rounded-2xl bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all py-3 text-xs sm:text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Start New Study Thread</span>
              </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#86868b] space-y-2">
                  <Sparkles size={24} className="mx-auto text-[#0066cc]" />
                  <p>No active study threads yet.</p>
                  <p>Click above to launch your first session!</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = location.pathname === `/chat/${session.id}`;
                  return (
                    <div
                      key={session.id}
                      className={`group flex items-center justify-between rounded-2xl p-3.5 border transition-all ${
                        isActive
                          ? "bg-[#0066cc]/10 border-[#0066cc]/40 text-[#0066cc] shadow-sm"
                          : "bg-[#f5f5f7] border-[#e0e0e0] text-[#1d1d1f] hover:border-[#0066cc]"
                      }`}
                    >
                      <Link
                        to={`/chat/${session.id}`}
                        onClick={() => setThreadsDrawerOpen(false)}
                        className="flex-1 flex items-center gap-3 overflow-hidden text-left"
                      >
                        <MessageSquare size={16} className={isActive ? "text-[#0066cc]" : "text-[#6e6e73]"} />
                        <div className="overflow-hidden">
                          <span className="block text-xs sm:text-sm font-bold truncate">{session.title}</span>
                          <span className="block text-[10px] text-[#86868b]">
                            Created {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1">
                        <Link
                          to={`/chat/${session.id}`}
                          onClick={() => setThreadsDrawerOpen(false)}
                          className="rounded-full p-1.5 text-[#0066cc] hover:bg-[#0066cc]/20"
                        >
                          <ChevronRight size={16} />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 rounded-full p-1.5 text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all"
                          title="Delete thread"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. Mobile Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-[#000000]/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full max-w-xs bg-[#ffffff] flex flex-col h-full shadow-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-[#0066cc]" />
                <span className="text-sm font-bold text-[#1d1d1f]">Navigation Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-full p-1 text-[#6e6e73]">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 rounded-2xl p-3.5 text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#0066cc] text-white shadow-md"
                        : "text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#e0e0e0] space-y-3">
              <button
                onClick={handleCreateNewChat}
                className="w-full rounded-full bg-[#0066cc] py-3 text-xs font-semibold text-white flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Start New Study Session</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AppLayout;
