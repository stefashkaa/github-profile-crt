# Winamp Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

A love letter to the loud desktop era: equalizers, skins, glowing plastic UI, and the kind of chaos that somehow still looked cool.

## Dark Mode

<p align="center">
  <img alt="Winamp Contributions Dark" src="../../examples/winamp-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Winamp Contributions Light" src="../../examples/winamp-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Winamp SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: winamp
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/winamp-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/winamp-light.svg">
    <img alt="Winamp Contributions" src="../assets/winamp-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#winamp-theme)

<!-- nav:bottom:end -->
