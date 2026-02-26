import { ProtectedRoute } from "./ProtectedRoute";

interface StudentRouteProps {
  children: React.ReactNode;
}

export function StudentRoute({ children }: StudentRouteProps) {
  return <ProtectedRoute requireRole="student">{children}</ProtectedRoute>;
}
