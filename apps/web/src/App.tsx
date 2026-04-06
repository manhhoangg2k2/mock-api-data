import { Navigate, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/overview" element={<Navigate to="/docs" replace />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth?tab=login" replace />} />
        <Route path="/register" element={<Navigate to="/auth?tab=register" replace />} />
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
