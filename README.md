# github-profile-crt

Bring a little retro warmth to your GitHub profile: **turn your contributions into a CRT “signal board” SVG** — animated scanlines, noise, and a dashboard-style vibe — generated automatically on a schedule.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./examples/crt-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./examples/crt-light.svg">
    <img alt="CRT-style contribution chart preview" src="./examples/crt-dark.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/stefashkaa/github-profile-crt/actions/workflows/generate-crt-contributions.yml"><img alt="Workflow" src="https://img.shields.io/github/actions/workflow/status/stefashkaa/github-profile-crt/generate-crt-contributions.yml?label=generate"></a>
  <a href="https://github.com/stefashkaa/github-profile-crt/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/stefashkaa/github-profile-crt"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/stefashkaa/github-profile-crt"></a>
  <a href="https://github.com/stefashkaa/github-profile-crt/issues"><img alt="Issues" src="https://img.shields.io/github/issues/stefashkaa/github-profile-crt"></a>
</p>

## What you get

github-profile-crt is a GitHub Action that:

- **Fetches** contribution data for a user (GraphQL) or an organisation (REST aggregation)
- **Renders** a CRT-style weekly chart as **SVG**
- **Applies themes** (dark + light variants), custom palettes are supported too
- **Optionally commits & pushes** the generated files back to your repo

It’s designed for:

- **Profile READMEs** (user and organisation)
- **Project READMEs** (if you want a living “activity panel” in a repo)

## Quick start

### Choose where the README lives

- **User profile README:** create a public repo named **`.github`** under your user account, then add `profile/README.md`
- **Organisation profile README:** create a public repo named **`.github`** under the organisation, then add `profile/README.md`

(Those are GitHub’s rules; this action simply generates files you embed.)

### Add a workflow

Create a workflow file in the repository that will _store the generated SVGs_ (org or your profile `.github` repo, or any repo you want).

Example: `.github/workflows/github-profile-crt.yml`

```yml
name: Build CRT contribution SVGs

on:
  workflow_dispatch:
  schedule:
    # Every day at 10:15 UTC (edit to taste)
    - cron: '15 10 * * *'

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Generate SVGs
        uses: stefashkaa/github-profile-crt@v1
        with:
          output-dir: assets
          themes: crt
          # github-user - set for a different user/org or to aggregate org data (defaults to repo owner)
          # github-token - set for org data access (defaults to GITHUB_TOKEN)
          # include-org-private - set to 'true' to include private repos in org aggregation (defaults to 'false')
```

- To allow private data for personal accounts, you need to enable it in your [account settings](./docs/private-stats-personal-account.md)
- To enable private repo data for orgs, you must use a custom token by following [these steps](./docs/org-token-creation.md)

Commit, push, and run the workflow once (or wait for the schedule).

### Embed it in your README

In your `profile/README.md` (or somewhere else), embed the generated SVG:

```md
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/crt-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/crt-light.svg">
  <img alt="My CRT contribution chart" src="assets/crt-dark.svg" width="100%">
</picture>
```

The `picture` element ensures the correct theme variant is shown based on user preference. Adjust paths if your SVGs are in a different location.

Tip: keep the SVGs in a simple folder like `assets/` so paths stay stable.

## Themes

Preset themes:

- [crt](./docs/themes/crt.md): the original green terminal glow
- [amber](./docs/themes/amber.md): warm fossil-era monitor amber
- [ice](./docs/themes/ice.md): cold blue signal from the future
- [ruby](./docs/themes/ruby.md): red alert with style
- [mint](./docs/themes/mint.md): fresh green with a cleaner edge
- [mono](./docs/themes/mono.md): grayscale, quiet, and sharp
- [winamp](./docs/themes/winamp.md): loud Y2K media-player nostalgia
- [neon](./docs/themes/neon.md): midnight cyber-club voltage
- [rainbow](./docs/themes/rainbow.md): pure color chaos, but joyful
- [chaos](./docs/themes/chaos.md): unstable signal, controlled damage
- [chaos-max](./docs/themes/chaos-max.md): full visual meltdown
- [static](./docs/themes/static.md): no animations at all, just a beauty

Use one, a list, or all:

```yml
with:
  themes: crt,rainbow,winamp
```

```yml
with:
  themes: all
```

### Want your own custom theme? [Customize it!](./docs/customize-theme.md)

## Inputs

All inputs are optional unless stated otherwise.

| Input                 | Default               | What it does                                                                |
| --------------------- | --------------------- | --------------------------------------------------------------------------- |
| `github-token`        | `${{ github.token }}` | Token for reading data and (optionally) pushing commits.                    |
| `github-user`         | repo owner            | GitHub login to render (user or org).                                       |
| `output-dir`          | `assets`              | Output folder written inside the workspace repo.                            |
| `themes`              | `crt`                 | Themes to render: comma-separated list, `all`, and/or `custom`.             |
| `year`                | current year          | If current year: rolling last ~365 days; otherwise full calendar year.      |
| `commit-and-push`     | `true`                | Commit & push changed SVGs back to the repo.                                |
| `commit-message`      | auto                  | Custom commit message for generated files.                                  |
| `show-grid`           | `true`                | Toggle chart grid lines.                                                    |
| `show-stats`          | `true`                | Toggle the dashboard panels (language + activity vector).                   |
| `show-stats-footer`   | `true`                | Toggle footer metrics line.                                                 |
| `enable-hover-attrs`  | `false`               | Adds `<title>` hover text per week (larger SVG).                            |
| `include-org-private` | `false`               | For org logins: include private repos in aggregation (token must allow it). |
| `minify-svg`          | `true`                | SVGO optimise output (recommended).                                         |

## Outputs

| Output                | Meaning                                     |
| --------------------- | ------------------------------------------- |
| `output-directory`    | Where SVGs were written in the workspace.   |
| `generated-files`     | Number of SVG files generated.              |
| `weeks`               | Weeks rendered in the chart.                |
| `total-contributions` | Total contributions in the rendered window. |
| `committed`           | `true` if a commit was created and pushed.  |

## Common recipes

### Generate without committing (preview mode)

```yml
with:
  commit-and-push: false
  themes: crt
```

### Change the year window

Render a specific year:

```yml
with:
  year: '2024'
```

[Example](./docs/year-window.md)

### Turn off the dashboard panels

```yml
with:
  show-stats: false
  show-stats-footer: false
```

[Examples](./docs/without-stats-panels.md)

### Organisation profile

Set `github-user` to the organisation login and `github-token` with org data access (see [these steps](./docs/org-token-creation.md)).

```yml
with:
  github-user: DeSource-Labs
  github-token: ${{ secrets.ORG_TOKEN }}
  include-org-private: true
  themes: mono
```

[Example](./docs/org-profile.md)

## How it works

At a high level:

- Fetch contribution data (user: GraphQL; org: REST aggregation)
- Render themed SVG(s)
- Optionally optimise (SVGO)
- Optionally commit & push changes

```mermaid
flowchart LR
  A[Workflow trigger] --> B[github-profile-crt Action]
  B --> C[Fetch contribution data]
  C --> D[Render themed SVGs]
  D --> E[Optimise SVGs (optional)]
  E --> F[Write to output-dir]
  F --> G{commit-and-push?}
  G -- yes --> H[git commit & push]
  G -- no --> I[Done]
```

## Troubleshooting

If nothing updates:

- Confirm `permissions: contents: write` in your workflow.
- Confirm the SVG paths in your README match your `output-dir`.
- If the action errors about the workspace not being a git repo, add `actions/checkout`.

[More info](./docs/troubleshooting.md)

## Security

- Prefer pinning actions to a release tag or commit SHA in production workflows.
- Use the minimum required workflow permissions (`contents: write` only when committing).

See `SECURITY.md` for reporting & workflow hardening notes.

## Contributing

Contributions, bug reports, theme ideas, and docs fixes are welcome.

[Start here](CONTRIBUTING.md)

## License

[MIT](./LICENSE)

## Support

- Questions / help: open an issue
- Vulnerabilities: use GitHub Security Advisories (private report)

[See `SUPPORT.md`](SUPPORT.md) for details.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/stefashkaa">@stefashkaa</a></sub>
  <br>
  <sub>If this project helps your profile stand out, star the repo and share your theme setup</sub>
</div>
