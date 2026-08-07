import React, { useState } from "react";
import { Copy, Check, Table as TableIcon, X, ZoomIn } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeLightboxImg, setActiveLightboxImg] = useState<{ src: string; alt: string } | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Pre-process content to fix malformed single-line markdown tables (e.g. "... || --- | --- || ...")
  const preprocessedContent = content
    .replace(/\|\s*\|/g, "|\n|")  // Convert double pipes || into row breaks
    .replace(/(^|\n)(\|[^\n]+\|)\s*(\|[^\n]+\|)/g, "$1$2\n$3"); // Ensure row per line

  // 1. Process code blocks first
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(preprocessedContent)) !== null) {
    const textBefore = preprocessedContent.substring(lastIndex, match.index);
    const lang = match[1] || "code";
    const code = match[2];
    const currentIndex = blockIndex;

    if (textBefore.trim()) {
      parts.push(<React.Fragment key={`text-${lastIndex}`}>{renderBlocks(textBefore)}</React.Fragment>);
    }

    parts.push(
      <div key={`code-block-${currentIndex}`} className="my-4 overflow-hidden rounded-2xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] bg-[#f5f5f7] px-4 py-2 text-xs font-mono text-[#6e6e73]">
          <span className="font-semibold uppercase text-[#0066cc]">{lang}</span>
          <button
            onClick={() => handleCopyCode(code, currentIndex)}
            className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors"
          >
            {copiedIndex === currentIndex ? (
              <>
                <Check size={13} className="text-[#34c759]" />
                <span className="text-[#34c759] font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-xs text-[#1d1d1f] leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
    blockIndex++;
  }

  const textAfter = preprocessedContent.substring(lastIndex);
  if (textAfter.trim() || parts.length === 0) {
    parts.push(<React.Fragment key={`text-end`}>{renderBlocks(textAfter)}</React.Fragment>);
  }

  // 2. Render Markdown blocks (Tables, Headers, Lists, Paragraphs)
  function renderBlocks(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // Check if starting a Markdown Table
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          elements.push(renderTableBlock(tableLines, elements.length));
          continue;
        }
      }

      // Headers
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="mt-5 mb-2 text-base font-bold text-inherit tracking-tight border-b border-[#e0e0e0] pb-1">
            {parseInline(trimmed.replace("### ", ""))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="mt-6 mb-2.5 text-lg font-bold text-inherit tracking-tight">
            {parseInline(trimmed.replace("## ", ""))}
          </h2>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1 key={i} className="mt-7 mb-3 text-xl font-extrabold text-inherit tracking-tight">
            {parseInline(trimmed.replace("# ", ""))}
          </h1>
        );
        i++;
        continue;
      }

      // Unordered Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
          const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
          listItems.push(<li key={i} className="leading-relaxed">{parseInline(itemText)}</li>);
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="my-3 ml-5 list-disc space-y-1.5 text-xs sm:text-sm text-inherit">
            {listItems}
          </ul>
        );
        continue;
      }

      // Ordered Lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
          listItems.push(<li key={i} className="leading-relaxed">{parseInline(itemText)}</li>);
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="my-3 ml-5 list-decimal space-y-1.5 text-xs sm:text-sm text-inherit">
            {listItems}
          </ol>
        );
        continue;
      }

      // Horizontal rules
      if (trimmed === "---" || trimmed === "***" || trimmed === "-----------------") {
        elements.push(<hr key={i} className="my-4 border-t border-[#e0e0e0]" />);
        i++;
        continue;
      }

      // Standard Paragraph
      elements.push(
        <p key={i} className="my-2 leading-relaxed text-xs sm:text-sm text-inherit">
          {parseInline(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  }

  // 3. Render HTML Table from Markdown table lines
  function renderTableBlock(tableLines: string[], keyIndex: number): React.ReactNode {
    const parseRow = (rowStr: string) =>
      rowStr
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());

    const headerCells = parseRow(tableLines[0]);
    // Skip index 1 if it's the alignment delimiter row `| --- | --- |`
    const isDelimiter = tableLines[1] && tableLines[1].includes("---");
    const bodyRows = tableLines.slice(isDelimiter ? 2 : 1).map(parseRow);

    return (
      <div key={`table-${keyIndex}`} className="my-5 overflow-x-auto rounded-2xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm text-[#1d1d1f]">
        <div className="flex items-center gap-2 border-b border-[#e0e0e0] bg-[#f5f5f7] px-4 py-2.5 text-xs font-bold text-[#0066cc]">
          <TableIcon size={15} />
          <span>Structured Study Comparison Table</span>
        </div>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#e0e0e0] bg-[#f5f5f7]/70 text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f]">
              {headerCells.map((hCell, hIdx) => (
                <th key={hIdx} className="px-4 py-3 border-r border-[#e0e0e0] last:border-r-0">
                  {parseInline(hCell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0] text-[#1d1d1f]">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#f5f5f7]/50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 border-r border-[#e0e0e0] last:border-r-0 font-medium">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 4. Inline Markdown parser (images, bold, inline code)
  function parseInline(text: string): React.ReactNode[] {
    const regex = /(!\[.*?\]\(.*?\)\s*|\*\*.*?\*\*|`.*?`)/g;
    const parts = text.split(regex);

    return parts.map((part, pIdx) => {
      if (part.startsWith("![") && part.includes("](")) {
        const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          let src = imgMatch[2];
          if (src.startsWith("/")) {
            src = `http://localhost:8000${src}`;
          }
          return (
            <span key={pIdx} className="block my-3 group relative cursor-zoom-in max-w-fit" onClick={() => setActiveLightboxImg({ src, alt: alt || "Extracted Figure" })}>
              <img src={src} alt={alt} className="max-h-64 max-w-full rounded-2xl border border-[#e0e0e0] bg-[#ffffff] p-2 object-contain shadow-sm group-hover:brightness-95 transition-all" />
              <span className="absolute bottom-3 right-3 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={16} />
              </span>
              <span className="block text-[11px] text-[#86868b] mt-1 font-medium">{alt || "Extracted Figure (Click to Enlarge)"}</span>
            </span>
          );
        }
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pIdx} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={pIdx} className="rounded-md bg-[#0066cc]/10 px-1.5 py-0.5 font-mono text-xs text-[#0066cc] font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={pIdx}>{part}</span>;
    });
  }

  return (
    <div className="space-y-1 text-inherit">
      {parts}

      {/* Full Screen Lightbox Image Modal */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-fadeIn cursor-zoom-out"
        >
          <button
            onClick={() => setActiveLightboxImg(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
            title="Close Lightbox"
          >
            <X size={24} />
          </button>
          
          <img
            src={activeLightboxImg.src}
            alt={activeLightboxImg.alt}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
          
          {activeLightboxImg.alt && (
            <span className="mt-4 text-xs font-semibold text-white/90 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full">
              {activeLightboxImg.alt}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
