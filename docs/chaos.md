# Chaos Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

High-intensity CRT noise and scanline profile with aggressive animation and punchy contrast.

## Dark Mode

<p align="center">
  <img alt="Chaos Contributions Dark" src="../assets/chaos-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Chaos Contributions Light" src="../assets/chaos-light.svg">
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
          themes: chaos
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/chaos-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/chaos-light.svg">
    <img alt="Chaos Contributions" src="../assets/chaos-dark.svg">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
