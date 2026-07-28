import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/pagination";
import type { ClassListItem } from "@/types/class";

interface UseClassesParams {
  page: number;
  limit: number;
  search?: string;
}

export function useClasses({ page, limit, search }: UseClassesParams) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["classes", page, limit, search ?? ""],
    queryFn: () => apiClient<Paginated<ClassListItem>>(`/classes?${params.toString()}`),
  });
}
