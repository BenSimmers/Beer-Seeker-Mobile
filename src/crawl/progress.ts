import { haversineDistance } from "../utils/geo";

type Point = { lat: number; lng: number };

export type CrawlProgress = {
  /** Metres from each stop to the next; one shorter than the stops. */
  legs: number[];
  /** Straight-line walking distance from the first stop to the last. */
  totalMetres: number;
  /** Walked so far: from the first stop to the current one. */
  coveredMetres: number;
  /** 0 before the crawl starts, 1 at the last stop. */
  fraction: number;
};

export const crawlProgress = (stops: Point[], currentIndex: number | null): CrawlProgress => {
  const legs = stops
    .slice(1)
    .map((s, i) => haversineDistance(stops[i]!.lat, stops[i]!.lng, s.lat, s.lng));
  const totalMetres = legs.reduce((sum, m) => sum + m, 0);
  const coveredMetres =
    currentIndex == null ? 0 : legs.slice(0, currentIndex).reduce((sum, m) => sum + m, 0);

  // By distance, so a long walk counts for more than hopping next door. A crawl
  // whose stops are all in one spot falls back to counting stops.
  const fraction =
    currentIndex == null
      ? 0
      : totalMetres > 0
        ? coveredMetres / totalMetres
        : stops.length > 1
          ? currentIndex / (stops.length - 1)
          : 1;

  return { legs, totalMetres, coveredMetres, fraction };
};
