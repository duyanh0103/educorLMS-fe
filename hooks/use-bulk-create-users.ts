import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { BulkUserInput, BulkImportResponse } from "@/types/bulk-user";

export function useBulkCreateUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (users: BulkUserInput[]) =>
      apiClient<BulkImportResponse>("/users/bulk", {
        method: "POST",
        body: JSON.stringify({ users }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
