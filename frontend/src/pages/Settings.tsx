import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useToast } from "../components/Toast";
import { 
  User, 
  ShieldCheck, 
  Check, 
  Sliders, 
  Languages, 
  BookOpen, 
  HardDrive,
  Sun
} from "lucide-react";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = () => {
    setSaveSuccess(true);
    addToast("Study preferences updated and saved!", "success");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-[#1d1d1f]">
      
      {/* 1. User Account Profile Card */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] overflow-hidden shadow-sm">
        <div className="border-b border-[#e0e0e0] bg-[#ffffff] px-8 py-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#0066cc]/10 text-[#0066cc]">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1d1d1f]">Student Identity & Membership</h2>
            <p className="text-xs text-[#6e6e73]">Manage your active student credentials and workspace status.</p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Email Address</span>
              <span className="block mt-1.5 text-sm font-semibold text-[#1d1d1f] font-mono">{user?.email}</span>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Membership Status</span>
              <span className="block mt-1.5 text-sm font-bold text-[#0066cc] uppercase">{user?.role}</span>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Account Status</span>
              <span className="block mt-1.5 text-sm text-[#34c759] font-bold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#34c759]"></span>
                <span>Active</span>
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">Member Since</span>
              <span className="block mt-1.5 text-sm text-[#6e6e73] font-semibold">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active Student"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Study Assistant Preferences Card */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] overflow-hidden shadow-sm">
        <div className="border-b border-[#e0e0e0] bg-[#ffffff] px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0066cc]/10 text-[#0066cc]">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1d1d1f]">AI Study Assistant Preferences</h2>
              <p className="text-xs text-[#6e6e73]">Customize response language, explanation depth, and citation formats.</p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            className="rounded-full bg-[#0066cc] hover:bg-[#0071e3] active:scale-95 transition-all px-6 py-2.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
          >
            {saveSuccess ? (
              <>
                <Check size={16} className="text-[#34c759]" />
                <span>Saved!</span>
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>

        <div className="p-8 space-y-7">
          
          {/* Response Language Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3 flex items-center gap-2">
              <Languages size={16} className="text-[#0066cc]" />
              <span>Primary Answer Language</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "auto", label: "Auto-Detect Language" },
                { id: "en", label: "English" },
                { id: "kn", label: "Kannada (ಕನ್ನಡ)" },
                { id: "hi", label: "Hindi (हिंदी)" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => updateSettings({ answerLanguage: lang.id })}
                  className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold transition-all border text-left ${
                    settings.answerLanguage === lang.id
                      ? "bg-[#0066cc] text-white border-[#0066cc] shadow-md shadow-[#0066cc]/20"
                      : "bg-[#ffffff] text-[#1d1d1f] border-[#d2d2d7] hover:border-[#0066cc]"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Detail Depth */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-[#0066cc]" />
              <span>Explanation Style</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { id: "standard", label: "Balanced Study Explanations", desc: "Clear breakdown with textbook context" },
                { id: "academic", label: "Detailed Academic Mode", desc: "In-depth technical analysis and step-by-step proofs" },
                { id: "exam", label: "Quick Exam Flashcard Mode", desc: "Bullet-point summaries for rapid revision" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateSettings({ explanationStyle: style.id })}
                  className={`rounded-2xl p-5 text-left border transition-all space-y-1.5 ${
                    settings.explanationStyle === style.id
                      ? "bg-[#ffffff] border-[#0066cc] ring-2 ring-[#0066cc]/20 shadow-sm"
                      : "bg-[#ffffff] border-[#d2d2d7] hover:border-[#0066cc]"
                  }`}
                >
                  <span className={`block text-xs sm:text-sm font-bold ${settings.explanationStyle === style.id ? "text-[#0066cc]" : "text-[#1d1d1f]"}`}>
                    {style.label}
                  </span>
                  <span className="block text-xs text-[#6e6e73] leading-relaxed">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Citation Format Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#34c759]" />
              <span>Page Citation Display</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { id: "full", label: "Show Source File & Page Number Chips", desc: "Includes interactive click-to-verify text modal" },
                { id: "compact", label: "Compact Page Number Only", desc: "Minimalist inline page numbers without text drawer" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateSettings({ citationFormat: item.id })}
                  className={`rounded-2xl p-5 text-left border transition-all space-y-1.5 ${
                    settings.citationFormat === item.id
                      ? "bg-[#ffffff] border-[#34c759] ring-2 ring-[#34c759]/20 shadow-sm"
                      : "bg-[#ffffff] border-[#d2d2d7] hover:border-[#34c759]"
                  }`}
                >
                  <span className={`block text-xs sm:text-sm font-bold ${settings.citationFormat === item.id ? "text-[#34c759]" : "text-[#1d1d1f]"}`}>
                    {item.label}
                  </span>
                  <span className="block text-xs text-[#6e6e73] leading-relaxed">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Storage Health & Appearance Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-2">
              <HardDrive size={16} className="text-[#0066cc]" />
              <span>Workspace Storage</span>
            </span>
            <span className="block text-sm sm:text-base font-bold text-[#1d1d1f]">25MB Max Per File Support</span>
            <span className="block text-xs text-[#6e6e73]">Encrypted private document storage active</span>
          </div>
          <span className="text-xs font-bold text-[#34c759] bg-[#34c759]/10 px-3.5 py-1.5 rounded-full border border-[#34c759]/30">
            Healthy
          </span>
        </div>

        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-2">
              <Sun size={16} className="text-[#ff9500]" />
              <span>Visual Appearance</span>
            </span>
            <span className="block text-sm sm:text-base font-bold text-[#1d1d1f]">Apple Light Design System</span>
            <span className="block text-xs text-[#6e6e73]">High contrast ink typography & parchment tiles</span>
          </div>
          <span className="text-xs font-bold text-[#0066cc] bg-[#0066cc]/10 px-3.5 py-1.5 rounded-full border border-[#0066cc]/30">
            Active
          </span>
        </div>
      </div>

    </div>
  );
};

export default Settings;
