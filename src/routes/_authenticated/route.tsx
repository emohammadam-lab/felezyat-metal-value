import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      if (!token) {
        throw redirect({ to: "/auth" });
      }
    }
  },
  component: () => <Outlet />,
});
