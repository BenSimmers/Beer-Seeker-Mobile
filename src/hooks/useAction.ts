import { useCallback, useState } from "react";
import { errorMessage } from "../backend";
import { useToast } from "../components/Toast";

/**
 * Runs a backend call with a busy flag, toasting the server's message (or
 * `fallback`) if it fails. Resolves to whether it succeeded.
 */
export const useAction = () => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (action: () => Promise<unknown>, fallback: string) => {
      setBusy(true);
      try {
        await action();
        return true;
      } catch (err) {
        toast.show(errorMessage(err, fallback), "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
};
