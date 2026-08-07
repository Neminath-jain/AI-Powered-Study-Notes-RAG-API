import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, ArrowRight, Sparkles, FileText, Zap, Users } from "lucide-react";

export const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  // Watch password field for live strength calculation
  const currentPassword = watch("password", "");

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Empty", color: "bg-[#e0e0e0]" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-[#ff3b30]" };
    if (score === 2 || score === 3) return { score: 2, label: "Good", color: "bg-[#ff9500]" };
    return { score: 3, label: "Strong", color: "bg-[#34c759]" };
  };

  const strength = calculatePasswordStrength(currentPassword);

  const onSubmit = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await signup(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. This email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1d1f] flex flex-col justify-between font-sans selection:bg-[#0066cc] selection:text-white">
      {/* Brand Navigation Header */}
      <header className="w-full border-b border-[#e0e0e0] bg-[#ffffff]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BookOpen className="text-[#0066cc]" size={22} />
            <span className="text-base font-semibold tracking-[-0.28px] text-[#1d1d1f]">Student Knowledge AI</span>
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-[#f5f5f7] border border-[#d2d2d7] hover:bg-[#e8e8ed] px-4 py-1.5 text-xs font-semibold text-[#1d1d1f] transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Split-Screen Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Column: Registration Form */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">
                  Create your free student account
                </h1>
                <p className="text-xs sm:text-sm text-[#6e6e73] mt-2 leading-relaxed">
                  Start querying course PDFs with zero hallucinations and verified page-level citations.
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-2xl border border-[#ff3b30]/30 bg-[#ff3b30]/10 p-3.5 text-xs text-[#ff3b30] font-medium leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    autoFocus
                    {...register("email", {
                      required: "Email address is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className="w-full rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0066cc] focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                    placeholder="student@university.edu"
                  />
                  {errors.email && (
                    <span className="block text-xs text-[#ff3b30] mt-1.5 font-semibold">{errors.email.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="w-full rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0066cc] focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                    placeholder="•••••••• (6+ characters)"
                  />
                  {errors.password && (
                    <span className="block text-xs text-[#ff3b30] mt-1.5 font-semibold">{errors.password.message}</span>
                  )}

                  {/* Live Password Strength Meter */}
                  {currentPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#6e6e73]">
                        <span>Password strength:</span>
                        <span className="font-semibold text-[#1d1d1f]">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#f5f5f7] border border-[#e0e0e0] rounded-full overflow-hidden flex gap-1 p-0.5">
                        <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 1 ? strength.color : "bg-transparent"}`}></div>
                        <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 2 ? strength.color : "bg-transparent"}`}></div>
                        <div className={`h-full rounded-full transition-all flex-1 ${strength.score >= 3 ? strength.color : "bg-transparent"}`}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    {...register("confirmPassword", { required: "Please confirm your password" })}
                    className="w-full rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0066cc] focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <span className="block text-xs text-[#ff3b30] mt-1.5 font-semibold">{errors.confirmPassword.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0066cc] py-3.5 text-sm font-semibold text-white hover:bg-[#0071e3] active:scale-95 transition-all shadow-md shadow-[#0066cc]/25 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Started Free</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-[#e0e0e0] text-center">
                <p className="text-xs text-[#6e6e73]">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#0066cc] font-semibold hover:underline">
                    Sign in instead
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Grounded AI Feature Perks (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-7 w-full flex-col justify-center pl-4">
            <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 sm:p-10 shadow-lg space-y-6">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc] bg-[#0066cc]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Free Student Account Included</span>
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-snug">
                Built specifically for university courses and complex textbook study.
              </h2>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-4 flex items-start gap-3 shadow-sm">
                  <div className="p-2 rounded-xl bg-[#0066cc]/10 text-[#0066cc]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">25MB PDF Upload Support</h3>
                    <p className="text-xs text-[#6e6e73] mt-0.5">Parse entire modules, syllabus files, and lecture slides automatically.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-4 flex items-start gap-3 shadow-sm">
                  <div className="p-2 rounded-xl bg-[#34c759]/10 text-[#34c759]">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">Instant Quizzes & Flashcards</h3>
                    <p className="text-xs text-[#6e6e73] mt-0.5">Auto-generate multiple choice quizzes directly from your uploaded notes.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-4 flex items-start gap-3 shadow-sm">
                  <div className="p-2 rounded-xl bg-[#0066cc]/10 text-[#0066cc]">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#1d1d1f]">Collaborative Study Rooms</h3>
                    <p className="text-xs text-[#6e6e73] mt-0.5">Share chat threads with classmates without giving away your private credentials.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#e0e0e0] bg-[#f5f5f7] py-4 text-center text-xs text-[#6e6e73]">
        &copy; {new Date().getFullYear()} Student Knowledge AI. All rights reserved.
      </footer>
    </div>
  );
};

export default Register;
