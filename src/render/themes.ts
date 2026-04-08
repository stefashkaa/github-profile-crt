export type ThemeName = "crt" | "amber" | "ice" | "ruby" | "mint" | "mono" | "neon" | "rainbow" | "chaos" | "chaos-max" | "static" | "custom";
export type PresetThemeName = Exclude<ThemeName, "custom">;
export type ThemeMode = "dark" | "light";

export interface ThemePalette {
  bg0: string;
  bg1: string;
  bg2: string;
  primary: string;
  primarySoft: string;
  textDim: string;
  scan: string;
}

export interface ThemeableConfig {
  id: ThemeName;
  spectrumChart?: boolean;
  palette: ThemePalette;
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
  lineGlowOpacity: number;
  lineWidth: number;
  phosphorBlur: number;
  equalizerDurationScale: number;
  equalizerTravelScale: number;
  animateEqualizer: boolean;
  animateDashboard: boolean;
}

type ThemeVariantOverride = Partial<Omit<ThemeableConfig, "id" | "palette">> & {
  palette?: Partial<ThemePalette>;
};

const THEMEABLE_CONFIGS: ThemeableConfig[] = [
  {
    id: "crt",
    palette: {
      bg0: "#030603",
      bg1: "#071107",
      bg2: "#0a160a",
      primary: "#20ff24",
      primarySoft: "#9cff9f",
      textDim: "#77b67a",
      scan: "rgb(32,255,36)"
    },
    scanOpacity: 0.085,
    scanSpacing: 6,
    scanLineOpacity: 0.16,
    scanLineDuration: 7,
    animateScanlines: true,
    noiseOpacity: 0.02,
    noiseFrequency: 0.85,
    noiseSeed: 7,
    animateNoise: true,
    noiseDuration: 5.5,
    sweepOpacity: 0.15,
    sweepWidth: 1.75,
    sweepDuration: 7,
    barMinOpacity: 0.3,
    barMaxOpacity: 0.88,
    barRadius: 0,
    vignetteOpacity: 0.12,
    areaOpacity: 0.12,
    gridOpacity: 0.195,
    lineGlowOpacity: 0.2,
    lineWidth: 1.35,
    phosphorBlur: 2,
    equalizerDurationScale: 1,
    equalizerTravelScale: 1,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "amber",
    palette: {
      bg0: "#0f0b05",
      bg1: "#161006",
      bg2: "#1c1307",
      primary: "#ffb347",
      primarySoft: "#ffcc80",
      textDim: "#c29b62",
      scan: "rgb(255,179,71)"
    },
    scanOpacity: 0.07,
    scanSpacing: 6,
    scanLineOpacity: 0.15,
    scanLineDuration: 7.2,
    animateScanlines: true,
    noiseOpacity: 0.018,
    noiseFrequency: 0.8,
    noiseSeed: 11,
    animateNoise: true,
    noiseDuration: 6.2,
    sweepOpacity: 0.14,
    sweepWidth: 1.7,
    sweepDuration: 7.6,
    barMinOpacity: 0.33,
    barMaxOpacity: 0.9,
    barRadius: 0,
    vignetteOpacity: 0.1,
    areaOpacity: 0.1,
    gridOpacity: 0.19,
    lineGlowOpacity: 0.19,
    lineWidth: 1.3,
    phosphorBlur: 1.9,
    equalizerDurationScale: 1.02,
    equalizerTravelScale: 0.95,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "ice",
    palette: {
      bg0: "#020712",
      bg1: "#05101f",
      bg2: "#071628",
      primary: "#4ad6ff",
      primarySoft: "#b7f1ff",
      textDim: "#7db3c4",
      scan: "rgb(74,214,255)"
    },
    scanOpacity: 0.065,
    scanSpacing: 7,
    scanLineOpacity: 0.13,
    scanLineDuration: 8.2,
    animateScanlines: true,
    noiseOpacity: 0.016,
    noiseFrequency: 0.74,
    noiseSeed: 17,
    animateNoise: true,
    noiseDuration: 6.8,
    sweepOpacity: 0.12,
    sweepWidth: 1.55,
    sweepDuration: 8,
    barMinOpacity: 0.28,
    barMaxOpacity: 0.84,
    barRadius: 0,
    vignetteOpacity: 0.09,
    areaOpacity: 0.1,
    gridOpacity: 0.184,
    lineGlowOpacity: 0.16,
    lineWidth: 1.25,
    phosphorBlur: 1.85,
    equalizerDurationScale: 1.08,
    equalizerTravelScale: 1.05,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "ruby",
    palette: {
      bg0: "#100304",
      bg1: "#180607",
      bg2: "#22090b",
      primary: "#ff4a4a",
      primarySoft: "#ffc1b0",
      textDim: "#d78f86",
      scan: "rgb(255,74,74)"
    },
    scanOpacity: 0.058,
    scanSpacing: 6,
    scanLineOpacity: 0.12,
    scanLineDuration: 8.4,
    animateScanlines: true,
    noiseOpacity: 0.014,
    noiseFrequency: 0.7,
    noiseSeed: 23,
    animateNoise: true,
    noiseDuration: 7.4,
    sweepOpacity: 0.11,
    sweepWidth: 1.45,
    sweepDuration: 8.2,
    barMinOpacity: 0.28,
    barMaxOpacity: 0.83,
    barRadius: 0,
    vignetteOpacity: 0.11,
    areaOpacity: 0.09,
    gridOpacity: 0.182,
    lineGlowOpacity: 0.16,
    lineWidth: 1.22,
    phosphorBlur: 1.75,
    equalizerDurationScale: 1.03,
    equalizerTravelScale: 1.02,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "mint",
    palette: {
      bg0: "#03110d",
      bg1: "#052018",
      bg2: "#073126",
      primary: "#4dffb2",
      primarySoft: "#beffe2",
      textDim: "#84c7aa",
      scan: "rgb(77,255,178)"
    },
    scanOpacity: 0.07,
    scanSpacing: 7,
    scanLineOpacity: 0.12,
    scanLineDuration: 7.8,
    animateScanlines: true,
    noiseOpacity: 0.016,
    noiseFrequency: 0.78,
    noiseSeed: 29,
    animateNoise: true,
    noiseDuration: 6.1,
    sweepOpacity: 0.12,
    sweepWidth: 1.52,
    sweepDuration: 7.4,
    barMinOpacity: 0.26,
    barMaxOpacity: 0.82,
    barRadius: 0,
    vignetteOpacity: 0.085,
    areaOpacity: 0.095,
    gridOpacity: 0.184,
    lineGlowOpacity: 0.17,
    lineWidth: 1.24,
    phosphorBlur: 1.85,
    equalizerDurationScale: 0.95,
    equalizerTravelScale: 1.06,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "mono",
    palette: {
      bg0: "#080808",
      bg1: "#0f0f0f",
      bg2: "#151515",
      primary: "#d8d8d8",
      primarySoft: "#ffffff",
      textDim: "#9c9c9c",
      scan: "rgb(216,216,216)"
    },
    scanOpacity: 0.05,
    scanSpacing: 8,
    scanLineOpacity: 0.09,
    scanLineDuration: 9,
    animateScanlines: true,
    noiseOpacity: 0.012,
    noiseFrequency: 0.64,
    noiseSeed: 37,
    animateNoise: true,
    noiseDuration: 8,
    sweepOpacity: 0.09,
    sweepWidth: 1.3,
    sweepDuration: 8.8,
    barMinOpacity: 0.24,
    barMaxOpacity: 0.76,
    barRadius: 0,
    vignetteOpacity: 0.08,
    areaOpacity: 0.08,
    gridOpacity: 0.178,
    lineGlowOpacity: 0.12,
    lineWidth: 1.15,
    phosphorBlur: 1.6,
    equalizerDurationScale: 1.1,
    equalizerTravelScale: 0.9,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "neon",
    palette: {
      bg0: "#08030f",
      bg1: "#12071f",
      bg2: "#1b0a2e",
      primary: "#ff4fd8",
      primarySoft: "#6be8ff",
      textDim: "#b8a3ff",
      scan: "rgb(255,79,216)"
    },
    scanOpacity: 0.08,
    scanSpacing: 5,
    scanLineOpacity: 0.18,
    scanLineDuration: 4.8,
    animateScanlines: true,
    noiseOpacity: 0.026,
    noiseFrequency: 0.95,
    noiseSeed: 73,
    animateNoise: true,
    noiseDuration: 3.2,
    sweepOpacity: 0.2,
    sweepWidth: 2.1,
    sweepDuration: 4.8,
    barMinOpacity: 0.32,
    barMaxOpacity: 0.94,
    barRadius: 0,
    vignetteOpacity: 0.13,
    areaOpacity: 0.14,
    gridOpacity: 0.198,
    lineGlowOpacity: 0.24,
    lineWidth: 1.45,
    phosphorBlur: 2.4,
    equalizerDurationScale: 0.72,
    equalizerTravelScale: 1.28,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "rainbow",
    spectrumChart: true,
    palette: {
      bg0: "#08030f",
      bg1: "#12071f",
      bg2: "#1b0a2e",
      primary: "#ff4fd8",
      primarySoft: "#6be8ff",
      textDim: "#b8a3ff",
      scan: "rgb(255,79,216)"
    },
    scanOpacity: 0.08,
    scanSpacing: 5,
    scanLineOpacity: 0.18,
    scanLineDuration: 4.8,
    animateScanlines: true,
    noiseOpacity: 0.026,
    noiseFrequency: 0.95,
    noiseSeed: 73,
    animateNoise: true,
    noiseDuration: 3.2,
    sweepOpacity: 0.2,
    sweepWidth: 2.1,
    sweepDuration: 4.8,
    barMinOpacity: 0.32,
    barMaxOpacity: 0.94,
    barRadius: 0,
    vignetteOpacity: 0.13,
    areaOpacity: 0.14,
    gridOpacity: 0.198,
    lineGlowOpacity: 0.24,
    lineWidth: 1.45,
    phosphorBlur: 2.4,
    equalizerDurationScale: 0.74,
    equalizerTravelScale: 1.34,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "chaos",
    palette: {
      bg0: "#020304",
      bg1: "#061019",
      bg2: "#0a1a2a",
      primary: "#6cff3d",
      primarySoft: "#f5ff9a",
      textDim: "#a3d198",
      scan: "rgb(108,255,61)"
    },
    scanOpacity: 0.11,
    scanSpacing: 5,
    scanLineOpacity: 0.22,
    scanLineDuration: 3.4,
    animateScanlines: true,
    noiseOpacity: 0.085,
    noiseFrequency: 1.65,
    noiseSeed: 97,
    animateNoise: true,
    noiseDuration: 1.6,
    sweepOpacity: 0.22,
    sweepWidth: 2.2,
    sweepDuration: 4.2,
    barMinOpacity: 0.35,
    barMaxOpacity: 0.95,
    barRadius: 0,
    vignetteOpacity: 0.14,
    areaOpacity: 0.16,
    gridOpacity: 0.205,
    lineGlowOpacity: 0.28,
    lineWidth: 1.5,
    phosphorBlur: 2.8,
    equalizerDurationScale: 0.58,
    equalizerTravelScale: 1.55,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "chaos-max",
    palette: {
      bg0: "#010203",
      bg1: "#081322",
      bg2: "#0c1f35",
      primary: "#8fff00",
      primarySoft: "#f7ff73",
      textDim: "#b8db89",
      scan: "rgb(143,255,0)"
    },
    scanOpacity: 0.16,
    scanSpacing: 3,
    scanLineOpacity: 0.3,
    scanLineDuration: 1.8,
    animateScanlines: true,
    noiseOpacity: 0.15,
    noiseFrequency: 2.4,
    noiseSeed: 131,
    animateNoise: true,
    noiseDuration: 0.85,
    sweepOpacity: 0.28,
    sweepWidth: 2.6,
    sweepDuration: 2.8,
    barMinOpacity: 0.38,
    barMaxOpacity: 0.98,
    barRadius: 0,
    vignetteOpacity: 0.16,
    areaOpacity: 0.18,
    gridOpacity: 0.215,
    lineGlowOpacity: 0.34,
    lineWidth: 1.58,
    phosphorBlur: 3.2,
    equalizerDurationScale: 0.44,
    equalizerTravelScale: 1.9,
    animateEqualizer: true,
    animateDashboard: true
  },
  {
    id: "static",
    palette: {
      bg0: "#07090c",
      bg1: "#0d1418",
      bg2: "#141d21",
      primary: "#a6f6ff",
      primarySoft: "#d9fcff",
      textDim: "#9eb6bb",
      scan: "rgb(166,246,255)"
    },
    scanOpacity: 0,
    scanSpacing: 7,
    scanLineOpacity: 0,
    scanLineDuration: 9,
    animateScanlines: false,
    noiseOpacity: 0,
    noiseFrequency: 0.52,
    noiseSeed: 41,
    animateNoise: false,
    noiseDuration: 8,
    sweepOpacity: 0.08,
    sweepWidth: 1.22,
    sweepDuration: 9.5,
    barMinOpacity: 0.24,
    barMaxOpacity: 0.74,
    barRadius: 0,
    vignetteOpacity: 0.07,
    areaOpacity: 0.075,
    gridOpacity: 0.176,
    lineGlowOpacity: 0.11,
    lineWidth: 1.1,
    phosphorBlur: 1.5,
    equalizerDurationScale: 1,
    equalizerTravelScale: 0,
    animateEqualizer: false,
    animateDashboard: false
  }
];

const LIGHT_THEME_OVERRIDES: Partial<Record<ThemeName, ThemeVariantOverride>> = {
  crt: {
    palette: {
      bg0: "#edf7ed",
      bg1: "#ddf0dd",
      bg2: "#d2e9d2",
      primary: "#1d7f2a",
      primarySoft: "#2da83d",
      textDim: "#2f6e3b",
      scan: "rgb(45,168,61)"
    },
    scanOpacity: 0.028,
    scanLineOpacity: 0.05,
    noiseOpacity: 0.006,
    sweepOpacity: 0.09,
    vignetteOpacity: 0.03,
    areaOpacity: 0.055,
    gridOpacity: 0.19,
    lineGlowOpacity: 0.1
  },
  amber: {
    palette: {
      bg0: "#fff5e7",
      bg1: "#fcecd5",
      bg2: "#f5dfbf",
      primary: "#a45c00",
      primarySoft: "#d88418",
      textDim: "#8a622f",
      scan: "rgb(216,132,24)"
    },
    scanOpacity: 0.024,
    scanLineOpacity: 0.045,
    noiseOpacity: 0.005,
    sweepOpacity: 0.085,
    vignetteOpacity: 0.025,
    areaOpacity: 0.05,
    gridOpacity: 0.186,
    lineGlowOpacity: 0.095
  },
  ice: {
    palette: {
      bg0: "#edf6ff",
      bg1: "#deefff",
      bg2: "#d2e7fb",
      primary: "#0f6ea2",
      primarySoft: "#1f91cf",
      textDim: "#336a88",
      scan: "rgb(31,145,207)"
    },
    scanOpacity: 0.024,
    scanLineOpacity: 0.042,
    noiseOpacity: 0.0045,
    sweepOpacity: 0.082,
    vignetteOpacity: 0.022,
    areaOpacity: 0.048,
    gridOpacity: 0.184,
    lineGlowOpacity: 0.09
  },
  neon: {
    palette: {
      bg0: "#f7efff",
      bg1: "#eedffd",
      bg2: "#e3d0f8",
      primary: "#b334a0",
      primarySoft: "#1a88bc",
      textDim: "#6e5593",
      scan: "rgb(179,52,160)"
    },
    scanOpacity: 0.022,
    scanLineOpacity: 0.041,
    noiseOpacity: 0.0048,
    sweepOpacity: 0.078,
    vignetteOpacity: 0.02,
    areaOpacity: 0.046,
    gridOpacity: 0.182,
    lineGlowOpacity: 0.088
  },
  rainbow: {
    palette: {
      bg0: "#f7efff",
      bg1: "#eedffd",
      bg2: "#e3d0f8",
      primary: "#b334a0",
      primarySoft: "#1a88bc",
      textDim: "#6e5593",
      scan: "rgb(179,52,160)"
    },
    scanOpacity: 0.022,
    scanLineOpacity: 0.041,
    noiseOpacity: 0.0048,
    sweepOpacity: 0.078,
    vignetteOpacity: 0.02,
    areaOpacity: 0.046,
    gridOpacity: 0.182,
    lineGlowOpacity: 0.088
  },
  static: {
    palette: {
      bg0: "#f4f7f9",
      bg1: "#e9f0f4",
      bg2: "#dde8ee",
      primary: "#2f6f84",
      primarySoft: "#3f8faa",
      textDim: "#4c6874",
      scan: "rgb(63,143,170)"
    },
    scanOpacity: 0,
    scanLineOpacity: 0,
    noiseOpacity: 0,
    sweepOpacity: 0.06,
    vignetteOpacity: 0.016,
    areaOpacity: 0.038,
    gridOpacity: 0.178,
    lineGlowOpacity: 0.068
  }
};

function applyThemeOverride(base: ThemeableConfig, override?: ThemeVariantOverride): ThemeableConfig {
  if (!override) {
    return base;
  }

  const { palette: paletteOverride, ...restOverride } = override;

  return {
    ...base,
    ...restOverride,
    palette: {
      ...base.palette,
      ...(paletteOverride ?? {})
    }
  };
}

export function getThemeableConfigs(): ThemeableConfig[] {
  return THEMEABLE_CONFIGS;
}

export function presetThemeNames(): PresetThemeName[] {
  return THEMEABLE_CONFIGS.map((theme) => theme.id) as PresetThemeName[];
}

export function getThemeConfigById(themeId: PresetThemeName): ThemeableConfig | undefined {
  return THEMEABLE_CONFIGS.find((theme) => theme.id === themeId);
}

export function supportedModesForTheme(themeId: ThemeName): ThemeMode[] {
  return LIGHT_THEME_OVERRIDES[themeId] ? ["dark", "light"] : ["dark"];
}

export function themeConfigForMode(themeConfig: ThemeableConfig, mode: ThemeMode): ThemeableConfig {
  if (mode === "dark") {
    return themeConfig;
  }

  return applyThemeOverride(themeConfig, LIGHT_THEME_OVERRIDES[themeConfig.id]);
}

export function defaultThemeId(): ThemeName {
  return "crt";
}

export function outputFileNameForTheme(themeId: ThemeName, mode: ThemeMode = "dark"): string {
  return `${themeId}-${mode}.svg`;
}
