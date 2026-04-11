const DEFAULT_OTHER_COLOR = '#8b949e';
const OTHER_KEY = 'other';
const OTHER_LABEL = 'Other';

export const DEFAULT_MAX_LANGUAGE_SLICES = 5;

interface LanguageBucket {
  name: string;
  color: string;
  size: number;
}

function sortLanguagesBySizeDesc(left: LanguageBucket, right: LanguageBucket): number {
  const bySize = right.size - left.size;
  if (Math.abs(bySize) > 0.000001) {
    return bySize;
  }

  return left.name.localeCompare(right.name);
}

function normalizeLanguageName(rawName: string): string {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return OTHER_LABEL;
  }

  return trimmed.toLowerCase() === OTHER_KEY ? OTHER_LABEL : trimmed;
}

function languageKey(rawName: string): string {
  return normalizeLanguageName(rawName).toLowerCase();
}

export function fallbackLanguageColor(name: string): string {
  let hash = 0;

  for (const char of name) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function addLanguageWeight(
  buckets: Map<string, LanguageBucket>,
  rawName: string,
  rawSize: number,
  rawColor?: string | null
): void {
  const size = Number.isFinite(rawSize) ? Math.max(0, rawSize) : 0;
  if (size <= 0) {
    return;
  }

  const name = normalizeLanguageName(rawName);
  const key = languageKey(name);
  const color = rawColor?.trim() || fallbackLanguageColor(name);
  const current = buckets.get(key);

  if (!current) {
    buckets.set(key, { name, size, color });
    return;
  }

  current.size += size;
  if (!current.color && color) {
    current.color = color;
  }
}

export function collapseLanguageBuckets(
  buckets: Map<string, LanguageBucket>,
  maxSlices = DEFAULT_MAX_LANGUAGE_SLICES
): LanguageBucket[] {
  if (maxSlices <= 0) {
    return [];
  }

  const languages = [...buckets.values()].filter((language) => language.size > 0).sort(sortLanguagesBySizeDesc);
  if (languages.length <= maxSlices) {
    return languages;
  }

  const topLanguages = languages.slice(0, maxSlices - 1);
  const otherSize = languages.slice(maxSlices - 1).reduce((sum, language) => sum + language.size, 0);
  if (otherSize > 0) {
    const existingOther = topLanguages.find((language) => language.name.toLowerCase() === OTHER_KEY);
    if (existingOther) {
      existingOther.size += otherSize;
      if (!existingOther.color) {
        existingOther.color = DEFAULT_OTHER_COLOR;
      }
    } else {
      topLanguages.push({ name: OTHER_LABEL, size: otherSize, color: DEFAULT_OTHER_COLOR });
    }
  }

  return topLanguages.sort(sortLanguagesBySizeDesc);
}
