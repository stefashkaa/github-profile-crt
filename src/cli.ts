import "dotenv/config";
import process from "node:process";
import { loadRuntimeConfig } from "./config/env";
import { generateCrtContributionSvg } from "./generator";

async function main(): Promise<void> {
  const config = loadRuntimeConfig();
  const result = await generateCrtContributionSvg(config);
  const savedBytes = result.sizeBeforeOptimization - result.finalSize;
  const savedPercent =
    result.sizeBeforeOptimization > 0
      ? ((savedBytes / result.sizeBeforeOptimization) * 100).toFixed(1)
      : "0.0";

  console.log(
    `Generated ${result.outputPath} (${result.weeks} weeks, ${result.totalContributions} contributions total, ${result.finalSize} bytes${result.optimized ? `, saved ${savedBytes} bytes (${savedPercent}%)` : ""})`
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
