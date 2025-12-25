import { useAuth } from "./useAuth";

/**
 * Hook to get current user's permissions
 */
export const usePermissions = (): string[] => {
  const { permissions } = useAuth();
  return permissions;
};

/**
 * Hook to check if current user has a specific permission
 */
export const useHasPermission = (permission: string): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * Hook to check if current user is a superuser
 */
export const useIsSuperuser = (): boolean => {
  const { isSuperuser } = useAuth();
  return isSuperuser;
};

