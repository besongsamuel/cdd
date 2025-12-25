import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = true,
  requiredPermission,
}: ProtectedRouteProps) => {
  const { user, isAdmin, hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission first if provided
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/admin/login" replace />;
  }

  // Fallback to admin check if no permission specified
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};




