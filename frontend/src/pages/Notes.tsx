import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotes, Note } from "../hooks/useNotes";
import { useChat } from "../hooks/useChat";
import { useToast } from "../components/Toast";
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  FileCheck,
  AlertTriangle,
  Search,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter
} from "lucide-react";

export const Notes: React.FC = () => {
  const { notes, isLoading, uploadNote, renameNote, deleteNote } = useNotes();
  const { createSession } = useChat();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "processing" | "failed">("all");

  const handleUploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      addToast("Only PDF documents are supported.", "error");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      addToast("File size exceeds the 25MB limit.", "error");
      return;
    }

    setUploadProgress(0);
    try {
      await uploadNote({
        file,
        onProgress: (percent) => setUploadProgress(percent),
      });
      addToast("File uploaded successfully. Note indexed for AI search.", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to upload document notes.", "error");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleStartRename = (note: Note) => {
    setEditingId(note.id);
    setEditingTitle(note.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await renameNote({ id, title: editingTitle.trim() });
      addToast("Document renamed successfully.", "success");
      setEditingId(null);
    } catch (err: any) {
      addToast(err.message || "Failed to rename document.", "error");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this document? Associated note indexes will be removed.")) {
      try {
        await deleteNote(id);
        addToast("Document deleted successfully.", "success");
      } catch (err: any) {
        addToast(err.message || "Failed to delete document.", "error");
      }
    }
  };

  const handleStartChatWithNote = async (noteTitle: string) => {
    try {
      const newSession = await createSession(`Study: ${noteTitle}`);
      navigate(`/chat/${newSession.id}`);
    } catch (err: any) {
      addToast("Failed to start study session", "error");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans text-[#1d1d1f]">
      
      {/* 1. Header Title & PDF Upload Dropzone */}
      <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066cc]/30 bg-[#0066cc]/10 px-3.5 py-1 text-xs font-bold text-[#0066cc] mb-2">
              <Sparkles size={14} />
              <span>Grounded Knowledge Base</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">Notes Library</h1>
            <p className="text-sm text-[#6e6e73] mt-1">
              Upload textbook chapters, syllabus PDFs, and lecture slides up to 25MB.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            isDragOver 
              ? "border-[#0066cc] bg-[#0066cc]/10" 
              : "border-[#d2d2d7] bg-[#ffffff] hover:border-[#0066cc]/60 hover:bg-[#fafafc]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          <div className="p-3.5 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] mb-3">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-base font-bold text-[#1d1d1f]">Click or drag & drop PDF notes here</h3>
          <p className="text-xs text-[#6e6e73] mt-1">Supports PDF textbook chapters, lecture slides, and syllabus files up to 25MB.</p>

          {uploadProgress !== null && (
            <div className="mt-5 w-full max-w-sm space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#6e6e73]">
                <span>Indexing course PDF...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-[#e0e0e0] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0066cc] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by document title..."
            className="w-full rounded-full border border-[#d2d2d7] bg-[#ffffff] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] shadow-sm"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter size={15} className="text-[#86868b] mr-1 hidden sm:inline" />
          {[
            { id: "all", label: "All Notes" },
            { id: "completed", label: "Completed" },
            { id: "processing", label: "Processing" },
            { id: "failed", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-[#0066cc] text-white shadow-sm"
                  : "bg-[#f5f5f7] border border-[#e0e0e0] text-[#6e6e73] hover:text-[#1d1d1f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notes Grid Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#86868b]">Loading notes library...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-3xl border border-[#e0e0e0] bg-[#f5f5f7] p-12 text-center text-xs text-[#86868b] space-y-3">
          <FileText size={32} className="mx-auto text-[#0066cc]" />
          <p className="text-sm font-semibold text-[#1d1d1f]">No course notes found.</p>
          <p>Upload your PDF files above to start querying course material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <div
                key={note.id}
                className="rounded-3xl border border-[#e0e0e0] bg-[#ffffff] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-4 group"
              >
                <div>
                  {/* Status & Actions Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#e0e0e0] pb-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        note.status === "completed"
                          ? "bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/30"
                          : note.status === "failed"
                          ? "bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/30"
                          : "bg-[#ff9500]/10 text-[#ff9500] border border-[#ff9500]/30"
                      }`}
                    >
                      {note.status === "completed" && <FileCheck size={13} />}
                      {note.status === "failed" && <AlertTriangle size={13} />}
                      <span>{note.status}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartRename(note)}
                        className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#0066cc]"
                        title="Rename document"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-full p-1.5 text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#ff3b30]"
                        title="Delete document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 rounded-xl bg-[#f5f5f7] border border-[#0066cc] px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(note.id)}
                        className="p-1.5 text-[#34c759] hover:bg-[#34c759]/10 rounded-full"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors leading-snug line-clamp-2" title={note.title}>
                        {note.title}
                      </h3>
                      <p className="text-xs text-[#86868b]">
                        Uploaded {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="mt-4 pt-3 border-t border-[#e0e0e0] text-xs text-[#6e6e73] space-y-1">
                    {note.status === "completed" && note.metadata_info ? (
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#6e6e73]">
                        <span className="bg-[#f5f5f7] px-2.5 py-1 rounded-lg border border-[#e0e0e0]">
                          Pages: <strong className="text-[#1d1d1f]">{note.metadata_info.total_pages}</strong>
                        </span>
                        <span className="bg-[#f5f5f7] px-2.5 py-1 rounded-lg border border-[#e0e0e0]">
                          Chars: <strong className="text-[#1d1d1f]">{note.metadata_info.total_chars.toLocaleString()}</strong>
                        </span>
                        <span className="bg-[#f5f5f7] px-2.5 py-1 rounded-lg border border-[#e0e0e0]">
                          Size: <strong className="text-[#1d1d1f]">{formatBytes(note.metadata_info.file_size_bytes)}</strong>
                        </span>
                      </div>
                    ) : note.status === "failed" ? (
                      <p className="text-xs text-[#ff3b30] italic">{note.error_message}</p>
                    ) : (
                      <p className="text-xs text-[#ff9500] italic">Parsing document chapters...</p>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  onClick={() => handleStartChatWithNote(note.title)}
                  className="w-full rounded-full bg-[#0066cc]/10 hover:bg-[#0066cc] text-[#0066cc] hover:text-white py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare size={15} />
                  <span>Start AI Study Session</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Notes;
