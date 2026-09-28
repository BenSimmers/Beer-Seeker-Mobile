import { favouritesFirst } from "../../favourites";
import type { CategoryFilter, NearbyPlace } from "../../types";

type Arrangement = {
  filter: CategoryFilter;
  search: string;
  openFirst: boolean;
  favouriteKeys: ReadonlySet<string>;
};

export const arrangePlaces = (
  places: NearbyPlace[],
  { filter, search, openFirst, favouriteKeys }: Arrangement,
): NearbyPlace[] => {
  const byCategory = filter === "all" ? places : places.filter((p) => p.category === filter);

  const query = search.trim().toLowerCase();
  const matched = query
    ? byCategory.filter(
        (p) => p.name.toLowerCase().includes(query) || p.vicinity.toLowerCase().includes(query),
      )
    : byCategory;

  const ordered = openFirst
    ? [...matched.filter((p) => p.openNow === true), ...matched.filter((p) => p.openNow !== true)]
    : matched;

  // A favourite is a standing instruction, so it outranks the open-first sort.
  return favouritesFirst(ordered, favouriteKeys);
};

export const countByCategory = (places: NearbyPlace[]): Partial<Record<CategoryFilter, number>> => {
  const tally: Partial<Record<CategoryFilter, number>> = { all: places.length };
  for (const p of places) {
    if (p.category !== "other") tally[p.category] = (tally[p.category] ?? 0) + 1;
  }
  return tally;
};
