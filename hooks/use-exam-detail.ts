import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Exam } from "@/types/exam";

export function useExamDetail(examId: string) {
  return useQuery({
    queryKey: ["exams", examId],
    queryFn: () => apiClient<Exam>(`/exams/${examId}`),
    enabled: !!examId,
  });
}
