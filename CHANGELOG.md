# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-09-12

### Added

#### Optimization and quality

- Peer dependency validation command (`pnpm check:peers`).
- Production dependency audit command (`pnpm audit:prod`).

### Changed

#### Runtime and CLI

- Raised the minimum Node.js version for local CLI usage and development from 20 to 24.
- Replaced CLI console logging with explicit stdout/stderr writes, including newline handling and string conversion for non-Error failures.

#### Build and dependencies

- Updated pnpm from 10.33.0 to 12.3.4 and refreshed the dependency lockfile.
- Updated runtime and Action dependencies:
  - `dotenv` to 17.4.2.
  - `svgo` to 4.1.0.
  - `@actions/core` to 3.0.1.
- Updated build tooling:
  - Vite to 8.3.0.
  - TypeScript to 6.0.3.
  - ncc to 0.45.0.
  - tsx to 4.23.13.
- Updated quality tooling and type definitions:
  - ESLint to 10.10.0.
  - typescript-eslint to 8.70.0.
  - Prettier to 3.9.6.
  - lint-staged to 17.5.1.
  - globals to 17.12.0.
  - Node.js type definitions to 26.5.1.
- Switched Vite entrypoint resolution from `__dirname` to `import.meta.dirname`.
- Regenerated the distributed GitHub Action bundle with updated dependencies and ncc.

## [1.0.0] - 2026-04-11

### Added

#### Core product

- Initial public release of **github-profile-crt**: CRT/equalizer-styled contribution SVG generator for GitHub profile and repository READMEs.
- GitHub Action entrypoint (`stefashkaa/github-profile-crt@v1`) with Node 24 runtime.
- Local CLI workflow for development (`pnpm generate:dev`) and production build flow via Vite + ncc.

#### Data collection

- Personal account contribution fetching via GitHub GraphQL.
- Organization contribution aggregation via GitHub REST APIs.
- Optional inclusion of private organization repositories via `include-org-private` (token-dependent).
- Contribution window selection:
  - Rolling one-year window for current year.
  - Full Jan–Dec window for historical years.

#### SVG rendering

- Main chart with CRT equalizer-style 3D bars, pointer caps, glow, scanline/noise aesthetics, month labels, year labels, and Y-axis labels.
- Optional grid rendering (`show-grid`).
- Dashboard section (`show-stats`) with:
  - `STACK PROFILE` language distribution widget.
  - `ACTIVITY VECTOR` radar widget (commit/PR/issue/review + total).
- Footer stats strip (`show-stats-footer`) with user, contributions, best week, optional last week, and credits.
- Optional hover titles (`enable-hover-attrs`) for non-GitHub embedding contexts.

#### Theme system

- Preset themes:
  - `crt`, `amber`, `ice`, `ruby`, `mint`, `mono`, `winamp`, `neon`, `rainbow`, `chaos`, `chaos-max`, `static`.
- Theme selection modes:
  - Single theme.
  - Comma-separated set (`themes: crt,winamp,rainbow`).
  - All themes (`themes: all`).
- Light/dark output generation with `-dark.svg` and `-light.svg` variants.
- Custom theme mode (`themes: custom`) with palette override env vars and optional custom light overrides.

#### Action inputs/outputs and automation

- Action inputs:
  - `github-user`, `github-token`, `output-dir`, `themes`, `year`,
  - `show-grid`, `show-stats`, `show-stats-footer`,
  - `enable-hover-attrs`, `include-org-private`, `minify-svg`,
  - `commit-and-push`, `commit-message`.
- Action outputs:
  - `output-directory`, `generated-files`, `weeks`, `total-contributions`, `committed`.
- Built-in commit/push flow for generated assets (`commit-and-push: true` by default).

#### Optimization and quality

- SVG optimization pipeline (SVGO) enabled by default (`minify-svg: true`).
- Runtime and rendering optimizations focused on GitHub profile performance while preserving visuals.
- TypeScript-first codebase architecture split into config/data/render/action modules.
- Tooling and quality stack:
  - ESLint, Prettier, Husky, lint-staged, TypeScript typecheck.
- Documentation suite for setup, themes, custom palettes, org/private token setup, troubleshooting, and year windows.
