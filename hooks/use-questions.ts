import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiUpload } from "@/lib/api-client";
import type { Question, CreateQuestionPayload } from "@/types/question";
import type { ImportQuestionsResponse } from "@/types/import-question";

export function useQuestions(examId: string) {
  return useQuery({
    queryKey: ["exams", examId, "questions"],
    queryFn: () => apiClient<Question[]>(`/exams/${examId}/questions`),
    enabled: !!examId,
  });
}

export function useCreateQuestion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      apiClient<Question>(`/exams/${examId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", examId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateQuestion(examId: string, questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      apiClient<Question>(`/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", examId, "questions"] });
    },
  });
}

export function useDeleteQuestion(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      apiClient<{ id: string }>(`/questions/${questionId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", examId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useImportQuestions(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload<ImportQuestionsResponse>(`/exams/${examId}/questions/import`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", examId, "questions"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
