<!-- nav:top:start -->

[← Back to README](../README.md)

<!-- nav:top:end -->

# Troubleshooting

## The workflow runs, but the README shows nothing

- Confirm the image path in your README matches your `output-dir`.
- Confirm the generated files exist in the default branch of the repository that hosts the README.
- If your README lives in `profile/README.md`, make sure the image path points to the correct relative location, for example `../assets/...`.

## Private contributions are not showing

For personal accounts, private contributions only appear if GitHub is allowed to show them on your profile.

Check the setting here:

- [Including private stats for user profiles](./private-stats-personal-account.md)

Also note:

- This project can only render the contribution data GitHub exposes on your profile.
- Private repository names and private activity details still stay private.

## Organization private activity is not showing

If you use `include-org-private: true` and the chart still looks incomplete, the token usually does not have the required organization access.

Check the token setup here:

- [Creating a GitHub Organization Token](./org-token-creation.md)

Make sure that:

- `github-user` is set to the organization login
- `github-token` points to your Actions secret
- the token was created under the organization as the **Resource owner**
- the token has the required read access

## The action says “workspace is not a git repository”

Add a checkout step:

```yml
- uses: actions/checkout@v5
```

This action can clone the repository in some cases, but `actions/checkout` is the most predictable fix.

## "No SVG changes detected"

That is normal if your contribution data did not change within the rendered window, or if your settings produced identical output.

Try this:

- Render `themes: all` once to confirm file generation
- Temporarily set `minify-svg: false` while debugging

## Organization results look different from a user’s contribution graph

Organization mode is an approximation based on repository data. It may not match every contribution type shown in GitHub’s own profile UI.

It works best as a consistent organization activity signal, not as a pixel-perfect mirror of GitHub’s graph.

<!-- nav:bottom:start -->

[↑ Scroll to top](#troubleshooting)

<!-- nav:bottom:end -->
