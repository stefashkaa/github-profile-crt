# Mono Theme

Grayscale monochrome interpretation with subtle glow and low-saturation dashboard visuals.

## Dark Mode

<p align="center">
  <img alt="Mono Contributions Dark" src="../assets/mono-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Mono Contributions Light" src="../assets/mono-light.svg">
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
          themes: mono
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/mono-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/mono-light.svg">
    <img alt="Mono Contributions" src="../assets/mono-dark.svg">
  </picture>
</p>
```
