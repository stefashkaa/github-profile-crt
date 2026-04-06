import fs from "node:fs/promises";
import path from "node:path";
import type { RuntimeConfig } from "./config/env";
import { createGitHubGraphQlClient } from "./github/graphqlClient";
import { fetchContributionCalendar } from "./github/fetchContributionCalendar";
import { renderCrtContributionSvg } from "./render/svgRenderer";

export interface GenerationResult {
  outputPath: string;
  totalContributions: number;
  weeks: number;
}

export async function generateCrtContributionSvg(config: RuntimeConfig): Promise<GenerationResult> {
  const outputDirectory = path.dirname(config.outputPath);
  await fs.mkdir(outputDirectory, { recursive: true });

  const client = createGitHubGraphQlClient(config.token);
  const calendar = await fetchContributionCalendar(client, config.username);

  const svg = renderCrtContributionSvg({
    username: config.username,
    theme: config.theme,
    calendar,
    visual: config.visual
  });

  await fs.writeFile(config.outputPath, svg, "utf8");

  return {
    outputPath: config.outputPath,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.length
  };
}
