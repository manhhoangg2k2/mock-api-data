import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return <AppLoadingScreen layout="embedded" message="Đang xác thực phiên…" showBrand={false} />;
  }
  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
