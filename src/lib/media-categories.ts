export const MEDIA_CATEGORIES_CONFIG_KEY = "media_categories";
export const DEFAULT_MEDIA_CATEGORIES = ["Natural Beauty", "Friends"] as const;

export type MediaCategory = string;

export function normalizeMediaCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parseMediaCategory(value: string, allowedCategories: string[]) {
  const normalized = normalizeMediaCategoryName(value);

  if (!normalized) {
    throw new Error("Select a category before uploading.");
  }

  if (!allowedCategories.includes(normalized)) {
    throw new Error("Select a valid category.");
  }

  return normalized;
}

export function parseMediaCategoriesValue(value: string | null | undefined) {
  if (!value) {
    return [...DEFAULT_MEDIA_CATEGORIES];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_MEDIA_CATEGORIES];
    }

    const categories = parsed
      .map((item) => (typeof item === "string" ? normalizeMediaCategoryName(item) : ""))
      .filter(Boolean);

    return categories.length > 0 ? Array.from(new Set(categories)) : [...DEFAULT_MEDIA_CATEGORIES];
  } catch {
    return [...DEFAULT_MEDIA_CATEGORIES];
  }
}

export function serializeMediaCategoriesValue(categories: string[]) {
  return JSON.stringify(Array.from(new Set(categories.map(normalizeMediaCategoryName).filter(Boolean))));
}

export function getMediaCategoryLabel(category: string) {
  return normalizeMediaCategoryName(category);
}
