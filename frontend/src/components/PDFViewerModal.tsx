import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, BookOpen } from "lucide-react";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  initialPage?: number;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
  initialPage = 1
}) => {
  const [page, setPage] = useState<number>(initialPage);

  if (!isOpen) return null;

  const pagePdfUrl = `${pdfUrl}#page=${page}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 md:p-8 fade-in">
      <div className="flex h-full w-full max-w-5xl flex-col rounded-2xl border border-[#222F4C] bg-[#111A2E] shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-[#222F4C] px-6 bg-[#0E1524]">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-primary" size={20} />
            <h3 className="text-sm font-bold text-white max-w-md truncate">{title}</h3>
            <span className="rounded bg-brand-primary/20 border border-brand-primary/30 px-2 py-0.5 text-xs text-brand-primary font-medium">
              Page {page}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1 bg-[#17223B] border border-[#222F4C] rounded-lg px-2 py-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded p-1 text-slate-300 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-200 font-mono px-2">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded p-1 text-slate-300 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="rounded p-1.5 text-slate-400 hover:bg-[#1A253E] hover:text-white"
              title="Download PDF"
            >
              <Download size={18} />
            </a>

            <button
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-[#1A253E] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewport */}
        <div className="flex-1 bg-[#0B0F19] relative">
          <iframe
            key={pagePdfUrl}
            src={pagePdfUrl}
            title={title}
            className="h-full w-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
