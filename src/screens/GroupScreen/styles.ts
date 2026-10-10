import { fonts, makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gone: {
    paddingHorizontal: 20,
    textAlign: "left",
  },
  pageTitle: {
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionLabel: {
    marginTop: 24,
  },
  shareCard: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
  },
  shareText: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  memberRow: {
    marginBottom: 10,
  },
  memberInvited: {
    opacity: 0.7,
  },
  memberWho: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    color: colors.headline,
    fontFamily: fonts.headlineSemi,
    fontSize: 16,
  },
  memberMeta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  rename: {
    marginTop: 28,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 32,
  },
  footerLink: {
    paddingVertical: 8,
  },
  footerLinkText: {
    color: colors.danger,
    fontFamily: fonts.label,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pickRow: {
    marginBottom: 10,
  },
  pickName: {
    flex: 1,
  },
  intro: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  nameField: {
    marginBottom: 20,
  },
  submit: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },
}));
