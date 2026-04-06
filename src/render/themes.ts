export type ThemeName = "crt" | "amber" | "ice" | "ruby" | "mint" | "mono" | "chaos" | "chaos-max" | "static";

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
  verticalTickOpacity: number;
  lineGlowOpacity: number;
  lineWidth: number;
  phosphorBlur: number;
}

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
    gridOpacity: 0.07,
    verticalTickOpacity: 0.035,
    lineGlowOpacity: 0.2,
    lineWidth: 1.35,
    phosphorBlur: 2
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
    gridOpacity: 0.06,
    verticalTickOpacity: 0.03,
    lineGlowOpacity: 0.19,
    lineWidth: 1.3,
    phosphorBlur: 1.9
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
    gridOpacity: 0.05,
    verticalTickOpacity: 0.024,
    lineGlowOpacity: 0.16,
    lineWidth: 1.25,
    phosphorBlur: 1.85
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
    gridOpacity: 0.046,
    verticalTickOpacity: 0.022,
    lineGlowOpacity: 0.16,
    lineWidth: 1.22,
    phosphorBlur: 1.75
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
    gridOpacity: 0.05,
    verticalTickOpacity: 0.024,
    lineGlowOpacity: 0.17,
    lineWidth: 1.24,
    phosphorBlur: 1.85
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
    gridOpacity: 0.038,
    verticalTickOpacity: 0.018,
    lineGlowOpacity: 0.12,
    lineWidth: 1.15,
    phosphorBlur: 1.6
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
    gridOpacity: 0.09,
    verticalTickOpacity: 0.045,
    lineGlowOpacity: 0.28,
    lineWidth: 1.5,
    phosphorBlur: 2.8
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
    gridOpacity: 0.1,
    verticalTickOpacity: 0.055,
    lineGlowOpacity: 0.34,
    lineWidth: 1.58,
    phosphorBlur: 3.2
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
    scanOpacity: 0.04,
    scanSpacing: 7,
    scanLineOpacity: 0.08,
    scanLineDuration: 9,
    animateScanlines: false,
    noiseOpacity: 0.009,
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
    gridOpacity: 0.034,
    verticalTickOpacity: 0.016,
    lineGlowOpacity: 0.11,
    lineWidth: 1.1,
    phosphorBlur: 1.5
  }
];

export function getThemeableConfigs(): ThemeableConfig[] {
  return THEMEABLE_CONFIGS;
}

export function defaultThemeId(): ThemeName {
  return "crt";
}

export function outputFileNameForTheme(themeId: ThemeName): string {
  return `crt-contributions-${themeId}.svg`;
}
