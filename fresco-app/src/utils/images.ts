/**
 * Fresco — Shared image source resolution
 * Replaces duplicated Unsplash URLs with offline-safe bundled placeholders
 * when a produce item has no captured photo or cached server path.
 */

import type { ImageSourcePropType } from "react-native";
import { API_URL } from "../services/api";

const PLACEHOLDERS = {
  produce: require("../../assets/images/placeholders/produce.png") as ImageSourcePropType,
  citrus: require("../../assets/images/placeholders/citrus.png") as ImageSourcePropType,
  berries: require("../../assets/images/placeholders/berries.png") as ImageSourcePropType,
  tropical: require("../../assets/images/placeholders/tropical.png") as ImageSourcePropType,
};

export function resolveLocalPlaceholder(categoryOrName?: string | null): ImageSourcePropType {
  const s = (categoryOrName ?? "").toLowerCase();
  if (s.includes("citrus") || s.includes("orange") || s.includes("lemon") || s.includes("lime")) {
    return PLACEHOLDERS.citrus;
  }
  if (s.includes("berr") || s.includes("straw") || s.includes("blue") || s.includes("tomato")) {
    return PLACEHOLDERS.berries;
  }
  if (s.includes("tropical") || s.includes("banana") || s.includes("mango") || s.includes("pineapple")) {
    return PLACEHOLDERS.tropical;
  }
  return PLACEHOLDERS.produce;
}

export function resolveItemImageSource(
  imagePath: string | null | undefined,
  categoryOrName?: string | null,
): ImageSourcePropType {
  if (!imagePath) {
    return resolveLocalPlaceholder(categoryOrName);
  }
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("file://") ||
    imagePath.startsWith("content://")
  ) {
    return { uri: imagePath };
  }
  const clean = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return { uri: `${API_URL}/${clean}` };
}
