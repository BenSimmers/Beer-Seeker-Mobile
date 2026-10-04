import { makeStyles } from "../../theme";

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
}));
