import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "student" | "vendor";
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { token, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireRole && user.role !== requireRole) {
    // Redirect to appropriate dashboard based on actual role
    const redirectTo = user.role === "vendor" ? "/vendor" : "/student";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
