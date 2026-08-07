import React from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] text-center px-4">
      <div className="flex items-center gap-2 text-brand-primary mb-6">
        <BookOpen size={48} />
        <span className="text-3xl font-bold tracking-wide text-white">404</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8">
        We can't find the page you are looking for. Please check the URL or return to the dashboard.
      </p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors shadow-lg shadow-brand-primary/25"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};
export default NotFound;
