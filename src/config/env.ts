import path from "node:path";
import process from "node:process";
import {
  booleanEnv,
  integerEnv,
  numberEnv,
  optionalStringEnv,
  stringEnv,
  type EnvSource
} from "../utils/env";

export type ThemeName = "crt" | "amber";

export interface VisualConfig {
  showGrid: boolean;
  showStats: boolean;
  scanOpacity: number;
  scanSpacing: number;
  scanLineOpacity: number;
  scanLineDuration: number;
  animateScanlines: boolean;
  noiseOpacity: number;
  noiseFrequency: number;
  noiseSeed: number;
  animateNoise: boolean;
  noiseDuration: number;
  sweepOpacity: number;
  sweepWidth: number;
  sweepDuration: number;
  barMinOpacity: number;
  barMaxOpacity: number;
  barRadius: number;
  vignetteOpacity: number;
  areaOpacity: number;
  gridOpacity: number;
  verticalTickOpacity: number;
  lineGlowOpacity: number;
  lineWidth: number;
  phosphorBlur: number;
}

export interface RuntimeConfig {
  username: string;
  token: string;
  theme: ThemeName;
  outputPath: string;
  minifySvg: boolean;
  visual: VisualConfig;
}

const DEFAULT_OUTPUT_PATH = path.join("assets", "crt-contributions.svg");

function visualConfigFromEnv(env: EnvSource): VisualConfig {
  return {
    showGrid: booleanEnv(env, ["CRT_SHOW_GRID", "SHIPPING_RADAR_SHOW_GRID"], false),
    showStats: booleanEnv(env, ["CRT_SHOW_STATS", "SHIPPING_RADAR_SHOW_STATS"], true),

    scanOpacity: numberEnv(env, ["CRT_SCAN_OPACITY", "SHIPPING_RADAR_SCAN_OPACITY"], 0.085),
    scanSpacing: integerEnv(env, ["CRT_SCAN_SPACING", "SHIPPING_RADAR_SCAN_SPACING"], 6),
    scanLineOpacity: numberEnv(env, ["CRT_SCANLINE_OPACITY", "SHIPPING_RADAR_SCANLINE_OPACITY"], 0.16),
    scanLineDuration: numberEnv(env, ["CRT_SCANLINE_DURATION", "SHIPPING_RADAR_SCANLINE_DURATION"], 7),
    animateScanlines: booleanEnv(env, ["CRT_ANIMATE_SCANLINES", "SHIPPING_RADAR_ANIMATE_SCANLINES"], true),

    noiseOpacity: numberEnv(env, ["CRT_NOISE_OPACITY", "SHIPPING_RADAR_NOISE_OPACITY"], 0.02),
    noiseFrequency: numberEnv(env, ["CRT_NOISE_FREQUENCY", "SHIPPING_RADAR_NOISE_FREQUENCY"], 0.85),
    noiseSeed: integerEnv(env, ["CRT_NOISE_SEED", "SHIPPING_RADAR_NOISE_SEED"], 7),
    animateNoise: booleanEnv(env, ["CRT_ANIMATE_NOISE", "SHIPPING_RADAR_ANIMATE_NOISE"], true),
    noiseDuration: numberEnv(env, ["CRT_NOISE_DURATION", "SHIPPING_RADAR_NOISE_DURATION"], 5.5),

    sweepOpacity: numberEnv(env, ["CRT_SWEEP_OPACITY", "SHIPPING_RADAR_SWEEP_OPACITY"], 0.15),
    sweepWidth: numberEnv(env, ["CRT_SWEEP_WIDTH", "SHIPPING_RADAR_SWEEP_WIDTH"], 1.75),
    sweepDuration: numberEnv(env, ["CRT_SWEEP_DURATION", "SHIPPING_RADAR_SWEEP_DURATION"], 7),

    barMinOpacity: numberEnv(env, ["CRT_BAR_MIN_OPACITY", "SHIPPING_RADAR_BAR_MIN_OPACITY"], 0.3),
    barMaxOpacity: numberEnv(env, ["CRT_BAR_MAX_OPACITY", "SHIPPING_RADAR_BAR_MAX_OPACITY"], 0.88),
    barRadius: numberEnv(env, ["CRT_BAR_RADIUS", "SHIPPING_RADAR_BAR_RADIUS"], 0),

    vignetteOpacity: numberEnv(env, ["CRT_VIGNETTE_OPACITY", "SHIPPING_RADAR_VIGNETTE_OPACITY"], 0.12),
    areaOpacity: numberEnv(env, ["CRT_AREA_OPACITY", "SHIPPING_RADAR_AREA_OPACITY"], 0.12),

    gridOpacity: numberEnv(env, ["CRT_GRID_OPACITY", "SHIPPING_RADAR_GRID_OPACITY"], 0.07),
    verticalTickOpacity: numberEnv(env, ["CRT_VTICK_OPACITY", "SHIPPING_RADAR_VTICK_OPACITY"], 0.035),

    lineGlowOpacity: numberEnv(env, ["CRT_LINE_GLOW_OPACITY", "SHIPPING_RADAR_LINE_GLOW_OPACITY"], 0.2),
    lineWidth: numberEnv(env, ["CRT_LINE_WIDTH", "SHIPPING_RADAR_LINE_WIDTH"], 1.35),
    phosphorBlur: numberEnv(env, ["CRT_PHOSPHOR_BLUR", "SHIPPING_RADAR_PHOSPHOR_BLUR"], 2)
  };
}

function parseTheme(value: string): ThemeName {
  return value.toLowerCase() === "amber" ? "amber" : "crt";
}

export function loadRuntimeConfig(env: EnvSource = process.env): RuntimeConfig {
  const username = stringEnv(env, ["GITHUB_USER", "USERNAME"], "stefashkaa");
  const token = optionalStringEnv(env, ["GH_TOKEN", "GITHUB_TOKEN"]);

  if (!token) {
    throw new Error("Missing GH_TOKEN or GITHUB_TOKEN");
  }

  const theme = parseTheme(stringEnv(env, ["CRT_THEME", "SHIPPING_RADAR_THEME"], "crt"));
  const outputPath = path.resolve(stringEnv(env, ["CRT_OUTPUT_PATH", "SHIPPING_RADAR_OUTPUT_PATH"], DEFAULT_OUTPUT_PATH));

  return {
    username,
    token,
    theme,
    outputPath,
    minifySvg: booleanEnv(env, ["CRT_MINIFY_SVG"], true),
    visual: visualConfigFromEnv(env)
  };
}
