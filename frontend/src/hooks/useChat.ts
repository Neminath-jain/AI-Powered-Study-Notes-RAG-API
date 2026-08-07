import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export interface Citation {
  note_id: string;
  note_title: string;
  page: number;
  score: number;
  text: string;
  figures?: string[];
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export const useChat = (sessionId?: string) => {
  const queryClient = useQueryClient();

  // 1. Fetch sessions
  const sessionsQuery = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return [];
      const response = await api.get("/chat/sessions");
      return response.data;
    },
    enabled: !!localStorage.getItem("access_token"),
  });

  // 2. Fetch session history
  const historyQuery = useQuery<Message[]>({
    queryKey: ["chat-history", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await api.get(`/chat/sessions/${sessionId}/history`);
      return response.data;
    },
    enabled: !!sessionId,
  });

  // 3. Create Session
  const createSessionMutation = useMutation<ChatSession, any, string>({
    mutationFn: async (title) => {
      const response = await api.post("/chat/sessions", { title });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });

  // 4. Rename Session
  const renameSessionMutation = useMutation<ChatSession, any, { id: string; title: string }>({
    mutationFn: async ({ id, title }) => {
      const response = await api.patch(`/chat/sessions/${id}`, { title });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });

  // 5. Delete Session
  const deleteSessionMutation = useMutation<void, any, string>({
    mutationFn: async (id) => {
      await api.delete(`/chat/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
    },
  });

  // 6. Ask Question (RAG query execution)
  const askQuestionMutation = useMutation<
    { answer: string; citations: Citation[] },
    any,
    { query: string; noteIds?: string[]; language?: string }
  >({
    mutationFn: async ({ query, noteIds, language }) => {
      if (!sessionId) throw new Error("No active chat session selected");
      const response = await api.post("/chat/ask", {
        query,
        session_id: sessionId,
        note_ids: noteIds,
        language,
      }, { timeout: 60000 });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-history", sessionId] });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoadingSessions: sessionsQuery.isLoading,
    messages: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    createSession: createSessionMutation.mutateAsync,
    renameSession: renameSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    askQuestion: askQuestionMutation.mutateAsync,
    isAsking: askQuestionMutation.isPending,
  };
};
