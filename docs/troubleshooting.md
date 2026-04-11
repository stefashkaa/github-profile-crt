<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

# Troubleshooting

## The workflow runs, but the README shows nothing

- Confirm the image path in the README matches your `output-dir`.
- Confirm the generated files exist in the default branch of the repo that hosts the README.

## The action says “workspace is not a git repository”

Add a checkout step:

```yml
- uses: actions/checkout@v5
```

This action can clone the repo in some cases, but checkout is the most predictable fix.

## “No SVG changes detected”

That’s normal if your contribution data didn’t change within the rendered window, or your settings produce identical output.

Try:

- Rendering `themes: all` once to confirm file generation
- Temporarily setting `minify-svg: false` to debug

## Organization results look different from a user’s contribution graph

Organization mode is an approximation based on repository data and may not match every “contribution type” shown in GitHub UI. It’s best used as a single, consistent “org activity signal” rather than a strict mirror.

<!-- nav:bottom:start -->

[↑ Scroll to top](#troubleshooting)

<!-- nav:bottom:end -->
