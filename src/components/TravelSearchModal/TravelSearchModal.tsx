import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { geocodePlace, type GeocodeResult } from "../../api/geocode";
import type { UserLocation } from "../../types";
import { errorMessage } from "../../utils/errors";
import { formatDistance, haversineDistance } from "../../utils/geo";
import { useTheme } from "../../theme";
import { ErrorBanner, Eyebrow, RoundIconButton, SearchField, SectionLabel } from "../ui";
import { useStyles } from "./styles";

type Props = {
  visible: boolean;
  realLocation: UserLocation | null;
  onConfirm: (place: GeocodeResult) => void;
  onClose: () => void;
};

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; place: GeocodeResult }
  | { status: "notFound"; query: string }
  | { status: "error"; message: string };

const IDLE: SearchState = { status: "idle" };

export const TravelSearchModal: React.FC<Props> = ({
  visible,
  realLocation,
  onConfirm,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>(IDLE);
  // Drops results from searches superseded while in flight.
  const latest = useRef(0);

  const close = () => {
    latest.current += 1;
    setQuery("");
    setState(IDLE);
    onClose();
  };

  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const id = ++latest.current;
    setState({ status: "searching" });
    try {
      const place = await geocodePlace(trimmed);
      if (id !== latest.current) return;
      setState(place ? { status: "found", place } : { status: "notFound", query: trimmed });
    } catch (e) {
      if (id !== latest.current) return;
      setState({ status: "error", message: errorMessage(e, "Couldn’t look that up.") });
    }
  };

  const edit = (text: string) => {
    setQuery(text);
    if (state.status !== "searching") setState(IDLE);
  };

  const confirm = (place: GeocodeResult) => {
    onConfirm(place);
    close();
  };

  const searching = state.status === "searching";
  const canSearch = query.trim().length > 0 && !searching;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Eyebrow>Travel Mode</Eyebrow>
            <RoundIconButton icon="close" onPress={close} accessibilityLabel="Close" />
          </View>

          <View style={styles.body}>
            <Text style={styles.intro}>
              Pick somewhere you&apos;re headed and the compass and venue list will act as though
              you&apos;re already there.
            </Text>

            <SectionLabel>City or address</SectionLabel>
            <View style={styles.searchRow}>
              <SearchField
                style={styles.searchField}
                value={query}
                onChangeText={edit}
                onSubmitEditing={search}
                placeholder="e.g. Lisbon"
                returnKeyType="search"
                autoFocus
              />
              <Pressable
                style={[styles.searchBtn, !canSearch && styles.disabled]}
                onPress={search}
                disabled={!canSearch}
                accessibilityRole="button"
                accessibilityLabel="Find this place"
              >
                {searching ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.searchBtnText}>Find</Text>
                )}
              </Pressable>
            </View>

            {state.status === "notFound" && (
              <ErrorBanner
                message={`Couldn’t find “${state.query}”. Try a city name.`}
                style={styles.feedback}
              />
            )}

            {state.status === "error" && (
              <ErrorBanner message={state.message} style={styles.feedback} />
            )}

            {state.status === "found" && (
              <View style={styles.result}>
                <View style={styles.resultTop}>
                  <Ionicons name="airplane" size={18} color={colors.secondary} />
                  <Text style={styles.resultLabel}>{state.place.label}</Text>
                </View>
                <Text style={styles.resultMeta}>
                  {`${state.place.lat.toFixed(4)}, ${state.place.lng.toFixed(4)}`}
                </Text>
                {realLocation && (
                  <Text style={styles.resultMeta}>
                    {formatDistance(
                      haversineDistance(
                        realLocation.lat,
                        realLocation.lng,
                        state.place.lat,
                        state.place.lng,
                      ),
                    )}{" "}
                    from you
                  </Text>
                )}
                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => confirm(state.place)}
                  accessibilityRole="button"
                >
                  <Text style={styles.confirmBtnText}>Use this location</Text>
                </Pressable>
                <Text style={styles.hint}>
                  Not the right place? Add a country and search again.
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};
