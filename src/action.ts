import * as core from '@actions/core';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { loadRuntimeConfig } from './config/env';
import { generateCrtContributionSvgs } from './generator';

function resolveRepositoryOwner(): string | undefined {
  const explicitOwner = process.env.GITHUB_REPOSITORY_OWNER?.trim();

  if (explicitOwner) {
    return explicitOwner;
  }

  const repository = process.env.GITHUB_REPOSITORY?.trim();

  if (!repository) {
    return undefined;
  }

  const [owner] = repository.split('/');
  return owner?.trim() || undefined;
}

function setEnvIfNonEmpty(key: string, value: string): void {
  const normalized = value.trim();

  if (normalized) {
    process.env[key] = normalized;
  }
}

function parseBooleanInput(inputName: string, defaultValue: boolean): boolean {
  const raw = core.getInput(inputName).trim();

  if (!raw) {
    return defaultValue;
  }

  const normalized = raw.toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value for '${inputName}': '${raw}'.`);
}

function resolveWorkspacePath(): string {
  const workspace = process.env.GITHUB_WORKSPACE?.trim();
  if (workspace) {
    return workspace;
  }

  return process.cwd();
}

function resolveGitBranchFromContext(): string | undefined {
  const headRef = process.env.GITHUB_HEAD_REF?.trim();
  if (headRef) {
    return headRef;
  }

  const ref = process.env.GITHUB_REF?.trim();
  if (ref?.startsWith('refs/heads/')) {
    return ref.slice('refs/heads/'.length);
  }

  const refName = process.env.GITHUB_REF_NAME?.trim();
  if (refName && refName !== 'merge') {
    return refName;
  }

  return undefined;
}

function buildGithubAuthHeader(token: string): string {
  const basicAuth = Buffer.from(`x-access-token:${token}`).toString('base64');
  return `AUTHORIZATION: basic ${basicAuth}`;
}

function runGit(
  args: string[],
  cwd: string,
  options?: {
    allowFailure?: boolean;
    githubAuthToken?: string;
    trimOutput?: boolean;
  }
): string {
  const allowFailure = options?.allowFailure ?? false;
  const trimOutput = options?.trimOutput ?? true;
  const finalArgs =
    options?.githubAuthToken && options.githubAuthToken.trim()
      ? ['-c', `http.https://github.com/.extraheader=${buildGithubAuthHeader(options.githubAuthToken)}`, ...args]
      : args;

  try {
    const output = execFileSync('git', finalArgs, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return trimOutput ? output.trim() : output;
  } catch (error) {
    if (allowFailure) {
      return '';
    }

    throw error;
  }
}

function isGitRepository(cwd: string): boolean {
  const result = runGit(['rev-parse', '--is-inside-work-tree'], cwd, { allowFailure: true });
  return result === 'true';
}

function ensureWorkspaceRepository(
  workspace: string,
  githubToken: string,
  githubRepository: string | undefined,
  gitBranch: string | undefined
): void {
  if (isGitRepository(workspace)) {
    return;
  }

  if (!githubRepository) {
    throw new Error(
      "Missing repository context. Enable 'actions/checkout' or run inside a workflow repository context where GITHUB_REPOSITORY is available."
    );
  }

  if (!gitBranch) {
    throw new Error(
      "Unable to resolve target branch. Enable 'actions/checkout' or run on a branch context where GITHUB_REF_NAME is available."
    );
  }

  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }

  const workspaceEntries = fs.readdirSync(workspace);
  if (workspaceEntries.length > 0) {
    throw new Error(
      `Workspace '${workspace}' is not a git repository and is not empty. Add 'actions/checkout' before this action.`
    );
  }

  const cloneUrl = `https://github.com/${githubRepository}.git`;
  runGit(['clone', '--depth', '1', '--branch', gitBranch, cloneUrl, workspace], process.cwd(), {
    githubAuthToken: githubToken
  });
}

function resolvePushBranch(workspace: string): string {
  const branchFromContext = resolveGitBranchFromContext();
  if (branchFromContext) {
    return branchFromContext;
  }

  const currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], workspace, { allowFailure: true });
  if (currentBranch && currentBranch !== 'HEAD') {
    return currentBranch;
  }

  throw new Error('Unable to resolve a target branch for push.');
}

function commitAndPushGeneratedAssets(
  workspace: string,
  outputDir: string,
  githubToken: string,
  commitMessage: string
): boolean {
  const outputPathForGit = path.isAbsolute(outputDir) ? path.relative(workspace, outputDir) : outputDir;
  if (!outputPathForGit || outputPathForGit.startsWith('..')) {
    throw new Error(`Cannot commit output directory '${outputDir}' because it is outside of workspace '${workspace}'.`);
  }

  const changed = runGit(['status', '--porcelain', '--', outputPathForGit], workspace, { trimOutput: false }).trim();
  if (!changed) {
    core.info(`No SVG changes detected in '${outputPathForGit}'.`);
    return false;
  }

  runGit(['config', 'user.name', 'github-actions[bot]'], workspace);
  runGit(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], workspace);
  runGit(['add', '--', outputPathForGit], workspace);

  const staged = runGit(['diff', '--cached', '--name-only', '--', outputPathForGit], workspace);
  if (!staged) {
    core.info(`No staged changes found in '${outputPathForGit}' after add.`);
    return false;
  }

  runGit(['commit', '-m', commitMessage], workspace);

  const targetBranch = resolvePushBranch(workspace);
  runGit(['push', 'origin', `HEAD:${targetBranch}`], workspace, { githubAuthToken: githubToken });

  core.info(`Committed and pushed generated assets to branch '${targetBranch}'.`);
  return true;
}

async function run(): Promise<void> {
  const inputUser = core.getInput('github-user').trim();
  const inputToken = core.getInput('github-token').trim();
  const commitMessage = core.getInput('commit-message').trim();
  const shouldCommitAndPush = parseBooleanInput('commit-and-push', true);
  const resolvedUser = inputUser || resolveRepositoryOwner();
  const resolvedToken = inputToken || process.env.GITHUB_TOKEN?.trim();
  const workspace = resolveWorkspacePath();
  const repository = process.env.GITHUB_REPOSITORY?.trim();
  const gitBranch = resolveGitBranchFromContext();

  if (!resolvedUser) {
    throw new Error(
      "Missing target GitHub username. Provide 'github-user' input or run in a repository context with a resolvable owner."
    );
  }

  if (!resolvedToken) {
    throw new Error("Missing GitHub token. Provide 'github-token' input or set GITHUB_TOKEN.");
  }

  process.env.GITHUB_USER = resolvedUser;
  process.env.GITHUB_TOKEN = resolvedToken;

  if (shouldCommitAndPush) {
    ensureWorkspaceRepository(workspace, resolvedToken, repository, gitBranch);
  }
  process.chdir(workspace);

  setEnvIfNonEmpty('CRT_OUTPUT_DIR', core.getInput('output-dir'));
  setEnvIfNonEmpty('CRT_THEMES', core.getInput('themes'));
  setEnvIfNonEmpty('CRT_SHOW_GRID', core.getInput('show-grid'));
  setEnvIfNonEmpty('CRT_SHOW_STATS', core.getInput('show-stats'));
  setEnvIfNonEmpty('CRT_SHOW_STATS_FOOTER', core.getInput('show-stats-footer'));
  setEnvIfNonEmpty('CRT_ENABLE_HOVER_ATTRS', core.getInput('enable-hover-attrs'));
  setEnvIfNonEmpty('CRT_MINIFY_SVG', core.getInput('minify-svg'));
  setEnvIfNonEmpty('CRT_YEAR', core.getInput('year'));

  const config = loadRuntimeConfig(process.env);
  const result = await generateCrtContributionSvgs(config);
  let committed = false;

  if (shouldCommitAndPush) {
    const finalCommitMessage = commitMessage || 'chore: Update CRT contribution SVGs';
    committed = commitAndPushGeneratedAssets(workspace, result.outputDirectory, resolvedToken, finalCommitMessage);
  }

  core.info(
    `Generated ${result.files.length} themed SVGs in ${result.outputDirectory} (${result.weeks} weeks, ${result.totalContributions} contributions).`
  );

  core.setOutput('output-directory', result.outputDirectory);
  core.setOutput('generated-files', String(result.files.length));
  core.setOutput('weeks', String(result.weeks));
  core.setOutput('total-contributions', String(result.totalContributions));
  core.setOutput('committed', String(committed));
}

run().catch((error: unknown) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
    return;
  }

  core.setFailed(String(error));
});
