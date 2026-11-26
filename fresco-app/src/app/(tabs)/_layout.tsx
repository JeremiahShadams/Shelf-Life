/**
 * Fresco — Tab shell
 * Four tabs whose tab labels, route filenames, and screen headers match 1:1:
 * Scan (index) • Fridge (fridge) • Storage (storage) • Profile (profile).
 */

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { useTheme } from "../../../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type IconProps = { focused: boolean; color: ColorValue; size: number };

function toIconColor(color: ColorValue): string | undefined {
  if (color == null) return undefined;
  if (typeof color === "number") {
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
function FridgeIcon(args: IconProps) {
  return <TabIcon outline="list-outline" filled="list" {...args} />;
}
function StorageIcon(args: IconProps) {
  return <TabIcon outline="swap-horizontal-outline" filled="swap-horizontal" {...args} />;
}
function ProfileIcon(args: IconProps) {
  return <TabIcon outline="person-outline" filled="person" {...args} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
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
          tabBarIcon: FridgeIcon,
        }}
      />
      <Tabs.Screen
        name="storage"
        options={{
          title: "Storage",
          tabBarIcon: StorageIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tabs>
  );
}
