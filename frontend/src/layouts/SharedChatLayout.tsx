import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, Sparkles, UserPlus, LayoutDashboard } from "lucide-react";

interface SharedChatLayoutProps {
  children: React.ReactNode;
}

export const SharedChatLayout: React.FC<SharedChatLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#ffffff] font-sans text-[#1d1d1f]">
      {/* Apple Light Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f7] px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#0066cc]" size={22} />
          <span className="text-sm font-semibold tracking-tight text-[#1d1d1f]">Knowledge AI</span>
          <span className="rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 px-3 py-0.5 text-xs text-[#0066cc] font-semibold flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>Shared Study Room</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 px-3.5 py-1.5 text-xs font-semibold text-[#0066cc] hover:bg-[#0066cc]/20 transition-all"
            >
              <LayoutDashboard size={14} />
              <span>Go to My Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs text-[#1d1d1f] hover:text-[#0066cc] px-2 py-1 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 rounded-full bg-[#0066cc] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#0071e3] transition-all shadow-sm"
              >
                <UserPlus size={14} />
                <span>Create Free Account</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Full-screen Shared Chat Workspace */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 bg-[#ffffff]">
        {children}
      </main>
    </div>
  );
};

export default SharedChatLayout;
