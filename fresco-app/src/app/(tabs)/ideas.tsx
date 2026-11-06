/**
 * FRESCO — Storage Compatibility Checker Screen
 * Matches SuperDesign draft (9a36772d-5d7e-446a-93b6-e2798aadaa6b):
 * - Dual Fruit A & Fruit B search selectors with autocomplete dropdown
 * - Instant Hero Compatibility Verdict Card (INCOMPATIBLE / COMPATIBLE)
 * - Side-by-side fruit gas profiles (High/Low Producer, Sensitive, Storage place)
 * - Shared storage guidelines
 * - Empty state with interactive Common Pairings quick-taps
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
import { Loading, Text } from "../../components/ui";
import { useCompatibility, useFruitSearch } from "../../hooks/useFruits";
import { useInventory } from "../../hooks/useInventory";
import type { Fruit } from "../../types/api";

function getFruitEmoji(name?: string): string {
  if (!name) return "🍏";
  const lower = name.toLowerCase();
  if (lower.includes("apple")) return "🍎";
  if (lower.includes("banana")) return "🍌";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("orange") || lower.includes("citrus")) return "🍊";
  if (lower.includes("avocado")) return "🥑";
  if (lower.includes("strawberr") || lower.includes("berr")) return "🍓";
  if (lower.includes("lemon") || lower.includes("lime")) return "🍋";
  if (lower.includes("mango")) return "🥭";
  if (lower.includes("grape")) return "🍇";
  if (lower.includes("melon") || lower.includes("watermelon")) return "🍉";
  if (lower.includes("peach")) return "🍑";
  if (lower.includes("pear")) return "🍐";
  if (lower.includes("pineapple")) return "🍍";
  if (lower.includes("kiwi")) return "🥝";
  if (lower.includes("cherry")) return "🍒";
  if (lower.includes("basil") || lower.includes("herb")) return "🌿";
  return "🍎";
}

const COMMON_PAIRINGS = [
  {
    fruitA: "Tomato",
    fruitB: "Banana",
    emojiA: "🍅",
    emojiB: "🍌",
    label: "Tomato & Banana",
    incompatible: true,
  },
  {
    fruitA: "Avocado",
    fruitB: "Banana",
    emojiA: "🥑",
    emojiB: "🍌",
    label: "Avocado & Banana",
    incompatible: false,
  },
  {
    fruitA: "Apple",
    fruitB: "Orange",
    emojiA: "🍎",
    emojiB: "🍊",
    label: "Apple & Orange",
    incompatible: true,
  },
  {
    fruitA: "Strawberry",
    fruitB: "Blueberry",
    emojiA: "🍓",
    emojiB: "🫐",
    label: "Strawberry & Blueberry",
    incompatible: false,
  },
];

export default function StorageCompatibilityScreen() {
  const theme = useTheme();
  const { colors, spacing, layout, radius, borders } = theme;

  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [selectedFruitA, setSelectedFruitA] = useState<Fruit | null>(null);
  const [selectedFruitB, setSelectedFruitB] = useState<Fruit | null>(null);
  const [activeSearchField, setActiveSearchField] = useState<"A" | "B" | null>(null);

  const inventoryQuery = useInventory();
  const inventoryItems = inventoryQuery.data?.items ?? [];

  // Autocomplete queries
  const searchA = useFruitSearch(queryA);
  const searchB = useFruitSearch(queryB);

  const pairNames = useMemo(() => {
    if (selectedFruitA && selectedFruitB) {
      return [selectedFruitA.name, selectedFruitB.name];
    }
    return [];
  }, [selectedFruitA, selectedFruitB]);

  const compatibilityQuery = useCompatibility(pairNames);

  // Compute compatibility status
  const isIncompatible = useMemo(() => {
    if (!selectedFruitA || !selectedFruitB) return false;

    // Check backend compatibility response
    if (compatibilityQuery.data?.incompatible_pairs && compatibilityQuery.data.incompatible_pairs.length > 0) {
      return true;
    }

    // Direct ethylene chemical rule: High producer next to sensitive produce
    const aProduces = selectedFruitA.is_ethylene_producer;
    const aSensitive = selectedFruitA.is_ethylene_sensitive;
    const bProduces = selectedFruitB.is_ethylene_producer;
    const bSensitive = selectedFruitB.is_ethylene_sensitive;

    if ((aProduces && bSensitive) || (bProduces && aSensitive)) {
      return true;
    }

    return false;
  }, [selectedFruitA, selectedFruitB, compatibilityQuery.data]);

  const compatibilityReason = useMemo(() => {
    if (!selectedFruitA || !selectedFruitB) return "";

    if (compatibilityQuery.data?.incompatible_pairs?.[0]?.warning) {
      return compatibilityQuery.data.incompatible_pairs[0].warning;
    }

    if (selectedFruitA.is_ethylene_producer && selectedFruitB.is_ethylene_sensitive) {
      return `${selectedFruitA.name} produces high ethylene gas, causing ${selectedFruitB.name} to ripen and spoil prematurely.`;
    }
    if (selectedFruitB.is_ethylene_producer && selectedFruitA.is_ethylene_sensitive) {
      return `${selectedFruitB.name} produces high ethylene gas, causing ${selectedFruitA.name} to ripen and spoil prematurely.`;
    }
    return "Neither produce accelerates ethylene decay for the other.";
  }, [selectedFruitA, selectedFruitB, compatibilityQuery.data]);

  const handleSelectA = (fruit: Fruit) => {
    setSelectedFruitA(fruit);
    setQueryA(fruit.name);
    setActiveSearchField(null);
    Keyboard.dismiss();
  };

  const handleSelectB = (fruit: Fruit) => {
    setSelectedFruitB(fruit);
    setQueryB(fruit.name);
    setActiveSearchField(null);
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

  const handleSelectCommonPairing = (pairing: typeof COMMON_PAIRINGS[0]) => {
    setQueryA(pairing.fruitA);
    setQueryB(pairing.fruitB);
    setActiveSearchField(null);
    Keyboard.dismiss();

    // Look up real fruit records or synthesize fallback
    const fruitA: Fruit = {
      id: 991,
      name: pairing.fruitA,
      subcategory: "Produce",
      shelf_life_room_temp_days: 3,
      shelf_life_fridge_days: 7,
      shelf_life_freezer_days: 30,
      is_ethylene_producer: pairing.fruitA === "Banana" || pairing.fruitA === "Apple" || pairing.fruitA === "Avocado",
      is_ethylene_sensitive: pairing.fruitA === "Tomato" || pairing.fruitA === "Banana",
      optimal_temp_min: null,
      optimal_temp_max: null,
      ripeness_indicator: null,
      storage_tips: `Keep ${pairing.fruitA} stored properly based on ripening stage.`,
      image_url: null,
    };

    const fruitB: Fruit = {
      id: 992,
      name: pairing.fruitB,
      subcategory: "Produce",
      shelf_life_room_temp_days: 4,
      shelf_life_fridge_days: 8,
      shelf_life_freezer_days: 30,
      is_ethylene_producer: pairing.fruitB === "Banana" || pairing.fruitB === "Apple" || pairing.fruitB === "Avocado",
      is_ethylene_sensitive: pairing.fruitB === "Tomato" || pairing.fruitB === "Orange" || pairing.fruitB === "Basil",
      optimal_temp_min: null,
      optimal_temp_max: null,
      ripeness_indicator: null,
      storage_tips: `Keep ${pairing.fruitB} away from ethylene producers.`,
      image_url: null,
    };

    setSelectedFruitA(fruitA);
    setSelectedFruitB(fruitB);
  };

  const hasBothSelected = selectedFruitA != null && selectedFruitB != null;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Screen Header */}
      <View style={[styles.headerContainer, { paddingHorizontal: layout.screenPadding }]}>
        <Text variant="largeTitle" style={styles.headerTitle}>
          Storage Check
        </Text>
        <Text variant="caption" color="secondary" style={styles.headerSubtitle}>
          Find out which fruits go well together
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: layout.screenPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dual Fruit Search Inputs */}
        <View style={styles.inputsRow}>
          {/* Fruit A Input */}
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
              <Ionicons
                name="search"
                size={16}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search..."
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
                  onPress={handleClearA}
                  hitSlop={8}
                  style={styles.clearBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Dropdown for A */}
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
                      <Text style={styles.dropdownEmoji}>
                        {getFruitEmoji(fruit.name)}
                      </Text>
                      <Text
                        variant="body"
                        style={[styles.dropdownName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {fruit.name}
                      </Text>
                      {selectedFruitA?.id === fruit.id && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.statusSuccess}
                        />
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Fruit B Input */}
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
              <Ionicons
                name="search"
                size={16}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search..."
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
                  onPress={handleClearB}
                  hitSlop={8}
                  style={styles.clearBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Dropdown for B */}
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
                      <Text style={styles.dropdownEmoji}>
                        {getFruitEmoji(fruit.name)}
                      </Text>
                      <Text
                        variant="body"
                        style={[styles.dropdownName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {fruit.name}
                      </Text>
                      {selectedFruitB?.id === fruit.id && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.statusSuccess}
                        />
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

        {/* Quick Fridge Items Bar */}
        {inventoryItems.length > 0 && (
          <View style={styles.fridgeQuickSection}>
            <Text variant="micro" color="tertiary" style={styles.quickLabel}>
              FROM YOUR FRIDGE
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
                  <Text style={styles.chipEmoji}>{getFruitEmoji(it.fruit.name)}</Text>
                  <Text variant="caption" style={styles.chipText}>
                    {it.fruit.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* RESULTS STATE */}
        {hasBothSelected ? (
          <View style={styles.resultsContainer}>
            {/* Compatibility Hero Card */}
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
              {/* Circular Verdict Badge */}
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
                  size={32}
                  color="#FFFFFF"
                />
              </View>

              {/* Verdict Heading */}
              <Text
                style={[
                  styles.verdictTitle,
                  {
                    color: isIncompatible ? colors.statusUrgent : colors.statusSuccess,
                  },
                ]}
              >
                {isIncompatible ? "INCOMPATIBLE" : "COMPATIBLE"}
              </Text>

              {/* High-level advice */}
              <Text variant="body" style={styles.verdictBody}>
                {isIncompatible
                  ? `Do not store ${selectedFruitA.name} and ${selectedFruitB.name} together.`
                  : `${selectedFruitA.name} and ${selectedFruitB.name} can be stored together safely.`}
              </Text>

              {/* Chemical explanation tag */}
              <View
                style={[
                  styles.explanationPill,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.card,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.explanationText,
                    {
                      color: isIncompatible ? colors.statusUrgent : colors.statusSuccess,
                    },
                  ]}
                >
                  {compatibilityReason}
                </Text>
              </View>
            </View>

            {/* Side-by-Side Profiles Grid */}
            <View style={styles.profilesGrid}>
              {/* Profile A */}
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
                <View
                  style={[
                    styles.emojiBox,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Text style={styles.profileEmoji}>
                    {getFruitEmoji(selectedFruitA.name)}
                  </Text>
                </View>
                <Text
                  variant="headline"
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {selectedFruitA.name}
                </Text>

                <View style={styles.metaTraitsList}>
                  {/* Ethylene Producer */}
                  <View style={styles.metaTraitRow}>
                    <Ionicons
                      name={selectedFruitA.is_ethylene_producer ? "flash" : "leaf-outline"}
                      size={14}
                      color={selectedFruitA.is_ethylene_producer ? colors.statusUrgent : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.traitLabel,
                        {
                          color: selectedFruitA.is_ethylene_producer ? colors.statusUrgent : colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedFruitA.is_ethylene_producer ? "High Producer" : "Low Producer"}
                    </Text>
                  </View>

                  {/* Ethylene Sensitive */}
                  <View style={styles.metaTraitRow}>
                    <Ionicons
                      name={selectedFruitA.is_ethylene_sensitive ? "warning" : "shield-checkmark-outline"}
                      size={14}
                      color={selectedFruitA.is_ethylene_sensitive ? colors.statusWarning : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.traitLabel,
                        {
                          color: selectedFruitA.is_ethylene_sensitive ? colors.statusWarning : colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedFruitA.is_ethylene_sensitive ? "Sensitive" : "Not Sensitive"}
                    </Text>
                  </View>

                  {/* Best Storage */}
                  <View style={[styles.metaTraitRow, styles.traitDivider, { borderTopColor: colors.border }]}>
                    <Ionicons
                      name="snow-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.traitLabel, { color: colors.textSecondary }]}>
                      Store: Fridge
                    </Text>
                  </View>
                </View>
              </View>

              {/* Profile B */}
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
                <View
                  style={[
                    styles.emojiBox,
                    { backgroundColor: colors.backgroundMuted },
                  ]}
                >
                  <Text style={styles.profileEmoji}>
                    {getFruitEmoji(selectedFruitB.name)}
                  </Text>
                </View>
                <Text
                  variant="headline"
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {selectedFruitB.name}
                </Text>

                <View style={styles.metaTraitsList}>
                  {/* Ethylene Producer */}
                  <View style={styles.metaTraitRow}>
                    <Ionicons
                      name={selectedFruitB.is_ethylene_producer ? "flash" : "leaf-outline"}
                      size={14}
                      color={selectedFruitB.is_ethylene_producer ? colors.statusUrgent : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.traitLabel,
                        {
                          color: selectedFruitB.is_ethylene_producer ? colors.statusUrgent : colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedFruitB.is_ethylene_producer ? "High Producer" : "Low Producer"}
                    </Text>
                  </View>

                  {/* Ethylene Sensitive */}
                  <View style={styles.metaTraitRow}>
                    <Ionicons
                      name={selectedFruitB.is_ethylene_sensitive ? "warning" : "shield-checkmark-outline"}
                      size={14}
                      color={selectedFruitB.is_ethylene_sensitive ? colors.statusWarning : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.traitLabel,
                        {
                          color: selectedFruitB.is_ethylene_sensitive ? colors.statusWarning : colors.textSecondary,
                        },
                      ]}
                    >
                      {selectedFruitB.is_ethylene_sensitive ? "Sensitive" : "Not Sensitive"}
                    </Text>
                  </View>

                  {/* Best Storage */}
                  <View style={[styles.metaTraitRow, styles.traitDivider, { borderTopColor: colors.border }]}>
                    <Ionicons
                      name="sunny-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.traitLabel, { color: colors.textSecondary }]}>
                      Store: Counter
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Shared Storage Guidelines */}
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
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.textPrimary}
                />
                <Text variant="body" style={styles.guidelinesTitle}>
                  How to store these
                </Text>
              </View>
              <Text
                variant="caption"
                style={[styles.guidelinesBody, { color: colors.textSecondary }]}
              >
                {isIncompatible
                  ? `Keep ${selectedFruitB.name} separated from ${selectedFruitA.name}. Store high producers like bananas or apples in an open bowl on the counter, and keep sensitive fruits inside the crisper drawer with the vent closed.`
                  : `Both items have matching ethylene profiles. You can store them together in your fridge or kitchen pantry safely.`}
              </Text>
            </View>
          </View>
        ) : (
          /* EMPTY STATE */
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.backgroundMuted },
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={34}
                color={colors.textSecondary}
              />
            </View>

            <Text variant="headline" style={styles.emptyTitle}>
              Check Compatibility
            </Text>
            <Text
              variant="body"
              color="secondary"
              style={styles.emptyDescription}
            >
              Select two fruits above to see if they can be stored together safely.
            </Text>

            {/* Common Pairings Section */}
            <View style={styles.pairingsSection}>
              <Text variant="micro" color="tertiary" style={styles.pairingsHeader}>
                COMMON PAIRINGS
              </Text>

              <View style={styles.pairingsList}>
                {COMMON_PAIRINGS.map((pair, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectCommonPairing(pair)}
                    style={({ pressed }) => [
                      styles.pairingCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.card,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={styles.pairingLeft}>
                      <Text style={styles.pairingEmojiPair}>
                        {pair.emojiA} + {pair.emojiB}
                      </Text>
                      <Text
                        variant="body"
                        style={[styles.pairingLabel, { color: colors.textPrimary }]}
                      >
                        {pair.label}
                      </Text>
                    </View>

                    <Ionicons
                      name={pair.incompatible ? "close-circle" : "checkmark-circle"}
                      size={20}
                      color={pair.incompatible ? colors.statusUrgent : colors.statusSuccess}
                    />
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
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
    fontWeight: "700",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  dropdownContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    shadowColor: "#000000",
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  dropdownName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  fridgeQuickSection: {
    marginBottom: 20,
  },
  quickLabel: {
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  fridgeChipsScroll: {
    flexDirection: "row",
    gap: 8,
  },
  fridgeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontWeight: "600",
  },
  resultsContainer: {
    marginTop: 4,
  },
  verdictCard: {
    borderWidth: 2,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  verdictBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verdictTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  verdictBody: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 280,
    lineHeight: 21,
  },
  explanationPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: "100%",
  },
  explanationText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
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
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  profileEmoji: {
    fontSize: 24,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  metaTraitsList: {
    gap: 6,
  },
  metaTraitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  traitLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  traitDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 4,
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
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  guidelinesBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: 32,
  },
  pairingsSection: {
    width: "100%",
  },
  pairingsHeader: {
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  pairingsList: {
    gap: 10,
  },
  pairingCard: {
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pairingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pairingEmojiPair: {
    fontSize: 18,
  },
  pairingLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
});
