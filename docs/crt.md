# CRT Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

Classic phosphor-green monitor aesthetic with balanced scanline/noise intensity and strong retro terminal vibes.

## Dark Mode

<p align="center">
  <img alt="CRT Contributions Dark" src="../assets/crt-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="CRT Contributions Light" src="../assets/crt-light.svg">
</p>

## Use This Theme

File: .github/workflows/generate-crt-contributions.yml

```yaml
name: Generate CRT Contributions

on:
  workflow_dispatch:
  schedule:
    - cron: '15 */12 * * *'

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate SVG assets
        uses: stefashkaa/github-profile-crt@v1
        with:
          output-dir: assets
          themes: crt
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/crt-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/crt-light.svg">
    <img alt="CRT Contributions" src="./assets/crt-dark.svg">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
