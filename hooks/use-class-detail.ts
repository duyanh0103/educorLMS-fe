import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ClassListItem } from "@/types/class";

export function useClassDetail(classId: string) {
  return useQuery({
    queryKey: ["classes", classId],
    queryFn: () => apiClient<ClassListItem>(`/classes/${classId}`),
    enabled: !!classId,
  });
}
