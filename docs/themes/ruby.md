# Ruby Theme

<!-- nav:top:start -->

[← Back to README](../../README.md)

<!-- nav:top:end -->

A darker red-tinted preset with warning-screen energy: dramatic, bold, and impossible to mistake for a safe default.

## Dark Mode

<p align="center">
  <img alt="Ruby Contributions Dark" src="../../examples/ruby-dark.svg" width="100%">
</p>

## Light Mode

<p align="center">
  <img alt="Ruby Contributions Light" src="../../examples/ruby-light.svg" width="100%">
</p>

## Workflow snippet

```yml
- name: Generate Ruby SVGs
  uses: stefashkaa/github-profile-crt@v1
  with:
    output-dir: assets
    themes: ruby
```

## Profile README snippet

```md
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/ruby-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../assets/ruby-light.svg">
    <img alt="Ruby Contributions" src="../assets/ruby-dark.svg" width="100%">
  </picture>
</p>
```

<!-- nav:bottom:start -->

[↑ Scroll to top](#ruby-theme)

<!-- nav:bottom:end -->
