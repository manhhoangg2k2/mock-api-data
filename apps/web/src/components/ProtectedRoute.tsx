import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500 text-sm">Đang tải…</div>
    );
  }
  if (!token) {
    return <Navigate to="/auth?tab=login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
