import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ToastProvider } from "./components/Toast";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuard";
import { AppLayout } from "./layouts/AppLayout";
import { SharedChatLayout } from "./layouts/SharedChatLayout";

// Lazy pages loading
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Chat from "./pages/Chat";
import Quizzes from "./pages/Quizzes";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1, // Bounded retries
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <BrowserRouter>
            <Routes>
              {/* Public Guest views */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Protected Student views (AppLayout framed) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Notes />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Quizzes />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <SharedChatLayout>
                    <Chat />
                  </SharedChatLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 views */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
export default App;
