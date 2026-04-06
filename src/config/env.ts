import path from "node:path";
import process from "node:process";
import {
  booleanEnv,
  optionalStringEnv,
  stringEnv,
  type EnvSource
} from "../utils/env";

export interface VisualConfig {
  showGrid: boolean;
  showStats: boolean;
}

export interface RuntimeConfig {
  username: string;
  token: string;
  outputDirectory: string;
  minifySvg: boolean;
  visual: VisualConfig;
}

const DEFAULT_OUTPUT_DIRECTORY = "assets";

function visualConfigFromEnv(env: EnvSource): VisualConfig {
  return {
    showGrid: booleanEnv(env, "CRT_SHOW_GRID", false),
    showStats: booleanEnv(env, "CRT_SHOW_STATS", true)
  };
}

export function loadRuntimeConfig(env: EnvSource = process.env): RuntimeConfig {
  const username = stringEnv(env, "GITHUB_USER", "stefashkaa");
  const token = optionalStringEnv(env, "GITHUB_TOKEN");

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  const outputTarget = stringEnv(env, "CRT_OUTPUT_DIR", DEFAULT_OUTPUT_DIRECTORY);

  return {
    username,
    token,
    outputDirectory: path.resolve(outputTarget),
    minifySvg: booleanEnv(env, "CRT_MINIFY_SVG", true),
    visual: visualConfigFromEnv(env)
  };
}
