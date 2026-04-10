# Chaos Max Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Chaos with the limiter removed — louder, harsher, more distorted, and made for people who think subtle themes are a waste of pixels.

## Dark Mode

<p align="center">
  <img alt="Chaos Max Contributions Dark" src="../../examples/chaos-max-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Chaos Max Contributions Light" src="../../examples/chaos-max-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Chaos Max SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: chaos-max
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/chaos-max-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/chaos-max-light.svg">
    <img alt="Chaos Max Contributions" src="../assets/chaos-max-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../../README.md)

<!-- nav:bottom:end -->
