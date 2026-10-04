import { StyleSheet } from "react-native";
import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageTitle: {
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  form: {
    gap: 16,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 4,
  },
  photoBusy: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 44,
    backgroundColor: colors.background + "99",
  },
  photoActions: {
    gap: 12,
  },
  photoAction: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  photoActionMuted: {
    color: colors.muted,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 15,
  },
  toggleHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
}));
