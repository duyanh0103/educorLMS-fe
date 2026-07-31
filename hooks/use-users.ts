import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/pagination";
import type {
  UserListItem,
  UserDetail,
  CreateUserPayload,
  CreateUserResponse,
  ResetPasswordResponse,
} from "@/types/user";

interface UseUsersParams {
  page: number;
  limit: number;
  role?: string;
  isActive?: string; // "true" | "false", dạng string vì đây là query param
  search?: string;
}

export function useUsers({ page, limit, role, isActive, search }: UseUsersParams) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (role) params.set("role", role);
  if (isActive) params.set("isActive", isActive);
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["users", page, limit, role ?? "", isActive ?? "", search ?? ""],
    queryFn: () => apiClient<Paginated<UserListItem>>(`/users?${params.toString()}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiClient<CreateUserResponse>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiClient<UserDetail>(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient<ResetPasswordResponse>(`/users/${userId}/reset-password`, { method: "POST" }),
  });
}
