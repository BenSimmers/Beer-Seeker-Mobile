import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 12,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.headlineSemi,
    color: colors.headline,
    letterSpacing: -0.2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeOpen: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  badgeClosed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  badgeText: {
    fontFamily: fonts.labelBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badgeTextOpen: {
    color: colors.primary,
  },
  badgeTextClosed: {
    color: colors.muted,
  },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  address: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  distanceCol: {
    gap: 2,
  },
  distance: {
    color: colors.primary,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  walkTime: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  bearingCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  bearingLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bearing: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 13,
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
  },
  mapsBtnText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
