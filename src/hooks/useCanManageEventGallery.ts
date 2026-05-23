import { useHasPermission } from "./usePermissions";

export const useCanManageEventGallery = (): boolean => {
  const canManageGallery = useHasPermission("manage:gallery");
  const canManageEvents = useHasPermission("manage:events");
  return canManageGallery || canManageEvents;
};
