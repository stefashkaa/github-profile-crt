# Customize Your Theme

<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

Custom theme lets you start from a preset and override colours, without editing code.

## Enable

In your workflow:

```yml
with:
  themes: 'custom'
```

## Pick a base preset

Set the base preset via environment:

- `CRT_CUSTOM_BASE_THEME` (default: `crt`)

## Palette overrides

Override any subset of:

- `BG0`, `BG1`, `BG2`
- `PRIMARY`, `PRIMARY_SOFT`
- `TEXT_DIM`
- `SCAN`

Example:

```yml
env:
  CRT_CUSTOM_BASE_THEME: 'mono'
  CRT_CUSTOM_BG0: '#0b0f14'
  CRT_CUSTOM_BG1: '#0f1720'
  CRT_CUSTOM_BG2: '#111c28'
  CRT_CUSTOM_PRIMARY: '#7cffc4'
  CRT_CUSTOM_PRIMARY_SOFT: '#c6ffe6'
  CRT_CUSTOM_TEXT_DIM: '#8ab3a2'
  CRT_CUSTOM_SCAN: 'rgb(124,255,196)'
```

## Light variant control

- `CRT_CUSTOM_ENABLE_LIGHT` — defaults to “on” only if you set any `CRT_CUSTOM_LIGHT_*` overrides
- `CRT_CUSTOM_LIGHT_*` — same palette keys but for light mode

Example:

```yml
env:
  CRT_CUSTOM_ENABLE_LIGHT: 'true'
  CRT_CUSTOM_LIGHT_BG0: '#f6fffb'
  CRT_CUSTOM_LIGHT_BG1: '#e9fff6'
  CRT_CUSTOM_LIGHT_BG2: '#d8f7ea'
```

## Optional spectrum chart

- `CRT_CUSTOM_SPECTRUM_CHART=true` enables rainbow-style colouring.

<!-- nav:bottom:start -->

[↑ Back to README](../README.md)

<!-- nav:bottom:end -->
