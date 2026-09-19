import { fonts, makeStyles, makeThemed } from "../../theme";

export const useDarkMapStyle = makeThemed((colors) => [
  { elementType: "geometry", stylers: [{ color: colors.surface }] },
  { elementType: "labels.text.fill", stylers: [{ color: colors.body }] },
  { elementType: "labels.text.stroke", stylers: [{ color: colors.background }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: colors.surfaceAlt }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: colors.mapWater }] },
]);

export const useStyles = makeStyles((colors) => ({
  mapCard: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  mapCardThumbnail: {
    height: 84,
    marginBottom: 10,
  },
  mapCardDimmed: {
    opacity: 0.45,
  },
  map: {
    flex: 1,
  },
  mapNonInteractive: {
    pointerEvents: "none",
  },
  expandHint: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: colors.surfaceAlt + "ee",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expandHintText: {
    color: colors.headline,
    fontFamily: fonts.label,
    fontSize: 10,
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background + "dd",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceBadgeText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 12,
  },
}));
