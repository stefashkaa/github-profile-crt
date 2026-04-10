# Mono Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

No color, no sugar — just grayscale signal aesthetics for people who want the shape of the effect without the spectacle.

## Dark Mode

<p align="center">
  <img alt="Mono Contributions Dark" src="../../examples/mono-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Mono Contributions Light" src="../../examples/mono-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Mono SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: mono
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/mono-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/mono-light.svg">
    <img alt="Mono Contributions" src="../assets/mono-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../../README.md)

<!-- nav:bottom:end -->
