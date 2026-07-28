import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Exam } from "@/types/exam";

export function useExams(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "exams"],
    queryFn: () => apiClient<Exam[]>(`/classes/${classId}/exams`),
    enabled: !!classId,
  });
}
