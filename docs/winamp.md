# Winamp Theme

Winamp-inspired equalizer mood with classic green-yellow energy and faster bar motion feel.

## Dark Mode

<p align="center">
  <img alt="Winamp Contributions Dark" src="../assets/winamp-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Winamp Contributions Light" src="../assets/winamp-light.svg">
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
          themes: winamp
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/winamp-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/winamp-light.svg">
    <img alt="Winamp Contributions" src="../assets/winamp-dark.svg">
  </picture>
</p>
```
