/**
 * Fresco — Tab shell
 * Four tabs: Scan (home) • Fridge • Ideas • Profile.
 * JavaScript tabs (bundled with Expo Router, SDK 56+). Native headers are
 * off — each screen renders its own large title in content.
 */

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { useTheme } from "../../../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type IconProps = { focused: boolean; color: ColorValue; size: number };

// Ionicons only accepts plain string colors; the tab bar may pass a
// slightly wider ColorValue. Narrow it here, not inline.
function toIconColor(color: ColorValue): string | undefined {
  if (color == null) return undefined;
  if (typeof color === "number") {
    // ARGB int → hex string (rare fallback path)
    return `#${color.toString(16).padStart(8, "0")}`;
  }
  return typeof color === "string" ? color : undefined;
}

type TabIconProps = { outline: IconName; filled: IconName } & IconProps;

function TabIcon({ outline, filled, focused, color, size }: TabIconProps) {
  return <Ionicons name={focused ? filled : outline} size={size} color={toIconColor(color)} />;
}

function ScanIcon(args: IconProps) {
  return <TabIcon outline="scan-outline" filled="scan" {...args} />;
}
function InventoryIcon(args: IconProps) {
  return <TabIcon outline="list-outline" filled="list" {...args} />;
}
function IdeasIcon(args: IconProps) {
  return <TabIcon outline="bulb-outline" filled="bulb" {...args} />;
}
function AccountIcon(args: IconProps) {
  return <TabIcon outline="person-outline" filled="person" {...args} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: theme.borders.hairline,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Scan",
          tabBarIcon: ScanIcon,
        }}
      />
      <Tabs.Screen
        name="fridge"
        options={{
          title: "Fridge",
          tabBarIcon: InventoryIcon,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Ideas",
          tabBarIcon: IdeasIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: AccountIcon,
        }}
      />
    </Tabs>
  );
}
