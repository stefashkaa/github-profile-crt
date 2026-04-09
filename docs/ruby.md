# Ruby Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

Red-tinted high-contrast signal style for bold profiles that want aggressive color identity.

## Dark Mode

<p align="center">
  <img alt="Ruby Contributions Dark" src="../assets/ruby-dark.svg">
</p>

## Light Mode

<p align="center">
  <img alt="Ruby Contributions Light" src="../assets/ruby-light.svg">
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
          themes: ruby
```

Profile README snippet:

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/ruby-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/ruby-light.svg">
    <img alt="Ruby Contributions" src="../assets/ruby-dark.svg">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
