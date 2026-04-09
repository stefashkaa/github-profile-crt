# Amber Theme

Warm monochrome amber look inspired by old workstation displays, with softer glow and nostalgic terminal tone.

## Dark Mode

<p align="center">
  <img alt="Amber Contributions Dark" src="../assets/amber-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Amber Contributions Light" src="../assets/amber-light.svg">
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
          themes: amber
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/amber-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/amber-light.svg">
    <img alt="Amber Contributions" src="../assets/amber-dark.svg">
  </picture>
</p>
```
