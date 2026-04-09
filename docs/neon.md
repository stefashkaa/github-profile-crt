# Neon Theme

Vibrant magenta-cyan neon palette for a flashy, club-like CRT presentation.

## Dark Mode

<p align="center">
  <img alt="Neon Contributions Dark" src="../assets/neon-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Neon Contributions Light" src="../assets/neon-light.svg">
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
          themes: neon
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/neon-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/neon-light.svg">
    <img alt="Neon Contributions" src="../assets/neon-dark.svg">
  </picture>
</p>
```
