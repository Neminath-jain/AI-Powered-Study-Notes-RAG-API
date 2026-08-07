import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, AlertTriangle, Info, ArrowRight, ShieldCheck, Sparkles, FileText } from "lucide-react";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const sessionExpired = searchParams.get("expired") === "true";

  const onSubmit = async (data: any) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
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
            to="/register"
            className="rounded-full bg-[#f5f5f7] border border-[#d2d2d7] hover:bg-[#e8e8ed] px-4 py-1.5 text-xs font-semibold text-[#1d1d1f] transition-all"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Split-Screen Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Column: Authentic Form */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">
                  Sign in to your study room
                </h1>
                <p className="text-xs sm:text-sm text-[#6e6e73] mt-2 leading-relaxed">
                  Access your uploaded PDF textbook chapters, active chat sessions, and AI study quizzes.
                </p>
              </div>

              {sessionExpired && (
                <div className="flex items-center gap-3 rounded-2xl border border-[#ff9500]/30 bg-[#ff9500]/10 p-3.5 text-xs text-[#ff9500] font-medium">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>Your session has expired. Please sign in again.</span>
                </div>
              )}

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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-xs text-[#0066cc] hover:underline cursor-pointer font-medium">
                      Forgot password?
                    </span>
                  </div>
                  <input
                    type="password"
                    {...register("password", { required: "Password is required" })}
                    className="w-full rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:border-[#0066cc] focus:bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <span className="block text-xs text-[#ff3b30] mt-1.5 font-semibold">{errors.password.message}</span>
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
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Account</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-[#e0e0e0] text-center">
                <p className="text-xs text-[#6e6e73]">
                  Don't have a student account?{" "}
                  <Link to="/register" className="text-[#0066cc] font-semibold hover:underline">
                    Create free account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Grounded AI Product Preview (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-7 w-full flex-col justify-center pl-4">
            <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 sm:p-10 shadow-lg space-y-6">
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc] bg-[#0066cc]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Real Citation Grounding</span>
                </span>
              </div>

              <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-[-0.02em] leading-snug">
                Answers backed by your course material. Never guessed.
              </h2>

              {/* Mock Chat Card Preview */}
              <div className="rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-5 shadow-sm space-y-4">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-none bg-[#0066cc] text-white px-4 py-2.5 text-xs font-medium">
                    What are the 3 main stages of cellular respiration in Bio 101?
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none bg-[#f5f5f7] border border-[#e0e0e0] text-[#1d1d1f] p-4 text-xs space-y-3">
                    <p className="leading-relaxed">
                      Cellular respiration consists of <strong>Glycolysis</strong> (in cytosol), the <strong>Citric Acid Cycle</strong>, and <strong>Oxidative Phosphorylation</strong> (in mitochondria), producing a net yield of 30–32 ATP.
                    </p>
                    <div className="pt-2 border-t border-[#e0e0e0] flex items-center justify-between">
                      <span className="rounded-full bg-[#ffffff] border border-[#0066cc]/30 px-3 py-0.5 text-[11px] font-semibold text-[#0066cc] flex items-center gap-1">
                        <Info size={11} />
                        <span>BIO101_Cell_Biology.pdf, p. 18</span>
                      </span>
                      <span className="text-[10px] text-[#34c759] font-bold flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>0.91 Match</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs text-[#6e6e73]">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#0066cc]" />
                  <span>Private Encrypted Document Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#34c759]" />
                  <span>Zero Hallucination Guarantee</span>
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

export default Login;
