/**
 * POI category configurations
 */

import type {
  POICategory,
  POICategoryConfig,
} from "@/app/modules/maps/types/poi";

export const POI_CATEGORIES: POICategoryConfig[] = [
  {
    id: "food-drink",
    labelKey: "geography.poiCategories.foodDrink",
    color: "#f97316", // Orange
    bgColor: "#fed7aa",
    icon: "🍽️",
  },
  {
    id: "shopping",
    labelKey: "geography.poiCategories.shopping",
    color: "#a855f7", // Purple
    bgColor: "#e9d5ff",
    icon: "🛍️",
  },
  {
    id: "transport",
    labelKey: "geography.poiCategories.transport",
    color: "#3b82f6", // Blue
    bgColor: "#bfdbfe",
    icon: "🚌",
  },
  {
    id: "lodging",
    labelKey: "geography.poiCategories.lodging",
    color: "#06b6d4", // Cyan
    bgColor: "#a5f3fc",
    icon: "🏨",
  },
  {
    id: "health",
    labelKey: "geography.poiCategories.health",
    color: "#ef4444", // Red
    bgColor: "#fecaca",
    icon: "🏥",
  },
  {
    id: "entertainment",
    labelKey: "geography.poiCategories.entertainment",
    color: "#eab308", // Yellow
    bgColor: "#fef08a",
    icon: "🎭",
  },
  {
    id: "nature",
    labelKey: "geography.poiCategories.nature",
    color: "#22c55e", // Green
    bgColor: "#bbf7d0",
    icon: "🌳",
  },
  {
    id: "services",
    labelKey: "geography.poiCategories.services",
    color: "#1e40af", // Dark Blue
    bgColor: "#93c5fd",
    icon: "🔧",
  },
  {
    id: "education",
    labelKey: "geography.poiCategories.education",
    color: "#14b8a6", // Teal
    bgColor: "#99f6e4",
    icon: "🎓",
  },
  {
    id: "religion",
    labelKey: "geography.poiCategories.religion",
    color: "#92400e", // Brown
    bgColor: "#d6d3d1",
    icon: "⛪",
  },
  {
    id: "business",
    labelKey: "geography.poiCategories.business",
    color: "#6b7280", // Gray
    bgColor: "#d1d5db",
    icon: "💼",
  },
  {
    id: "tourism",
    labelKey: "geography.poiCategories.tourism",
    color: "#ec4899", // Pink
    bgColor: "#fbcfe8",
    icon: "📸",
  },
  {
    id: "emergency",
    labelKey: "geography.poiCategories.emergency",
    color: "#991b1b", // Red Dark
    bgColor: "#fca5a5",
    icon: "🚨",
  },
  {
    id: "utilities",
    labelKey: "geography.poiCategories.utilities",
    color: "#374151", // Dark Gray
    bgColor: "#9ca3af",
    icon: "⚡",
  },
];

/**
 * Get category config by ID
 */
export function getCategoryById(id: string): POICategoryConfig | undefined {
  return POI_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Narrows a raw string to `POICategory`. `poi.category` is a plain `TEXT`
 * column with no database-level enum (SPEC-002 §6), so a row read back is
 * only a `string` as far as the type system knows — this is where it gets
 * checked against the list the app actually recognises.
 */
export function isPOICategory(value: string): value is POICategory {
  return POI_CATEGORIES.some((cat) => cat.id === value);
}

/**
 * Get category color by ID
 */
export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color || "#6b7280";
}

/**
 * Get category background color by ID
 */
export function getCategoryBgColor(id: string): string {
  return getCategoryById(id)?.bgColor || "#d1d5db";
}
