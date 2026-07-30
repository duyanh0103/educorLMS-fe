import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RetakeRequest, RetakeRequestListItem, RetakeRequestStatus } from "@/types/retake-request";
import type { Paginated } from "@/types/pagination";

export function useMyRetakeRequest(examId: string, submissionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["retake-requests", "mine", submissionId],
    queryFn: () =>
      apiClient<RetakeRequest | null>(`/exams/${examId}/submissions/${submissionId}/retake-request`),
    enabled: !!examId && !!submissionId && enabled,
  });
}

export function useCreateRetakeRequest(examId: string, submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      apiClient<RetakeRequest>(`/exams/${examId}/submissions/${submissionId}/retake-requests`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retake-requests", "mine", submissionId] });
    },
  });
}

export function useRetakeRequests(classId: string, status?: RetakeRequestStatus | "ALL") {
  const statusParam = status && status !== "ALL" ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["retake-requests", "class", classId, status ?? "ALL"],
    queryFn: () =>
      apiClient<Paginated<RetakeRequestListItem>>(`/classes/${classId}/retake-requests${statusParam}`),
    enabled: !!classId,
  });
}

export function useApproveRetakeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      apiClient<RetakeRequest>(`/retake-requests/${requestId}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retake-requests"] });
    },
  });
}

export function useRejectRetakeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reviewNote }: { requestId: string; reviewNote: string }) =>
      apiClient<RetakeRequest>(`/retake-requests/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reviewNote: reviewNote || undefined }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retake-requests"] });
    },
  });
}
