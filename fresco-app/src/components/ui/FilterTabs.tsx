/**
 * FRESCO — Uber Base Filter Tabs
 * Minimalist underlined tab bar: All • Eat First • Fresh • Expired
 * Bold active tab with solid black bottom indicator line.
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../theme";
import { Text } from "./Text";

export type TabKey = "all" | "eat_first" | "fresh" | "expired";

export type FilterTabItem = {
  key: TabKey;
  label: string;
};

export const DEFAULT_FILTER_TABS: FilterTabItem[] = [
  { key: "all", label: "All" },
  { key: "eat_first", label: "Eat First" },
  { key: "fresh", label: "Fresh" },
  { key: "expired", label: "Expired" },
];

export type FilterTabsProps = {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  tabs?: FilterTabItem[];
  style?: StyleProp<ViewStyle>;
};

export function FilterTabs({
  activeTab,
  onTabChange,
  tabs = DEFAULT_FILTER_TABS,
  style,
}: FilterTabsProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      <View style={[styles.tabsRow, { gap: spacing.l }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onTabChange(tab.key)}
              style={styles.tabItem}
            >
              <Text
                variant="body"
                style={[
                  styles.tabText,
                  {
                    color: isActive ? colors.textPrimary : colors.textTertiary,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    {
                      backgroundColor: colors.textPrimary,
                    },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabItem: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
  },
});

