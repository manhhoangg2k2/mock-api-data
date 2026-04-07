import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthPage } from "@/pages/AuthPage";
import { Builder } from "@/pages/Builder";
import { Documentation } from "@/pages/Documentation";
import { LandingPage } from "@/pages/LandingPage";
import { EndpointEditorPage } from "@/pages/EndpointEditorPage";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { Projects } from "@/pages/Projects";
import { DashboardSettingsPage } from "@/pages/dashboard/DashboardSettingsPage";
import { DashboardUsagePage } from "@/pages/dashboard/DashboardUsagePage";

/** Giữ link cũ `/auth?tab=register` — chuyển sang route chuẩn. */
function AuthLegacyRedirect() {
  const [sp] = useSearchParams();
  return <Navigate to={sp.get("tab") === "register" ? "/register" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/overview" element={<Navigate to="/docs" replace />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/auth" element={<AuthLegacyRedirect />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/projects/:projectId/endpoints/:endpointId" element={<EndpointEditorPage />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/settings" element={<DashboardSettingsPage />} />
        <Route path="/usage" element={<DashboardUsagePage />} />
      </Route>
    </Routes>
  );
}
