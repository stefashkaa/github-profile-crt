# github-profile-crt

Generate a CRT-style SVG chart from your GitHub contribution calendar and use it in your profile README.

## Stack

- TypeScript
- pnpm
- Vite (build)
- GitHub GraphQL API

## Project structure

- `src/config` - environment loading and typed runtime config
- `src/github` - GraphQL query + GitHub client + calendar fetcher
- `src/model` - contribution calendar domain types and derived weekly stats
- `src/render` - palette, layout, SVG path helpers, and final renderer
- `src/generator.ts` - orchestration for fetch + render + file write
- `src/cli.ts` - executable entry point for local runs and CI

## Setup

```bash
pnpm install
```

Create `.env` (or set GitHub Secrets in Actions):

```env
GH_TOKEN=ghp_xxx
GITHUB_USER=your-github-username
CRT_THEME=crt
CRT_OUTPUT_PATH=assets/crt-contributions.svg
CRT_SHOW_GRID=true
CRT_SHOW_STATS=true
CRT_ANIMATE_SCANLINES=true
CRT_MINIFY_SVG=true
CRT_SVG_MINIFY_MULTIPASS=true
```

## Generate SVG locally

```bash
pnpm generate
```

This builds the project with Vite and writes the SVG to `assets/crt-contributions.svg` by default.

For local dev (run TypeScript directly, no build):

```bash
pnpm dev
```

Generate without SVG optimization (for visual diff checks):

```bash
pnpm generate:raw
```

## SVG optimization

By default, output is minified with `svgo` in a conservative mode that keeps the same visuals and animation behavior.

- `CRT_MINIFY_SVG=true|false` enables/disables optimization
- `CRT_SVG_MINIFY_MULTIPASS=true|false` enables deeper optimization passes

## Visual toggles

- `CRT_SHOW_GRID=true|false` shows/hides bar-chart grid lines and vertical ticks
- `CRT_SHOW_STATS=true|false` shows/hides compact stats in the footer
- `CRT_ANIMATE_SCANLINES=true|false` enables/disables animated scanline movement

Footer always keeps:
- `USER: @<username>`
- `CREDITS: stefashkaa/github-profile-crt`

## GitHub Actions workflow

A ready workflow is included at:

- `.github/workflows/generate-crt-contributions.yml`

It can run on schedule and manual trigger, then commit updated SVG output back to the repo.

### Recommended repository settings

- Add `GH_TOKEN` secret (classic PAT with `read:user` + `repo`)
- Optional repo variable `GITHUB_USER` to target a specific profile
- Optional repo variable `CRT_THEME` (`crt` or `amber`)

## SVG in profile README

```md
![CRT Contributions](./assets/crt-contributions.svg)
```
