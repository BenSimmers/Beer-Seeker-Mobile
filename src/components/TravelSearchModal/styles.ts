import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  intro: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  searchField: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchBtn: {
    height: 46,
    minWidth: 72,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  searchBtnText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  disabled: {
    opacity: 0.4,
  },
  feedback: {
    marginTop: 16,
  },
  result: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: 16,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  resultLabel: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
  },
  resultMeta: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  confirmBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: colors.background,
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  hint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
}));
