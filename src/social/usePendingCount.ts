import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { backendConfigured } from "../backend";

const usePendingFromServer = () => {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.social.pendingCount, isAuthenticated ? {} : "skip") ?? 0;
};

/**
 * Follow requests plus group invites waiting on the user. Chosen once at load,
 * so hook order never changes: without a backend there's no Convex client to ask.
 */
export const usePendingCount: () => number = backendConfigured ? usePendingFromServer : () => 0;
