import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { StartSubmissionResponse, SubmitSubmissionResponse } from "@/types/submission";

export function useStartSubmission(examId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<StartSubmissionResponse>(`/exams/${examId}/submissions/start`, {
        method: "POST",
      }),
  });
}

export function useSubmitSubmission(examId: string) {
  return useMutation({
    mutationFn: (answers: Record<string, string>) =>
      apiClient<SubmitSubmissionResponse>(`/exams/${examId}/submissions/submit`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
  });
}
