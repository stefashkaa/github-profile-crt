import fs from "node:fs/promises";
import path from "node:path";
import type { RuntimeConfig } from "./config/env";
import { createGitHubGraphQlClient } from "./github/graphqlClient";
import { fetchContributionCalendar } from "./github/fetchContributionCalendar";
import { optimizeGeneratedSvg } from "./render/optimizeSvg";
import { renderCrtContributionSvg } from "./render/svgRenderer";

export interface GenerationResult {
  outputPath: string;
  totalContributions: number;
  weeks: number;
  sizeBeforeOptimization: number;
  finalSize: number;
  optimized: boolean;
}

export async function generateCrtContributionSvg(config: RuntimeConfig): Promise<GenerationResult> {
  const outputDirectory = path.dirname(config.outputPath);
  await fs.mkdir(outputDirectory, { recursive: true });

  const client = createGitHubGraphQlClient(config.token);
  const calendar = await fetchContributionCalendar(client, config.username);

  const rawSvg = renderCrtContributionSvg({
    username: config.username,
    theme: config.theme,
    calendar,
    visual: config.visual
  });

  const optimizedSvg = config.minifySvg
    ? optimizeGeneratedSvg(rawSvg, { multipass: true })
    : rawSvg;

  await fs.writeFile(config.outputPath, optimizedSvg, "utf8");

  return {
    outputPath: config.outputPath,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.length,
    sizeBeforeOptimization: Buffer.byteLength(rawSvg, "utf8"),
    finalSize: Buffer.byteLength(optimizedSvg, "utf8"),
    optimized: config.minifySvg
  };
}
