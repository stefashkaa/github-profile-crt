import "dotenv/config";
import process from "node:process";
import { loadRuntimeConfig } from "./config/env";
import { generateCrtContributionSvg } from "./generator";

async function main(): Promise<void> {
  const config = loadRuntimeConfig();
  const result = await generateCrtContributionSvg(config);

  console.log(
    `Generated ${result.outputPath} (${result.weeks} weeks, ${result.totalContributions} contributions total)`
  );
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
