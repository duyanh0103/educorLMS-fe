import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ExamDetail, ExamStatus } from "@/types/exam";

export function useCreateExam(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; durationMinutes: number }) =>
      apiClient<ExamDetail>(`/classes/${classId}/exams`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "exams"] });
    },
  });
}

interface UpdateExamPayload {
  title?: string;
  description?: string;
  durationMinutes?: number;
  status?: ExamStatus;
}

export function useUpdateExam(examId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateExamPayload) =>
      apiClient<ExamDetail>(`/exams/${examId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", examId] });
    },
  });
}
