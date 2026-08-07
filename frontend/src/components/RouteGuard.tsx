import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const hasToken = !!localStorage.getItem("access_token");

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const hasToken = !!localStorage.getItem("access_token");

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated || hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
