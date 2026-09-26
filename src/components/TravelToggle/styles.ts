import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  iconBtn: {
    padding: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 5,
  },
  pillWide: {
    maxWidth: "100%",
  },
  pillText: {
    flexShrink: 1,
    color: colors.secondary,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
}));
