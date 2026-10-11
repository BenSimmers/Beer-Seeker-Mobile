import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 26,
    letterSpacing: -0.4,
  },
  username: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 16,
  },
  stats: {
    flexDirection: "row",
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statValue: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 20,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  request: {
    marginTop: 16,
  },
  actions: {
    gap: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionLabel: {
    marginTop: 28,
  },
  emptyText: {
    marginTop: 0,
    marginBottom: 12,
    textAlign: "left",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 24,
    marginTop: 32,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  footerLinkText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  blocked: {
    gap: 12,
    marginTop: 20,
    alignItems: "flex-start",
  },
  blockedText: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
}));
