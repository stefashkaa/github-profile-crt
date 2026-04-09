# Ice Theme

Cool cyan/blue phosphor style for a clean futuristic CRT look that still keeps the retro signal texture.

## Dark Mode

<p align="center">
  <img alt="Ice Contributions Dark" src="../assets/ice-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Ice Contributions Light" src="../assets/ice-light.svg">
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
          themes: ice
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/ice-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/ice-light.svg">
    <img alt="Ice Contributions" src="../assets/ice-dark.svg">
  </picture>
</p>
```
