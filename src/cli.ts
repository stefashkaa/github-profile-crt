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

  console.log(
    `Generated ${result.files.length} themed SVGs (${result.weeks} weeks, ${result.totalContributions} contributions total${optimizationSummary})`
  );

  for (const [index, file] of result.files.entries()) {
    console.log(` - SVG ${index + 1}: ${file.mode} mode (${file.finalSize} bytes)`);
  }
}

try {
  await main();
} catch {
  console.error('Generation failed. Check the configuration and try again.');

  process.exit(1);
}
