import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Component that redirects authenticated users without a member profile to complete their profile.
 * Should wrap all routes except auth routes and the profile completion page itself.
 */
export const ProfileRedirect = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, currentMember, loading, memberLoading } = useAuth();
  const location = useLocation();

  // Routes that should be accessible even without a member profile
  const excludedPaths = [
    "/login",
    "/signup",
    "/verify-email",
    "/profile/complete",
    "/admin/login",
  ];

  const isExcludedPath = excludedPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // Wait for both auth and member to finish loading
  if (loading || (user && memberLoading)) {
    return <LoadingSpinner />;
  }

  // If user is authenticated but has no member profile, redirect to complete profile
  // Skip this check for excluded paths
  if (user && !currentMember && !isExcludedPath) {
    return <Navigate to="/profile/complete" replace />;
  }

  return <>{children}</>;
};


