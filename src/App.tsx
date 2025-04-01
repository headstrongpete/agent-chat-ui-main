import "./App.css";
import { WelcomePage } from "@/components/WelcomePage";
import { ConfigPage } from "@/components/ConfigPage";
import { ChatPage } from "@/components/ChatPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/Auth";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { Toaster } from "@/components/ui/sonner";
import { AgentExplorerPage } from "@/components/agents/AgentExplorerPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/config"
          element={
            <RoleBasedRoute allowedRoles={["admin"]}>
              <ConfigPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ThreadProvider>
                <StreamProvider>
                  <ChatPage />
                </StreamProvider>
              </ThreadProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <ThreadProvider>
                <StreamProvider>
                  <AgentExplorerPage />
                </StreamProvider>
              </ThreadProvider>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;