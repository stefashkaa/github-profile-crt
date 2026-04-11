# Neon Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Bright, electric, and nightlife-coded — this preset pushes the graph into cyberpunk territory without losing readability.

## Dark Mode

<p align="center">
  <img alt="Neon Contributions Dark" src="../../examples/neon-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Neon Contributions Light" src="../../examples/neon-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Neon SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: neon
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/neon-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/neon-light.svg">
    <img alt="Neon Contributions" src="../assets/neon-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#neon-theme)

<!-- nav:bottom:end -->
