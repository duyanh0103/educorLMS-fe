import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/pagination";
import type { Course, CreateCoursePayload, UpdateCoursePayload } from "@/types/course";

interface UseCoursesParams {
  page: number;
  limit: number;
  search?: string;
}

export function useCourses({ page, limit, search }: UseCoursesParams) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["courses", page, limit, search ?? ""],
    queryFn: () => apiClient<Paginated<Course>>(`/courses?${params.toString()}`),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) =>
      apiClient<Course>("/courses", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) =>
      apiClient<Course>(`/courses/${courseId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => apiClient<{ id: string }>(`/courses/${courseId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}
