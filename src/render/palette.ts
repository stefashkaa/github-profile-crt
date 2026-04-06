import type { ThemeName } from "../config/env";

export interface Palette {
  bg0: string;
  bg1: string;
  bg2: string;
  primary: string;
  primarySoft: string;
  text: string;
  textDim: string;
  scan: string;
}

export function getPalette(theme: ThemeName): Palette {
  if (theme === "amber") {
    return {
      bg0: "#0f0b05",
      bg1: "#161006",
      bg2: "#1c1307",
      primary: "#ffb347",
      primarySoft: "#ffcc80",
      text: "#ffdca8",
      textDim: "#c29b62",
      scan: "rgb(255,179,71)"
    };
  }

  return {
    bg0: "#030603",
    bg1: "#071107",
    bg2: "#0a160a",
    primary: "#20ff24",
    primarySoft: "#9cff9f",
    text: "#bbffbf",
    textDim: "#77b67a",
    scan: "rgb(32,255,36)"
  };
}
