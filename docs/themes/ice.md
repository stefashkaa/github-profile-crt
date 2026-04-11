# Ice Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Cold blue light, clean contrast, and a more futuristic mood — like your contribution graph was pulled from a ship console.

## Dark Mode

<p align="center">
  <img alt="Ice Contributions Dark" src="../../examples/ice-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Ice Contributions Light" src="../../examples/ice-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Ice SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: ice
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/ice-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/ice-light.svg">
    <img alt="Ice Contributions" src="../assets/ice-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#ice-theme)

<!-- nav:bottom:end -->
