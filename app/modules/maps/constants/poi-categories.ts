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
    markerBgClass: "bg-orange-500",
    icon: "🍽️",
  },
  {
    id: "shopping",
    labelKey: "geography.poiCategories.shopping",
    color: "#a855f7", // Purple
    bgColor: "#e9d5ff",
    markerBgClass: "bg-purple-500",
    icon: "🛍️",
  },
  {
    id: "transport",
    labelKey: "geography.poiCategories.transport",
    color: "#3b82f6", // Blue
    bgColor: "#bfdbfe",
    markerBgClass: "bg-blue-500",
    icon: "🚌",
  },
  {
    id: "lodging",
    labelKey: "geography.poiCategories.lodging",
    color: "#06b6d4", // Cyan
    bgColor: "#a5f3fc",
    markerBgClass: "bg-cyan-500",
    icon: "🏨",
  },
  {
    id: "health",
    labelKey: "geography.poiCategories.health",
    color: "#ef4444", // Red
    bgColor: "#fecaca",
    markerBgClass: "bg-red-500",
    icon: "🏥",
  },
  {
    id: "entertainment",
    labelKey: "geography.poiCategories.entertainment",
    color: "#eab308", // Yellow
    bgColor: "#fef08a",
    markerBgClass: "bg-yellow-500",
    icon: "🎭",
  },
  {
    id: "nature",
    labelKey: "geography.poiCategories.nature",
    color: "#22c55e", // Green
    bgColor: "#bbf7d0",
    markerBgClass: "bg-green-500",
    icon: "🌳",
  },
  {
    id: "services",
    labelKey: "geography.poiCategories.services",
    color: "#1e40af", // Dark Blue
    bgColor: "#93c5fd",
    markerBgClass: "bg-blue-800",
    icon: "🔧",
  },
  {
    id: "education",
    labelKey: "geography.poiCategories.education",
    color: "#14b8a6", // Teal
    bgColor: "#99f6e4",
    markerBgClass: "bg-teal-500",
    icon: "🎓",
  },
  {
    id: "religion",
    labelKey: "geography.poiCategories.religion",
    color: "#92400e", // Brown
    bgColor: "#d6d3d1",
    markerBgClass: "bg-amber-800",
    icon: "⛪",
  },
  {
    id: "business",
    labelKey: "geography.poiCategories.business",
    color: "#6b7280", // Gray
    bgColor: "#d1d5db",
    markerBgClass: "bg-gray-500",
    icon: "💼",
  },
  {
    id: "tourism",
    labelKey: "geography.poiCategories.tourism",
    color: "#ec4899", // Pink
    bgColor: "#fbcfe8",
    markerBgClass: "bg-pink-500",
    icon: "📸",
  },
  {
    id: "emergency",
    labelKey: "geography.poiCategories.emergency",
    color: "#991b1b", // Red Dark
    bgColor: "#fca5a5",
    markerBgClass: "bg-red-800",
    icon: "🚨",
  },
  {
    id: "utilities",
    labelKey: "geography.poiCategories.utilities",
    color: "#374151", // Dark Gray
    bgColor: "#9ca3af",
    markerBgClass: "bg-gray-700",
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
 * Get category marker Tailwind background class by ID (CLAUDE.md rule #8 —
 * the Leaflet marker's raw HTML string can't use `color`'s hex value, since
 * Tailwind's content scanner only matches literal class names).
 */
export function getCategoryMarkerBgClass(id: string): string {
  return getCategoryById(id)?.markerBgClass || "bg-gray-500";
}

/**
 * Get category background color by ID
 */
export function getCategoryBgColor(id: string): string {
  return getCategoryById(id)?.bgColor || "#d1d5db";
}
