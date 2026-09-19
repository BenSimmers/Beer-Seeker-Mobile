import React from "react";
import { Text } from "react-native";
import { fonts, makeStyles } from "../../theme";
import { MIN_QUERY_LENGTH } from "../../hooks/useTextSearch";
import { SEARCH_RADIUS_M } from "../../config";

type Props = {
  loading: boolean;
  error: string | null;
  hint: boolean;
  query: string;
};

export const SearchStatus: React.FC<Props> = ({ loading, error, hint, query }) => {
  const styles = useStyles();

  if (loading) return <Text style={styles.searchStatus}>Searching further afield…</Text>;
  if (error) return <Text style={styles.searchStatus}>{error}</Text>;
  if (hint && query.length < MIN_QUERY_LENGTH) {
    return (
      <Text style={styles.searchStatus}>
        Type at least {MIN_QUERY_LENGTH} characters to search beyond {SEARCH_RADIUS_M / 1000} km.
      </Text>
    );
  }
  return null;
};

const useStyles = makeStyles((colors) => ({
  searchStatus: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
  },
}));
