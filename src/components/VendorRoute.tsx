import { ProtectedRoute } from "./ProtectedRoute";

interface VendorRouteProps {
  children: React.ReactNode;
}

export function VendorRoute({ children }: VendorRouteProps) {
  return <ProtectedRoute requireRole="vendor">{children}</ProtectedRoute>;
}
