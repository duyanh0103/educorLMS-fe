import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/pagination";
import type { EnrollmentItem, EnrollResult, UnenrollResult } from "@/types/enrollment";

export function useEnrollments(classId: string, page: number, limit: number = 10) {
  return useQuery({
    queryKey: ["classes", classId, "enrollments", page, limit],
    queryFn: () =>
      apiClient<Paginated<EnrollmentItem>>(`/classes/${classId}/enrollments?page=${page}&limit=${limit}`),
    enabled: !!classId,
  });
}

export function useEnrollStudents(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentIds: string[]) =>
      apiClient<EnrollResult>(`/classes/${classId}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ studentIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}

export function useUnenrollStudent(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      apiClient<UnenrollResult>(`/classes/${classId}/enrollments/${studentId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}
