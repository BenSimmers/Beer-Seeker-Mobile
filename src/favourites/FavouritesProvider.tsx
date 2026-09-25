import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { favouriteKey, toFavourite } from "./places";
import type { FavouriteInput, FavouritePlace } from "./places";
import { readFavourites, writeFavourites } from "./storage";

const NONE: FavouritePlace[] = [];

type FavouritesValue = {
  /** Newest first. */
  favourites: FavouritePlace[];
  favouriteKeys: ReadonlySet<string>;
  isFavourite: (place: { lat: number; lng: number }) => boolean;
  toggleFavourite: (place: FavouriteInput) => void;
  removeFavourite: (key: string) => void;
  hydrated: boolean;
};

const FavouritesContext = createContext<FavouritesValue | null>(null);

type FavouritesProviderProps = { children: React.ReactNode };

export const FavouritesProvider: React.FC<FavouritesProviderProps> = ({ children }) => {
  const [favourites, setFavourites] = useState<FavouritePlace[]>(NONE);
  const [hydrated, setHydrated] = useState(false);
  const persisted = useRef<FavouritePlace[]>(NONE);

  useEffect(() => {
    let cancelled = false;

    readFavourites()
      .then((stored) => {
        if (cancelled) return;
        persisted.current = stored;
        setFavourites(stored);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || favourites === persisted.current) return;
    persisted.current = favourites;
    void writeFavourites(favourites);
  }, [favourites, hydrated]);

  const toggleFavourite = useCallback((place: FavouriteInput) => {
    const key = favouriteKey(place);
    setFavourites((current) =>
      current.some((f) => favouriteKey(f) === key)
        ? current.filter((f) => favouriteKey(f) !== key)
        : [toFavourite(place), ...current],
    );
  }, []);

  const removeFavourite = useCallback((key: string) => {
    setFavourites((current) => current.filter((f) => favouriteKey(f) !== key));
  }, []);

  const favouriteKeys = useMemo(
    () => new Set(favourites.map((f) => favouriteKey(f))),
    [favourites],
  );

  const value = useMemo(
    () => ({
      favourites,
      favouriteKeys,
      isFavourite: (place: { lat: number; lng: number }) => favouriteKeys.has(favouriteKey(place)),
      toggleFavourite,
      removeFavourite,
      hydrated,
    }),
    [favourites, favouriteKeys, toggleFavourite, removeFavourite, hydrated],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
};

export const useFavourites = (): FavouritesValue => {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used inside a FavouritesProvider");
  return ctx;
};
