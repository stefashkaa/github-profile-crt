# Chaos Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

A glitched-out preset with unstable color behavior and just enough control to stay usable while still feeling slightly dangerous.

## Dark Mode

<p align="center">
  <img alt="Chaos Contributions Dark" src="../../examples/chaos-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Chaos Contributions Light" src="../../examples/chaos-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Chaos SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: chaos
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/chaos-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/chaos-light.svg">
    <img alt="Chaos Contributions" src="../assets/chaos-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../../README.md)

<!-- nav:bottom:end -->
