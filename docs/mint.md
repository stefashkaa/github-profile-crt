# Mint Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

Fresh mint-green palette with soft glow and smoother contrast for a calmer CRT mood.

## Dark Mode

<p align="center">
  <img alt="Mint Contributions Dark" src="../assets/mint-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Mint Contributions Light" src="../assets/mint-light.svg">
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
          themes: mint
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/mint-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/mint-light.svg">
    <img alt="Mint Contributions" src="../assets/mint-dark.svg">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
