import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const projectRoot = process.cwd();
const require = createRequire(import.meta.url);

const actionOutputDir = path.join(projectRoot, 'dist', 'action');
const actionIndexPath = path.join(actionOutputDir, 'index.js');
const actionPackagePath = path.join(actionOutputDir, 'package.json');
const actionDataDir = path.join(actionOutputDir, 'data');
const rootPackagePath = path.join(projectRoot, 'package.json');
const nccCliPath = require.resolve('@vercel/ncc/dist/ncc/cli.js');

function hardenedExecEnv(): NodeJS.ProcessEnv {
  if (process.platform === 'win32') {
    return {
      ...process.env,
      PATH: 'C:\\Windows\\System32;C:\\Windows'
    };
  }

  return {
    ...process.env,
    PATH: '/usr/bin:/bin:/usr/local/bin'
  };
}

function runNccBuild() {
  execFileSync(process.execPath, [nccCliPath, 'build', 'src/action.ts', '-o', 'dist/action', '--minify'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: hardenedExecEnv()
  });
}

function patchActionBundle() {
  const source = readFileSync(actionIndexPath, 'utf8');

  const replacements: Array<[string, string]> = [
    ['../data/patch.json', './data/patch.json'],
    ['mdn-data/css/at-rules.json', './data/at-rules.json'],
    ['mdn-data/css/properties.json', './data/properties.json'],
    ['mdn-data/css/syntaxes.json', './data/syntaxes.json'],
    ['../package.json', './package.json']
  ];

  let patched = source;

  for (const [from, to] of replacements) {
    if (!patched.includes(from)) {
      throw new Error(`Expected to find "${from}" in dist/action/index.js, but it was missing.`);
    }

    patched = patched.split(from).join(to);
  }

  writeFileSync(actionIndexPath, patched, 'utf8');
}

function resolvePnpmPackageAssetPath(packageName: string, relativeAssetPath: string): string {
  const pnpmStorePath = path.join(projectRoot, 'node_modules', '.pnpm');

  const packageDirs = readdirSync(pnpmStorePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${packageName}@`))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true, sensitivity: 'base' }));

  for (const packageDir of packageDirs) {
    const candidatePath = path.join(pnpmStorePath, packageDir, 'node_modules', packageName, relativeAssetPath);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(`Unable to resolve ${packageName}/${relativeAssetPath} in node_modules/.pnpm.`);
}

function copyRuntimeJsonAssets() {
  mkdirSync(actionDataDir, { recursive: true });

  const patchJsonPath = resolvePnpmPackageAssetPath('css-tree', path.join('data', 'patch.json'));
  const atRulesJsonPath = resolvePnpmPackageAssetPath('mdn-data', path.join('css', 'at-rules.json'));
  const propertiesJsonPath = resolvePnpmPackageAssetPath('mdn-data', path.join('css', 'properties.json'));
  const syntaxesJsonPath = resolvePnpmPackageAssetPath('mdn-data', path.join('css', 'syntaxes.json'));

  copyFileSync(patchJsonPath, path.join(actionDataDir, 'patch.json'));
  copyFileSync(atRulesJsonPath, path.join(actionDataDir, 'at-rules.json'));
  copyFileSync(propertiesJsonPath, path.join(actionDataDir, 'properties.json'));
  copyFileSync(syntaxesJsonPath, path.join(actionDataDir, 'syntaxes.json'));
}

function patchActionPackageJson() {
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
  const actionPackage = JSON.parse(readFileSync(actionPackagePath, 'utf8'));

  const patchedActionPackage = {
    ...actionPackage,
    name: `${rootPackage.name}-action`,
    version: rootPackage.version,
    private: true
  };

  writeFileSync(actionPackagePath, `${JSON.stringify(patchedActionPackage, null, 2)}\n`, 'utf8');
}

runNccBuild();
patchActionBundle();
copyRuntimeJsonAssets();
patchActionPackageJson();
