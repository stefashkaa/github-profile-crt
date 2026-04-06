# github-profile-crt

Generate CRT-style GitHub contribution SVGs for multiple visual themes in one run, ready for profile README usage.

## Stack

- TypeScript
- pnpm
- Vite (build)
- GitHub GraphQL API

## What it generates

With `CRT_THEMES=all` (default), each run creates all theme variants at once in `assets/` (or your configured output dir):

Dark files for all themes:
- `crt-dark.svg`
- `amber-dark.svg`
- `ice-dark.svg`
- `ruby-dark.svg`
- `mint-dark.svg`
- `mono-dark.svg`
- `neon-dark.svg`
- `rainbow-dark.svg`
- `chaos-dark.svg`
- `chaos-max-dark.svg`
- `static-dark.svg`
Light files for profile-safe themes:
- `crt-light.svg`
- `amber-light.svg`
- `ice-light.svg`
- `neon-light.svg`
- `rainbow-light.svg`
- `static-light.svg`

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
GITHUB_TOKEN=ghp_xxx
GITHUB_USER=your-github-username
CRT_OUTPUT_DIR=assets
CRT_THEMES=all
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

Theme selection is env-driven:

- `CRT_THEMES=all` (default) renders every preset
- `CRT_THEMES=neon` renders only one preset
- `CRT_THEMES=neon,rainbow,crt` renders a preset subset
- `CRT_THEMES=custom` renders only your custom theme
- `CRT_THEMES=neon,custom` renders preset(s) plus custom

Custom theme env options:

- `CRT_CUSTOM_BASE_THEME=crt` chooses which preset to inherit non-palette tuning from
- `CRT_CUSTOM_SPECTRUM_CHART=true|false` toggles spectrum mode for custom
- Dark palette overrides:
  - `CRT_CUSTOM_BG0`
  - `CRT_CUSTOM_BG1`
  - `CRT_CUSTOM_BG2`
  - `CRT_CUSTOM_PRIMARY`
  - `CRT_CUSTOM_PRIMARY_SOFT`
  - `CRT_CUSTOM_TEXT_DIM`
  - `CRT_CUSTOM_SCAN`
- Light variant:
  - `CRT_CUSTOM_ENABLE_LIGHT=true|false`
  - optional light palette overrides: `CRT_CUSTOM_LIGHT_BG0`, `CRT_CUSTOM_LIGHT_BG1`, `CRT_CUSTOM_LIGHT_BG2`, `CRT_CUSTOM_LIGHT_PRIMARY`, `CRT_CUSTOM_LIGHT_PRIMARY_SOFT`, `CRT_CUSTOM_LIGHT_TEXT_DIM`, `CRT_CUSTOM_LIGHT_SCAN`

All non-toggle visual tuning lives in [`src/render/themes.ts`](./src/render/themes.ts):

- palette colors
- scanline/noise/sweep behavior
- bar opacity profile
- glow/line/vignette tuning

To add a new theme, append one config object there.

Special presets included:

- `neon` - magenta/cyan retro neon style
- `rainbow` - full-spectrum dynamic chart coloring across weeks
- `chaos` - high-energy mode with aggressive animated noise
- `chaos-max` - maximum noise and dense fast scanline chaos
- `static` - calm mode with scanline and noise animation disabled

Light-mode adaptive themes included:

- `crt`
- `amber`
- `ice`
- `neon`
- `rainbow`
- `static`

## GitHub Actions workflow

Workflow file:

- `.github/workflows/generate-crt-contributions.yml`

It runs on schedule or manually, generates all theme SVGs, and commits updated files.

### Recommended repository settings

- Secret: `GITHUB_TOKEN` (PAT with `read:user` + `repo`)
- Variable: `GITHUB_USER` (optional override target account)

## README usage example

```md
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/crt-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/crt-light.svg">
  <img alt="CRT contribution monitor for GitHub profile" src="./assets/crt-dark.svg">
</picture>
```
