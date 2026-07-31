import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  MySubmissionResponse,
  StartSubmissionResponse,
  SubmissionDetail,
  SubmitSubmissionResponse,
} from "@/types/submission";

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

// Gọi khi /start trả 409 (đã nộp bài) — lấy submissionId + trạng thái thật của lần nộp gần nhất.
export function useMySubmission(examId: string) {
  return useMutation({
    mutationFn: () => apiClient<MySubmissionResponse>(`/exams/${examId}/submissions/mine`),
  });
}

// Lấy chi tiết đầy đủ (câu hỏi, đáp án) của 1 submission theo id đã biết.
export function useSubmissionDetail() {
  return useMutation({
    mutationFn: (submissionId: string) => apiClient<SubmissionDetail>(`/submissions/${submissionId}`),
  });
}
