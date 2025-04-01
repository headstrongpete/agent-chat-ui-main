import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/Auth";
import { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading state
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}