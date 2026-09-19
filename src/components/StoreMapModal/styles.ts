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
  title: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 0,
  },
}));
