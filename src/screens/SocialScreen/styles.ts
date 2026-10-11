import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // The profile button's height, so signing in doesn't shift the page.
    minHeight: 32,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  intro: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  switchFlow: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  switchFlowText: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  signOutText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pageTitle: {
    marginBottom: 16,
  },
  search: {
    marginBottom: 20,
  },
  sections: {
    gap: 24,
  },
  sharingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  sharingBannerText: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  sharingBannerAction: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyText: {
    marginTop: 0,
    textAlign: "left",
  },
}));
