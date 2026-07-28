"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/auth";

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const { accessToken } = await apiClient<{ accessToken: string }>(
          "/auth/refresh",
          { method: "POST" }
        );
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await apiClient<User>("/auth/me");
        if (!cancelled) setAuth(accessToken, user);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
