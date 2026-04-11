# Amber Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

A warmer take on the classic terminal look, inspired by amber monitors that felt less clinical and more late-night workstation.

## Dark Mode

<p align="center">
  <img alt="Amber Contributions Dark" src="../../examples/amber-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Amber Contributions Light" src="../../examples/amber-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Amber SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: amber
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/amber-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/amber-light.svg">
    <img alt="Amber Contributions" src="../assets/amber-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#amber-theme)

<!-- nav:bottom:end -->
