import fs from "node:fs/promises";
import path from "node:path";
import type { RuntimeConfig } from "./config/env";
import { createGitHubGraphQlClient } from "./github/graphqlClient";
import { fetchContributionCalendar } from "./github/fetchContributionCalendar";
import { fetchProfileInsights } from "./github/fetchProfileInsights";
import { optimizeGeneratedSvg } from "./render/optimizeSvg";
import { renderCrtContributionSvg } from "./render/svgRenderer";
import {
  outputFileNameForTheme,
  type ThemeMode,
  type ThemeName,
  type ThemeableConfig
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
  const calendarPromise = fetchContributionCalendar(client, config.username);
  const insightsPromise = config.visual.showStats
    ? fetchProfileInsights(client, config.username).catch(() => null)
    : Promise.resolve(null);
  const [calendar, insights] = await Promise.all([calendarPromise, insightsPromise]);

  const files: GeneratedThemeFile[] = [];

  for (const resolvedTheme of config.themes) {
    const variants: Array<{ mode: ThemeMode; themeConfig: ThemeableConfig }> = [
      { mode: "dark", themeConfig: resolvedTheme.dark }
    ];

    if (resolvedTheme.light) {
      variants.push({ mode: "light", themeConfig: resolvedTheme.light });
    }

    for (const { mode, themeConfig } of variants) {
      const rawSvg = renderCrtContributionSvg({
        username: config.username,
        themeConfig,
        calendar,
        insights,
        visual: config.visual
      });

      const finalSvg = config.minifySvg
        ? optimizeGeneratedSvg(rawSvg, { multipass: true })
        : rawSvg;

      const outputPath = path.join(config.outputDirectory, outputFileNameForTheme(resolvedTheme.id, mode));
      await fs.writeFile(outputPath, finalSvg, "utf8");

      files.push({
        themeId: resolvedTheme.id,
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
