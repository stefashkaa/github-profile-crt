# CRT Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

Classic green phosphor CRT. Deep blacks, crisp scanlines, and the most “terminal-like” look of the set.

## Dark Mode

<p align="center">
  <img alt="CRT Contributions Dark" src="../../examples/crt-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="CRT Contributions Light" src="../../examples/crt-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate CRT SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: crt
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/crt-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/crt-light.svg">
    <img alt="CRT Contributions" src="../assets/crt-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Back to README](../../README.md)

<!-- nav:bottom:end -->
