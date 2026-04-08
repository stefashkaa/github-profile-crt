import path from "node:path";
import process from "node:process";
import {
  booleanEnv,
  optionalStringEnv,
  stringEnv,
  type EnvSource
} from "../utils/env";
import {
  getThemeConfigById,
  presetThemeNames,
  supportedModesForTheme,
  themeConfigForMode,
  type PresetThemeName,
  type ThemeName,
  type ThemePalette,
  type ThemeableConfig
} from "../render/themes";

export interface VisualConfig {
  showGrid: boolean;
  showStatsFooter: boolean;
  showStats: boolean;
  enableHoverAttrs: boolean;
}

export interface RuntimeConfig {
  username: string;
  token: string;
  outputDirectory: string;
  minifySvg: boolean;
  visual: VisualConfig;
  themes: ResolvedThemeConfig[];
}

export interface ResolvedThemeConfig {
  id: ThemeName;
  dark: ThemeableConfig;
  light?: ThemeableConfig;
}

const DEFAULT_OUTPUT_DIRECTORY = "assets";
const DEFAULT_THEMES = "all";

const THEME_TOKEN_ALL = "all";
const THEME_TOKEN_CUSTOM = "custom";

const PALETTE_ENV_SUFFIXES: Array<{ key: keyof ThemePalette; suffix: string }> = [
  { key: "bg0", suffix: "BG0" },
  { key: "bg1", suffix: "BG1" },
  { key: "bg2", suffix: "BG2" },
  { key: "primary", suffix: "PRIMARY" },
  { key: "primarySoft", suffix: "PRIMARY_SOFT" },
  { key: "textDim", suffix: "TEXT_DIM" },
  { key: "scan", suffix: "SCAN" }
];

function visualConfigFromEnv(env: EnvSource): VisualConfig {
  return {
    showGrid: booleanEnv(env, "CRT_SHOW_GRID", true),
    showStatsFooter: booleanEnv(env, "CRT_SHOW_STATS_FOOTER", true),
    showStats: booleanEnv(env, "CRT_SHOW_STATS", true),
    enableHoverAttrs: booleanEnv(env, "CRT_ENABLE_HOVER_ATTRS", false)
  };
}

function uniquePreservingOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

function parseThemeTokens(raw: string): string[] {
  const normalized = raw.trim().toLowerCase();

  if (!normalized) {
    return [DEFAULT_THEMES];
  }

  const tokens = normalized
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return tokens.length > 0 ? uniquePreservingOrder(tokens) : [DEFAULT_THEMES];
}

function readPaletteOverrides(env: EnvSource, prefix: string): Partial<ThemePalette> {
  const overrides: Partial<ThemePalette> = {};

  for (const { key, suffix } of PALETTE_ENV_SUFFIXES) {
    const raw = optionalStringEnv(env, `${prefix}_${suffix}`);
    const value = raw?.trim();

    if (value) {
      overrides[key] = value;
    }
  }

  return overrides;
}

function hasPaletteOverrides(overrides: Partial<ThemePalette>): boolean {
  return PALETTE_ENV_SUFFIXES.some(({ key }) => overrides[key] !== undefined);
}

function mergePalette(base: ThemePalette, overrides: Partial<ThemePalette>): ThemePalette {
  return {
    ...base,
    ...overrides
  };
}

function resolveCustomThemeConfig(env: EnvSource): ResolvedThemeConfig {
  const customBase = stringEnv(env, "CRT_CUSTOM_BASE_THEME", "crt").trim().toLowerCase();
  const presetNames = new Set<PresetThemeName>(presetThemeNames());

  if (!presetNames.has(customBase as PresetThemeName)) {
    throw new Error(
      `Invalid CRT_CUSTOM_BASE_THEME "${customBase}". Valid preset themes: ${presetThemeNames().join(", ")}`
    );
  }

  const baseThemeId = customBase as PresetThemeName;
  const baseDark = getThemeConfigById(baseThemeId);

  if (!baseDark) {
    throw new Error(`Unknown custom base theme "${baseThemeId}"`);
  }

  const baseSupportsLight = supportedModesForTheme(baseThemeId).includes("light");
  const baseLight = baseSupportsLight ? themeConfigForMode(baseDark, "light") : undefined;

  const darkPaletteOverrides = readPaletteOverrides(env, "CRT_CUSTOM");
  const lightPaletteOverrides = readPaletteOverrides(env, "CRT_CUSTOM_LIGHT");

  const darkPalette = mergePalette(baseDark.palette, darkPaletteOverrides);
  const customSpectrumChart = booleanEnv(env, "CRT_CUSTOM_SPECTRUM_CHART", baseDark.spectrumChart === true);

  const dark: ThemeableConfig = {
    ...baseDark,
    id: "custom",
    spectrumChart: customSpectrumChart,
    palette: darkPalette
  };

  const hasLightOverrides = hasPaletteOverrides(lightPaletteOverrides);
  const enableCustomLight = booleanEnv(env, "CRT_CUSTOM_ENABLE_LIGHT", hasLightOverrides);

  if (!enableCustomLight) {
    return {
      id: "custom",
      dark
    };
  }

  const lightBaseConfig = baseLight ?? baseDark;
  const lightBasePalette = mergePalette(lightBaseConfig.palette, darkPaletteOverrides);
  const lightPalette = mergePalette(lightBasePalette, lightPaletteOverrides);

  const light: ThemeableConfig = {
    ...lightBaseConfig,
    id: "custom",
    spectrumChart: customSpectrumChart,
    palette: lightPalette
  };

  return {
    id: "custom",
    dark,
    light
  };
}

function resolveThemesFromEnv(env: EnvSource): ResolvedThemeConfig[] {
  const presets = presetThemeNames();
  const presetSet = new Set<PresetThemeName>(presets);
  const validThemeTokens = [...presets, THEME_TOKEN_CUSTOM, THEME_TOKEN_ALL];

  const tokens = parseThemeTokens(stringEnv(env, "CRT_THEMES", DEFAULT_THEMES));
  const includeCustom = tokens.includes(THEME_TOKEN_CUSTOM);
  const includeAllPresets = tokens.includes(THEME_TOKEN_ALL);

  for (const token of tokens) {
    if (token === THEME_TOKEN_ALL || token === THEME_TOKEN_CUSTOM) {
      continue;
    }

    if (!presetSet.has(token as PresetThemeName)) {
      throw new Error(
        `Invalid CRT_THEMES value "${token}". Valid values: ${validThemeTokens.join(", ")}`
      );
    }
  }

  const selectedPresetIds: PresetThemeName[] = [];

  if (includeAllPresets) {
    selectedPresetIds.push(...presets);
  } else {
    for (const token of tokens) {
      if (token === THEME_TOKEN_CUSTOM) {
        continue;
      }

      selectedPresetIds.push(token as PresetThemeName);
    }
  }

  const selectedThemes: ResolvedThemeConfig[] = selectedPresetIds.map((themeId) => {
    const dark = getThemeConfigById(themeId);

    if (!dark) {
      throw new Error(`Unknown preset theme "${themeId}"`);
    }

    const supportsLight = supportedModesForTheme(themeId).includes("light");
    const light = supportsLight ? themeConfigForMode(dark, "light") : undefined;

    return light
      ? {
          id: themeId,
          dark,
          light
        }
      : {
      id: themeId,
      dark
    };
  });

  if (includeCustom) {
    selectedThemes.push(resolveCustomThemeConfig(env));
  }

  if (selectedThemes.length === 0) {
    throw new Error(
      `CRT_THEMES did not resolve any themes. Valid values: ${validThemeTokens.join(", ")}`
    );
  }

  return selectedThemes;
}

export function loadRuntimeConfig(env: EnvSource = process.env): RuntimeConfig {
  const username = optionalStringEnv(env, "GITHUB_USER");
  const token = optionalStringEnv(env, "GITHUB_TOKEN");

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  if (!(username && username.trim())) {
    throw new Error("GITHUB_USER cannot be empty if provided");
  }

  const outputTarget = stringEnv(env, "CRT_OUTPUT_DIR", DEFAULT_OUTPUT_DIRECTORY);

  return {
    username,
    token,
    outputDirectory: path.resolve(outputTarget),
    minifySvg: booleanEnv(env, "CRT_MINIFY_SVG", true),
    visual: visualConfigFromEnv(env),
    themes: resolveThemesFromEnv(env)
  };
}
