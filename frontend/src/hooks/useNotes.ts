import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface NoteMetadata {
  total_pages: number;
  total_chars: number;
  file_size_bytes: number;
}

export interface Note {
  id: string;
  title: string;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  metadata_info: NoteMetadata | null;
}

export const useNotes = () => {
  const queryClient = useQueryClient();

  // 1. Fetch user's uploaded notes list
  const notesQuery = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return [];
      const response = await api.get("/notes/");
      return response.data;
    },
    enabled: !!localStorage.getItem("access_token"),
    refetchInterval: (query) => {
      // Poll notes if any note is still processing
      const notes = query.state.data as Note[] | undefined;
      const isProcessing = notes?.some((n) => n.status === "processing");
      return isProcessing ? 3000 : false;
    },
  });

  // 2. Upload PDF note
  const uploadNoteMutation = useMutation<
    Note,
    any,
    { file: File; onProgress?: (percent: number) => void }
  >({
    mutationFn: async ({ file, onProgress }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post("/notes/upload", formData, {
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // 3. Rename Note
  const renameNoteMutation = useMutation<Note, any, { id: string; title: string }>({
    mutationFn: async ({ id, title }) => {
      const response = await api.patch(`/notes/${id}`, { title });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // 4. Delete Note
  const deleteNoteMutation = useMutation<void, any, string>({
    mutationFn: async (id) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    uploadNote: uploadNoteMutation.mutateAsync,
    isUploading: uploadNoteMutation.isPending,
    renameNote: renameNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
  };
};
