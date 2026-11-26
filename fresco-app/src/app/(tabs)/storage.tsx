/**
 * FRESCO — Storage (Produce Compatibility Checker)
 * - Route name, tab label, and header all align on "Storage"
 * - Uses consistent Ionicons iconography instead of raw OS emojis
 * - Resolves real Fruit records for quick pairings (zero synthetic/fabricated IDs)
 * - Includes plain-language ethylene explainers so anyone understands why pairing matters
 */

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../theme";
import { Text } from "../../components/ui";
import { useCompatibility, useFruitSearch } from "../../hooks/useFruits";
import { useInventory } from "../../hooks/useInventory";
import { searchFruits } from "../../services/fruits";
import type { Fruit } from "../../types/api";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function getProduceIcon(subcategory?: string | null, name?: string): IoniconName {
  const s = `${subcategory ?? ""} ${name ?? ""}`.toLowerCase();
  if (s.includes("citrus") || s.includes("orange") || s.includes("lemon") || s.includes("lime")) {
    return "sunny-outline";
  }
  if (s.includes("berr") || s.includes("straw") || s.includes("blue") || s.includes("tomato")) {
    return "nutrition-outline";
  }
  if (s.includes("tropical") || s.includes("banana") || s.includes("mango") || s.includes("avocado")) {
    return "leaf-outline";
  }
  return "nutrition-outline";
}

function recommendedStorageForFruit(fruit: Fruit): { label: string; icon: IoniconName } {
  const lower = fruit.name.toLowerCase();
  if (lower.includes("banana") || (fruit.optimal_temp_min != null && fruit.optimal_temp_min >= 12)) {
    return { label: "Best: Counter", icon: "sunny-outline" };
  }
  if (fruit.shelf_life_fridge_days >= fruit.shelf_life_room_temp_days) {
    return { label: "Best: Fridge", icon: "snow-outline" };
  }
  return { label: "Best: Counter", icon: "sunny-outline" };
}

const QUICK_PAIRING_QUERIES = [
  { fruitA: "Tomato", fruitB: "Banana", label: "Tomato & Banana" },
  { fruitA: "Avocado", fruitB: "Banana", label: "Avocado & Banana" },
  { fruitA: "Apple", fruitB: "Orange", label: "Apple & Orange" },
  { fruitA: "Strawberry", fruitB: "Blueberry", label: "Strawberry & Blueberry" },
];

export default function StorageScreen() {
  const theme = useTheme();
  const { colors, layout, radius, borders } = theme;

  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [selectedFruitA, setSelectedFruitA] = useState<Fruit | null>(null);
  const [selectedFruitB, setSelectedFruitB] = useState<Fruit | null>(null);
  const [activeSearchField, setActiveSearchField] = useState<"A" | "B" | null>(null);
  const [resolvingPair, setResolvingPair] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  const inventoryQuery = useInventory();
  const inventoryItems = inventoryQuery.data?.items ?? [];

  const searchA = useFruitSearch(queryA);
  const searchB = useFruitSearch(queryB);

  const pairNames = useMemo(() => {
    if (!selectedFruitA || !selectedFruitB) return [];
    return [selectedFruitA.name, selectedFruitB.name];
  }, [selectedFruitA, selectedFruitB]);

  const compatibilityQuery = useCompatibility(pairNames);

  const isIncompatible = useMemo(() => {
    if (!selectedFruitA || !selectedFruitB) return false;
    if (compatibilityQuery.data) {
      return (compatibilityQuery.data.incompatible_pairs?.length ?? 0) > 0;
    }
    const aProduces = selectedFruitA.is_ethylene_producer;
    const bSensitive = selectedFruitB.is_ethylene_sensitive;
    const bProduces = selectedFruitB.is_ethylene_producer;
    const aSensitive = selectedFruitA.is_ethylene_sensitive;
    return (aProduces && bSensitive) || (bProduces && aSensitive);
  }, [selectedFruitA, selectedFruitB, compatibilityQuery.data]);

  const compatibilityReason = useMemo(() => {
    if (!selectedFruitA || !selectedFruitB) return "";
    if (compatibilityQuery.data?.incompatible_pairs?.[0]?.warning) {
      return compatibilityQuery.data.incompatible_pairs[0].warning;
    }
    if (selectedFruitA.is_ethylene_producer && selectedFruitB.is_ethylene_sensitive) {
      return `${selectedFruitA.name} releases ripening gas (ethylene), making ${selectedFruitB.name} spoil noticeably faster.`;
    }
    if (selectedFruitB.is_ethylene_producer && selectedFruitA.is_ethylene_sensitive) {
      return `${selectedFruitB.name} releases ripening gas (ethylene), making ${selectedFruitA.name} spoil noticeably faster.`;
    }
    return "Safe neighbors — neither produce triggers fast ripening in the other.";
  }, [selectedFruitA, selectedFruitB, compatibilityQuery.data]);

  const handleSelectA = (fruit: Fruit) => {
    setSelectedFruitA(fruit);
    setQueryA(fruit.name);
    setActiveSearchField(null);
    setPairError(null);
    Keyboard.dismiss();
  };

  const handleSelectB = (fruit: Fruit) => {
    setSelectedFruitB(fruit);
    setQueryB(fruit.name);
    setActiveSearchField(null);
    setPairError(null);
    Keyboard.dismiss();
  };

  const handleClearA = () => {
    setSelectedFruitA(null);
    setQueryA("");
  };

  const handleClearB = () => {
    setSelectedFruitB(null);
    setQueryB("");
  };

  const handleSelectQuickPairing = async (pair: (typeof QUICK_PAIRING_QUERIES)[number]) => {
    setActiveSearchField(null);
    setPairError(null);
    Keyboard.dismiss();
    setResolvingPair(true);
    try {
      const [resA, resB] = await Promise.all([
        searchFruits(pair.fruitA, 1, 5),
        searchFruits(pair.fruitB, 1, 5),
      ]);
      const matchA =
        resA.items.find((f) => f.name.toLowerCase() === pair.fruitA.toLowerCase()) ?? resA.items[0];
      const matchB =
        resB.items.find((f) => f.name.toLowerCase() === pair.fruitB.toLowerCase()) ?? resB.items[0];

      if (!matchA || !matchB) {
        setPairError("Couldn't find both items right now — try searching by name above.");
        return;
      }

      setSelectedFruitA(matchA);
      setQueryA(matchA.name);
      setSelectedFruitB(matchB);
      setQueryB(matchB.name);
    } catch {
      setPairError("Couldn't load produce comparison — check your connection and try again.");
    } finally {
      setResolvingPair(false);
    }
  };

  const hasBothSelected = selectedFruitA != null && selectedFruitB != null;

  const renderProfileCard = (fruit: Fruit) => {
    const best = recommendedStorageForFruit(fruit);
    return (
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.card,
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.backgroundMuted }]}>
          <Ionicons
            name={getProduceIcon(fruit.subcategory, fruit.name)}
            size={22}
            color={colors.primary}
          />
        </View>
        <Text variant="cardTitle" color="primary" style={styles.profileName} numberOfLines={1}>
          {fruit.name}
        </Text>

        <View style={styles.metaTraitsList}>
          <View style={styles.metaTraitRow}>
            <Ionicons
              name={fruit.is_ethylene_producer ? "flash" : "leaf-outline"}
              size={14}
              color={fruit.is_ethylene_producer ? colors.statusWarning : colors.statusSuccess}
            />
            <Text
              variant="micro"
              color={fruit.is_ethylene_producer ? "warning" : "secondary"}
              style={styles.traitText}
            >
              {fruit.is_ethylene_producer ? "Emits ripening gas" : "Low gas output"}
            </Text>
          </View>

          <View style={styles.metaTraitRow}>
            <Ionicons
              name={fruit.is_ethylene_sensitive ? "warning" : "shield-checkmark-outline"}
              size={14}
              color={fruit.is_ethylene_sensitive ? colors.statusWarning : colors.textSecondary}
            />
            <Text
              variant="micro"
              color={fruit.is_ethylene_sensitive ? "warning" : "secondary"}
              style={styles.traitText}
            >
              {fruit.is_ethylene_sensitive ? "Gas sensitive" : "Not gas sensitive"}
            </Text>
          </View>

          <View style={[styles.metaTraitRow, styles.traitDivider, { borderTopColor: colors.border }]}>
            <Ionicons name={best.icon} size={14} color={colors.primary} />
            <Text variant="micro" color="brand" style={styles.traitText}>
              {best.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { paddingHorizontal: layout.screenPadding }]}>
        <Text variant="largeTitle" color="brand">
          Storage
        </Text>
        <Text variant="caption" color="secondary" style={styles.headerSubtitle}>
          Check which produce stores well together
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputsRow}>
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderColor: activeSearchField === "A" ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                placeholder="First item..."
                placeholderTextColor={colors.textMuted}
                value={queryA}
                onChangeText={(text) => {
                  setQueryA(text);
                  setActiveSearchField("A");
                  if (!text && selectedFruitA) setSelectedFruitA(null);
                }}
                onFocus={() => setActiveSearchField("A")}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="words"
              />
              {queryA.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear first item"
                  onPress={handleClearA}
                  hitSlop={12}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {activeSearchField === "A" && queryA.length > 0 && (
              <View
                style={[
                  styles.dropdownContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.card,
                  },
                ]}
              >
                {searchA.isLoading ? (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  </View>
                ) : (
                  (searchA.data?.items ?? []).slice(0, 5).map((fruit) => (
                    <Pressable
                      key={fruit.id}
                      onPress={() => handleSelectA(fruit)}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: pressed ? colors.backgroundMuted : colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getProduceIcon(fruit.subcategory, fruit.name)}
                        size={16}
                        color={colors.primary}
                        style={styles.dropdownIcon}
                      />
                      <Text variant="caption" color="primary" style={styles.dropdownName} numberOfLines={1}>
                        {fruit.name}
                      </Text>
                      {selectedFruitA?.id === fruit.id && (
                        <Ionicons name="checkmark" size={16} color={colors.statusSuccess} />
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderColor: activeSearchField === "B" ? colors.primary : colors.border,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                placeholder="Second item..."
                placeholderTextColor={colors.textMuted}
                value={queryB}
                onChangeText={(text) => {
                  setQueryB(text);
                  setActiveSearchField("B");
                  if (!text && selectedFruitB) setSelectedFruitB(null);
                }}
                onFocus={() => setActiveSearchField("B")}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                autoCapitalize="words"
              />
              {queryB.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear second item"
                  onPress={handleClearB}
                  hitSlop={12}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {activeSearchField === "B" && queryB.length > 0 && (
              <View
                style={[
                  styles.dropdownContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.card,
                  },
                ]}
              >
                {searchB.isLoading ? (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  </View>
                ) : (
                  (searchB.data?.items ?? []).slice(0, 5).map((fruit) => (
                    <Pressable
                      key={fruit.id}
                      onPress={() => handleSelectB(fruit)}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: pressed ? colors.backgroundMuted : colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getProduceIcon(fruit.subcategory, fruit.name)}
                        size={16}
                        color={colors.primary}
                        style={styles.dropdownIcon}
                      />
                      <Text variant="caption" color="primary" style={styles.dropdownName} numberOfLines={1}>
                        {fruit.name}
                      </Text>
                      {selectedFruitB?.id === fruit.id && (
                        <Ionicons name="checkmark" size={16} color={colors.statusSuccess} />
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {pairError && (
          <View
            style={[
              styles.pairErrorBox,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.danger,
                borderRadius: radius.card,
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text variant="caption" color="danger" style={styles.pairErrorText}>
              {pairError}
            </Text>
          </View>
        )}

        {inventoryItems.length > 0 && (
          <View style={styles.fridgeQuickSection}>
            <Text variant="caption" color="tertiary" style={styles.quickLabel}>
              From your fridge
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fridgeChipsScroll}
            >
              {inventoryItems.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => {
                    if (!selectedFruitA) {
                      setSelectedFruitA(it.fruit);
                      setQueryA(it.fruit.name);
                    } else if (!selectedFruitB && selectedFruitA.id !== it.fruit.id) {
                      setSelectedFruitB(it.fruit);
                      setQueryB(it.fruit.name);
                    } else {
                      setSelectedFruitA(it.fruit);
                      setQueryA(it.fruit.name);
                    }
                  }}
                  style={[
                    styles.fridgeChip,
                    {
                      backgroundColor: colors.backgroundMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={getProduceIcon(it.fruit.subcategory, it.fruit.name)}
                    size={14}
                    color={colors.primary}
                  />
                  <Text variant="caption" color="primary">
                    {it.fruit.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {resolvingPair ? (
          <View style={styles.resolvingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text variant="caption" color="secondary">
              Loading produce records...
            </Text>
          </View>
        ) : hasBothSelected ? (
          <View style={styles.resultsContainer}>
            <View
              style={[
                styles.verdictCard,
                {
                  backgroundColor: isIncompatible ? colors.dangerSoft : colors.statusSuccessSoft,
                  borderColor: isIncompatible ? colors.statusUrgent : colors.statusSuccess,
                  borderRadius: radius.sheet,
                },
              ]}
            >
              <View
                style={[
                  styles.verdictBadge,
                  {
                    backgroundColor: isIncompatible ? colors.statusUrgent : colors.statusSuccess,
                  },
                ]}
              >
                <Ionicons
                  name={isIncompatible ? "close" : "checkmark"}
                  size={30}
                  color={colors.primaryText}
                />
              </View>

              <Text
                variant="headline"
                color={isIncompatible ? "danger" : "success"}
                style={styles.verdictTitle}
              >
                {isIncompatible ? "Keep Separate" : "Safe Together"}
              </Text>

              <Text variant="body" color="primary" align="center" style={styles.verdictBody}>
                {isIncompatible
                  ? `Do not store ${selectedFruitA.name} and ${selectedFruitB.name} in the same drawer or bowl.`
                  : `${selectedFruitA.name} and ${selectedFruitB.name} can sit together without speeding up spoilage.`}
              </Text>

              <View
                style={[
                  styles.explanationPill,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.card,
                    borderWidth: borders.hairline,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  align="center"
                  color={isIncompatible ? "danger" : "success"}
                >
                  {compatibilityReason}
                </Text>
              </View>
            </View>

            <View style={styles.profilesGrid}>
              {renderProfileCard(selectedFruitA)}
              {renderProfileCard(selectedFruitB)}
            </View>

            <View
              style={[
                styles.guidelinesBox,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderRadius: radius.card,
                },
              ]}
            >
              <View style={styles.guidelinesHeader}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text variant="bodyStrong" color="primary">
                  How to store these
                </Text>
              </View>
              <Text variant="caption" color="secondary" style={styles.guidelinesBody}>
                {isIncompatible
                  ? `Store gas-releasing produce like bananas or apples in an open counter bowl, and place gas-sensitive items like ${selectedFruitA.is_ethylene_sensitive ? selectedFruitA.name : selectedFruitB.name} inside a closed crisper drawer.`
                  : "Both items have compatible gas profiles and can share the same storage shelf or basket."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.backgroundMuted }]}>
              <Ionicons name="swap-horizontal" size={34} color={colors.primary} />
            </View>

            <Text variant="headline" color="primary" style={styles.emptyTitle}>
              Check compatibility
            </Text>
            <Text variant="body" color="secondary" align="center" style={styles.emptyDescription}>
              Pick two items above to see whether natural ripening gas from one will spoil the other.
            </Text>

            <View style={styles.pairingsSection}>
              <Text variant="bodyStrong" color="primary" style={styles.pairingsHeader}>
                Common kitchen pairs
              </Text>

              <View style={styles.pairingsList}>
                {QUICK_PAIRING_QUERIES.map((pair) => (
                  <Pressable
                    key={pair.label}
                    onPress={() => void handleSelectQuickPairing(pair)}
                    style={({ pressed }) => [
                      styles.pairingCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.card,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View style={styles.pairingLeft}>
                      <View style={[styles.pairingIconBox, { backgroundColor: colors.backgroundMuted }]}>
                        <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
                      </View>
                      <Text variant="bodyStrong" color="primary">
                        {pair.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    zIndex: 20,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },
  clearBtn: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    shadowColor: "#1A241B",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  dropdownLoading: {
    padding: 16,
    alignItems: "center",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownName: {
    flex: 1,
  },
  pairErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  pairErrorText: {
    flex: 1,
  },
  fridgeQuickSection: {
    marginBottom: 20,
  },
  quickLabel: {
    marginBottom: 8,
  },
  fridgeChipsScroll: {
    flexDirection: "row",
    gap: 8,
  },
  fridgeChip: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
  },
  resolvingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  resultsContainer: {
    marginTop: 4,
  },
  verdictCard: {
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  verdictBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verdictTitle: {
    marginBottom: 8,
  },
  verdictBody: {
    marginBottom: 16,
    maxWidth: 280,
  },
  explanationPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: "100%",
  },
  profilesGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  profileCard: {
    flex: 1,
    borderWidth: 1,
    padding: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  profileName: {
    marginBottom: 10,
  },
  metaTraitsList: {
    gap: 8,
  },
  metaTraitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  traitText: {
    flex: 1,
  },
  traitDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 2,
  },
  guidelinesBox: {
    padding: 16,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  guidelinesBody: {
    lineHeight: 19,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 6,
  },
  emptyDescription: {
    maxWidth: 290,
    marginBottom: 28,
  },
  pairingsSection: {
    width: "100%",
  },
  pairingsHeader: {
    marginBottom: 12,
  },
  pairingsList: {
    gap: 10,
  },
  pairingCard: {
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pairingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pairingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
