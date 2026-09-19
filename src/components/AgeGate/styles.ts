import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.headline,
    color: colors.headline,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.body,
    marginTop: 6,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
    marginVertical: 28,
  },
  body: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24,
  },
  confirmText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
}));
