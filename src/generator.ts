import fs from "node:fs/promises";
import path from "node:path";
import type { RuntimeConfig } from "./config/env";
import { createGitHubGraphQlClient } from "./github/graphqlClient";
import { fetchContributionCalendar } from "./github/fetchContributionCalendar";
import { optimizeGeneratedSvg } from "./render/optimizeSvg";
import { renderCrtContributionSvg } from "./render/svgRenderer";
import {
  getThemeableConfigs,
  outputFileNameForTheme,
  supportedModesForTheme,
  themeConfigForMode,
  type ThemeMode,
  type ThemeName
} from "./render/themes";

export interface GeneratedThemeFile {
  themeId: ThemeName;
  mode: ThemeMode;
  outputPath: string;
  sizeBeforeOptimization: number;
  finalSize: number;
}

export interface GenerationResult {
  outputDirectory: string;
  totalContributions: number;
  weeks: number;
  optimized: boolean;
  files: GeneratedThemeFile[];
}

export async function generateCrtContributionSvgs(config: RuntimeConfig): Promise<GenerationResult> {
  await fs.mkdir(config.outputDirectory, { recursive: true });

  const client = createGitHubGraphQlClient(config.token);
  const calendar = await fetchContributionCalendar(client, config.username);
  const themes = getThemeableConfigs();

  const files: GeneratedThemeFile[] = [];

  for (const themeConfig of themes) {
    const modes = supportedModesForTheme(themeConfig.id);

    for (const mode of modes) {
      const modeThemeConfig = themeConfigForMode(themeConfig, mode);
      const rawSvg = renderCrtContributionSvg({
        username: config.username,
        themeConfig: modeThemeConfig,
        calendar,
        visual: config.visual
      });

      const finalSvg = config.minifySvg
        ? optimizeGeneratedSvg(rawSvg, { multipass: true })
        : rawSvg;

      const outputPath = path.join(config.outputDirectory, outputFileNameForTheme(themeConfig.id, mode));
      await fs.writeFile(outputPath, finalSvg, "utf8");

      files.push({
        themeId: themeConfig.id,
        mode,
        outputPath,
        sizeBeforeOptimization: Buffer.byteLength(rawSvg, "utf8"),
        finalSize: Buffer.byteLength(finalSvg, "utf8")
      });
    }
  }

  return {
    outputDirectory: config.outputDirectory,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.length,
    optimized: config.minifySvg,
    files
  };
}
