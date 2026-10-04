import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { FAVOURITES_LIMIT } from "../../convex/lib/favourites";
import { favouritesLogger as log } from "../logger";
import { useFavourites } from "./FavouritesProvider";

// Starring a few places in a row should cost one write, not one per tap.
const SYNC_DEBOUNCE_MS = 1_500;

/**
 * Mirrors this device's favourites to the signed-in account so friends can
 * see them on a profile. The device is the source of truth: whatever it holds
 * replaces the server copy, including an empty list.
 */
export const FavouritesSync: React.FC = () => {
  const { isAuthenticated } = useConvexAuth();
  const { favourites, hydrated } = useFavourites();
  const sync = useMutation(api.favourites.syncMine);

  useEffect(() => {
    if (!isAuthenticated || !hydrated) return;
    const id = setTimeout(() => {
      const places = favourites
        .slice(0, FAVOURITES_LIMIT)
        .map(({ name, lat, lng, vicinity, category, savedAt }) => ({
          name,
          lat,
          lng,
          vicinity,
          category,
          savedAt,
        }));
      sync({ places }).catch((e) => log.warn("favourites sync failed", e));
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [isAuthenticated, hydrated, favourites, sync]);

  return null;
};
