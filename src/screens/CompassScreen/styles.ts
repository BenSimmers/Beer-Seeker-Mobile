import { makeStyles } from "../../theme";

export const useStyles = makeStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  chipsContainer: {
    marginTop: 8,
  },
  compassContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  mapThumb: {
    width: "100%",
    marginBottom: 12,
  },
}));
