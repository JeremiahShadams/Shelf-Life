/**
 * Fresco — Meal Ideas ("What can I cook?")
 * Generates simple, actionable recipe suggestions using items
 * that need to be used today + common pantry staples.
 */

import { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { Text, Card, Button, Badge, EmptyState } from "../../components/ui";
import { useFridgeStore } from "../../stores/fridgeStore";
import type { RecipeSuggestion } from "../../types";

export default function IdeasScreen() {
  const theme = useTheme();
  const { colors, spacing, layout } = theme;
  const { items, markConsumed } = useFridgeStore();

  const [cookingId, setCookingId] = useState<string | null>(null);

  // Expiring items (<= 3 days)
  const expiringItems = items.filter((i) => !i.is_consumed && i.days_left <= 3);

  // Dynamic suggestions based on expiring items
  const recipes: RecipeSuggestion[] = [];

  if (expiringItems.length > 0) {
    const itemNames = expiringItems.map((i) => i.fruit.name).join(" & ");
    const relatedIds = expiringItems.map((i) => i.id);

    recipes.push({
      id: "recipe-smoothie",
      title: `${expiringItems[0].fruit.name} Energy Smoothie`,
      description: "Blend before it softens. Fast, nutritious, zero waste.",
      estimated_time_mins: 5,
      ingredients: [
        { name: expiringItems[0].fruit.name, amount: "1–2 whole", from_fridge: true },
        { name: "Yogurt or Milk", amount: "1 cup", from_fridge: false },
        { name: "Honey or Ice", amount: "To taste", from_fridge: false },
      ],
      steps: [
        `Wash, peel, and dice the ${expiringItems[0].fruit.name.toLowerCase()}.`,
        "Add milk or yogurt, honey, and ice into a blender.",
        "Blend on high for 45 seconds until smooth and creamy.",
      ],
      related_inventory_ids: [expiringItems[0].id],
    });

    if (expiringItems.length >= 2) {
      recipes.push({
        id: "recipe-bowl",
        title: `${itemNames} Fresh Fruit Bowl`,
        description: "Slice and serve cold with a drizzle of lime or honey.",
        estimated_time_mins: 8,
        ingredients: [
          ...expiringItems.slice(0, 3).map((item) => ({
            name: item.fruit.name,
            amount: "1 portion",
            from_fridge: true,
          })),
          { name: "Lime juice / Mint", amount: "Optional", from_fridge: false },
        ],
        steps: [
          "Dice all fruits into bite-sized cubes.",
          "Toss gently in a bowl with a squeeze of fresh lime juice.",
          "Enjoy immediately or chill for 10 minutes.",
        ],
        related_inventory_ids: relatedIds.slice(0, 3),
      });
    }
  }

  const handleCookedThis = async (recipe: RecipeSuggestion) => {
    setCookingId(recipe.id);
    for (const id of recipe.related_inventory_ids) {
      await markConsumed(id);
    }
    setCookingId(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
        ]}
      >
        {/* Header */}
        <View style={{ marginTop: spacing.m, marginBottom: spacing.l }}>
          <Text variant="largeTitle">Meal Ideas</Text>
          <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
            Simple ways to cook what is about to spoil.
          </Text>
        </View>

        {recipes.length === 0 ? (
          <EmptyState
            title="All items are fresh!"
            description="When groceries in your fridge get close to their expiry date, personalized recipes will appear here."
            visual={<Ionicons name="sparkles-outline" size={36} color={colors.accent} />}
          />
        ) : (
          <View style={{ gap: spacing.m }}>
            {recipes.map((recipe) => (
              <Card key={recipe.id} style={{ padding: spacing.m }}>
                {/* Title & Time */}
                <View style={styles.titleRow}>
                  <Text variant="headline" style={{ flex: 1 }}>
                    {recipe.title}
                  </Text>
                  <Badge label={`${recipe.estimated_time_mins} mins`} variant="calm" />
                </View>

                <Text variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
                  {recipe.description}
                </Text>

                {/* Ingredients checklist */}
                <View style={{ marginTop: spacing.m }}>
                  <Text variant="micro" color="tertiary" style={{ fontWeight: "600" }}>
                    INGREDIENTS
                  </Text>
                  <View style={{ marginTop: spacing.xs, gap: 4 }}>
                    {recipe.ingredients.map((ing, idx) => (
                      <View key={idx} style={styles.ingredientRow}>
                        <Ionicons
                          name={ing.from_fridge ? "checkmark-circle" : "ellipse-outline"}
                          size={14}
                          color={ing.from_fridge ? colors.accent : colors.textTertiary}
                        />
                        <Text variant="caption" color={ing.from_fridge ? "primary" : "secondary"}>
                          {ing.name} ({ing.amount})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Steps */}
                <View style={{ marginTop: spacing.m }}>
                  <Text variant="micro" color="tertiary" style={{ fontWeight: "600" }}>
                    STEPS
                  </Text>
                  <View style={{ marginTop: spacing.xs, gap: 6 }}>
                    {recipe.steps.map((step, idx) => (
                      <View key={idx} style={styles.stepRow}>
                        <Text variant="caption" style={{ fontWeight: "600", width: 18 }}>
                          {idx + 1}.
                        </Text>
                        <Text variant="caption" style={{ flex: 1 }}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action CTA */}
                <View style={{ marginTop: spacing.l }}>
                  <Button
                    label={cookingId === recipe.id ? "Updating fridge..." : "I Cooked This"}
                    variant="primary"
                    small
                    block
                    loading={cookingId === recipe.id}
                    onPress={() => handleCookedThis(recipe)}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
});
