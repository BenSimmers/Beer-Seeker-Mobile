import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  chipRowOuter: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chipRowScrollable: {
    flexWrap: "nowrap",
  },
  chip: {
    height: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: colors.primary,
  },
}));
