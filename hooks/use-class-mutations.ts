import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ClassListItem,
  CreateClassPayload,
  UpdateClassPayload,
  UpdateClassTeachersPayload,
} from "@/types/class";

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassPayload) =>
      apiClient<ClassListItem>("/classes", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClassPayload) =>
      apiClient<ClassListItem>(`/classes/${classId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}

export function useUpdateClassTeachers(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateClassTeachersPayload) =>
      apiClient<ClassListItem>(`/classes/${classId}/teachers`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", classId] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => apiClient<{ id: string }>(`/classes/${classId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}
