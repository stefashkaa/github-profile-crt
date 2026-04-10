# Static Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Minimal-motion variant with scan/noise/equalizer/dashboard animations disabled for the clean readability.

## Dark Mode

<p align="center">
  <img alt="Static Contributions Dark" src="../../examples/static-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Static Contributions Light" src="../../examples/static-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Static SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: static
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/static-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/static-light.svg">
    <img alt="Static Contributions" src="../assets/static-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../../README.md)

<!-- nav:bottom:end -->
