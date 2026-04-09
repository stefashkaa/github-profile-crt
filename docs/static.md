# Static Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

Minimal-motion variant with scan/noise/equalizer/dashboard animations disabled for the clean readability.

## Dark Mode

<p align="center">
  <img alt="Static Contributions Dark" src="../assets/static-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Static Contributions Light" src="../assets/static-light.svg">
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
          themes: static
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/static-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/static-light.svg">
    <img alt="Static Contributions" src="../assets/static-dark.svg">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
