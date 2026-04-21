import 'dotenv/config';
import process from 'node:process';
import { loadRuntimeConfig } from './config/env';
import { generateCrtContributionSvgs } from './generator';

function totalSavedBytes(sizeBefore: number, sizeAfter: number): number {
  return sizeBefore - sizeAfter;
}

async function main(): Promise<void> {
  const config = loadRuntimeConfig();
  const result = await generateCrtContributionSvgs(config);

  const rawTotalBytes = result.files.reduce((sum, file) => sum + file.sizeBeforeOptimization, 0);
  const finalTotalBytes = result.files.reduce((sum, file) => sum + file.finalSize, 0);
  const savedBytes = totalSavedBytes(rawTotalBytes, finalTotalBytes);
  const savedPercent = rawTotalBytes > 0 ? ((savedBytes / rawTotalBytes) * 100).toFixed(1) : '0.0';
  const optimizationSummary = result.optimized ? `, saved ${savedBytes} bytes (${savedPercent}%)` : '';

  process.stdout.write(
    `Generated ${result.files.length} themed SVGs in ${result.outputDirectory} (${result.weeks} weeks, ${result.totalContributions} contributions total${optimizationSummary})\n`
  );

  for (const file of result.files) {
    process.stdout.write(` - ${file.themeId} (${file.mode}): ${file.outputPath} (${file.finalSize} bytes)\n`);
  }
}

try {
  await main();
} catch (error: unknown) {
  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write(`${String(error)}\n`);
  }

  process.exit(1);
}
