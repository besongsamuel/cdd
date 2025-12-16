import { useContext } from "react";
import type { AuthContextType } from "../context/AuthContext";
// eslint-disable-next-line no-restricted-imports
import { AuthContextInternal } from "../context/AuthContext";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContextInternal);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


