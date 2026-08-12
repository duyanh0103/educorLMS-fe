import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/pagination";
import type {
  SubmissionListItem,
  SubmissionDetail,
  GradeSubmissionPayload,
  GradeSubmissionResponse,
} from "@/types/grading";

export function useExamSubmissions(examId: string, page: number, limit: number = 10) {
  return useQuery({
    queryKey: ["exams", examId, "submissions", page, limit],
    queryFn: () =>
      apiClient<Paginated<SubmissionListItem>>(`/exams/${examId}/submissions?page=${page}&limit=${limit}`),
    enabled: !!examId,
  });
}

export function useSubmissionDetail(submissionId: string) {
  return useQuery({
    queryKey: ["submissions", submissionId],
    queryFn: () => apiClient<SubmissionDetail>(`/submissions/${submissionId}`),
    enabled: !!submissionId,
  });
}

export function useGradeSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GradeSubmissionPayload) =>
      apiClient<GradeSubmissionResponse>(`/submissions/${submissionId}/grade`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["submissions", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["exams", data.examId, "submissions"] });
    },
  });
}
