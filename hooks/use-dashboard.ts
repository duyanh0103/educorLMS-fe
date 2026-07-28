import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AdminDashboard, TeacherDashboard } from "@/types/dashboard";
import type { Paginated } from "@/types/pagination";
import type { Enrollment } from "@/types/class";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => apiClient<AdminDashboard>("/dashboard/admin"),
  });
}

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["dashboard", "teacher"],
    queryFn: () => apiClient<TeacherDashboard>("/dashboard/teacher"),
  });
}

export function useMyClasses() {
  return useQuery({
    queryKey: ["students", "me", "classes"],
    queryFn: () => apiClient<Paginated<Enrollment>>("/students/me/classes?limit=50"),
  });
}
