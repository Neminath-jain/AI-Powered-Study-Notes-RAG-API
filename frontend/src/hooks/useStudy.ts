import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option_idx: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  total_questions: number;
  score?: number;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  cards: Flashcard[];
}

export interface ChapterSummary {
  title: string;
  key_takeaways: string[];
  core_concepts: { term: string; definition: string }[];
  cheat_sheet: string;
}

export const useStudy = () => {
  // Generate Quiz
  const generateQuizMutation = useMutation<Quiz, any, { noteId?: string; numQuestions?: number }>({
    mutationFn: async ({ noteId, numQuestions = 5 }) => {
      const params = new URLSearchParams();
      if (noteId) params.append("note_id", noteId);
      params.append("num_questions", numQuestions.toString());
      const response = await api.post(`/study/quiz/generate?${params.toString()}`, null, { timeout: 120000 });
      return response.data;
    },
  });

  // Generate Flashcards
  const generateFlashcardsMutation = useMutation<FlashcardDeck, any, { noteId?: string; numCards?: number }>({
    mutationFn: async ({ noteId, numCards = 8 }) => {
      const params = new URLSearchParams();
      if (noteId) params.append("note_id", noteId);
      params.append("num_cards", numCards.toString());
      const response = await api.post(`/study/flashcards/generate?${params.toString()}`, null, { timeout: 120000 });
      return response.data;
    },
  });

  // Fetch Summary
  const fetchSummary = async (noteId?: string): Promise<ChapterSummary> => {
    const params = new URLSearchParams();
    if (noteId) params.append("note_id", noteId);
    const response = await api.get(`/study/summary?${params.toString()}`, { timeout: 120000 });
    return response.data;
  };

  return {
    generateQuiz: generateQuizMutation.mutateAsync,
    isGeneratingQuiz: generateQuizMutation.isPending,
    generateFlashcards: generateFlashcardsMutation.mutateAsync,
    isGeneratingFlashcards: generateFlashcardsMutation.isPending,
    fetchSummary,
  };
};
