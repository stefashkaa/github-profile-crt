# Rainbow Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Every bar feels like it found its own mood; colorful, playful, and built for profiles that should never look flat or corporate.

## Dark Mode

<p align="center">
  <img alt="Rainbow Contributions Dark" src="../../examples/rainbow-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Rainbow Contributions Light" src="../../examples/rainbow-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Rainbow SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: rainbow
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/rainbow-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/rainbow-light.svg">
    <img alt="Rainbow Contributions" src="../assets/rainbow-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#rainbow-theme)

<!-- nav:bottom:end -->
