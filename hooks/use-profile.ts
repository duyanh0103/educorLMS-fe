import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { UserDetail } from "@/types/user";

export function useMyProfile() {
  return useQuery({
    queryKey: ["users", "me", "profile"],
    queryFn: () => apiClient<UserDetail>("/users/me/profile"),
  });
}

interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiClient<UserDetail>("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "me", "profile"] });
    },
  });
}

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      apiClient<null>("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  });
}
