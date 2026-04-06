# github-profile-crt

Generate CRT-style GitHub contribution SVGs for multiple visual themes in one run, ready for profile README usage.

## Stack

- TypeScript
- pnpm
- Vite (build)
- GitHub GraphQL API

## What it generates

Each run creates all theme variants at once in `assets/` (or your configured output dir):

Dark files for all themes:
- `crt-contributions-crt-dark.svg`
- `crt-contributions-amber-dark.svg`
- `crt-contributions-ice-dark.svg`
- `crt-contributions-ruby-dark.svg`
- `crt-contributions-mint-dark.svg`
- `crt-contributions-mono-dark.svg`
- `crt-contributions-chaos-dark.svg`
- `crt-contributions-chaos-max-dark.svg`
- `crt-contributions-static-dark.svg`
Light files for profile-safe themes:
- `crt-contributions-crt-light.svg`
- `crt-contributions-amber-light.svg`
- `crt-contributions-ice-light.svg`
- `crt-contributions-static-light.svg`
Compatibility aliases (dark):
- `crt-contributions-crt.svg` ... `crt-contributions-static.svg`
- `crt-contributions.svg` (default alias to `crt` dark)

## Project structure

- `src/config` - runtime/env config
- `src/github` - GraphQL query + client + calendar fetcher
- `src/model` - contribution calendar types + derived weekly stats
- `src/render/themes.ts` - themeable configs (palette + style tuning)
- `src/render/svgRenderer.ts` - final SVG renderer
- `src/generator.ts` - fetch once + render all themes + write files
- `src/cli.ts` - executable entry point for local runs and CI

## Setup

```bash
pnpm install
```

Create `.env` (or use GitHub Secrets/Variables):

```env
GH_TOKEN=ghp_xxx
GITHUB_USER=your-github-username
CRT_OUTPUT_DIR=assets
CRT_SHOW_GRID=false
CRT_SHOW_STATS=true
CRT_MINIFY_SVG=true
```

## Generate locally

Build + run:

```bash
pnpm generate
```

Run TypeScript directly (no build):

```bash
pnpm generate:dev
```

Generate without SVG optimization:

```bash
pnpm generate:raw
```

## Visual toggles

- `CRT_SHOW_GRID=true|false` toggles chart grid/ticks (default `false`)
- `CRT_SHOW_STATS=true|false` toggles compact footer stats (default `true`)

Footer always keeps:

- `USER: @<username>`
- `CREDITS: stefashkaa/github-profile-crt`

## Theme customization

All non-toggle visual tuning lives in [`src/render/themes.ts`](./src/render/themes.ts):

- palette colors
- scanline/noise/sweep behavior
- bar opacity profile
- glow/line/vignette tuning

To add a new theme, append one config object there.

Special presets included:

- `chaos` - high-energy mode with aggressive animated noise
- `chaos-max` - maximum noise and dense fast scanline chaos
- `static` - calm mode with scanline and noise animation disabled

Light-mode adaptive themes included:

- `crt`
- `amber`
- `ice`
- `static`

## GitHub Actions workflow

Workflow file:

- `.github/workflows/generate-crt-contributions.yml`

It runs on schedule or manually, generates all theme SVGs, and commits updated files.

### Recommended repository settings

- Secret: `GH_TOKEN` (PAT with `read:user` + `repo`)
- Variable: `GITHUB_USER` (optional override target account)

## README usage example

```md
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/crt-contributions-crt-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/crt-contributions-crt-light.svg">
  <img alt="CRT contribution monitor for GitHub profile" src="./assets/crt-contributions-crt-dark.svg">
</picture>
```
