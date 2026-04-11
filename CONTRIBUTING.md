# Contributing

First off, thank you for considering contributing to github-profile-crt! It's people like you that make open source such a great community 🎉

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Development Setup](#-development-setup)
- [Code layout](#-code-layout)
- [Adding a new theme](#-adding-a-new-theme)
- [Coding Standards](#-coding-standards)
- [Commit Guidelines](#-commit-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Release Process](#-release-process)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [stefan@desource-labs.org](mailto:stefan@desource-labs.org).

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/stefashkaa/github-profile-crt/issues) to avoid duplicates.

When creating a bug report, include:

- **A clear and descriptive title**
- **A detailed description of the issue**
- **Steps to reproduce the behavior**
- **Expected vs actual behavior**
- **Screenshots or/and logs** (if applicable)
- **Code samples** (minimal reproduction)

**Example:**

```markdown
## Bug: Profile picture not updating after change

### Steps to Reproduce

1. Go to the profile settings page.
2. Upload a new profile picture.
3. Save changes.

### Expected Behavior

The new profile picture should be displayed immediately after saving.

### Actual Behavior

The old profile picture remains displayed until the page is refreshed.

### Environment

- OS: Windows 10
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **A clear and descriptive title**
- **A detailed description of the enhancement**
- **The problem it solves or the benefit it provides**
- **Any relevant examples or use cases**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Ensure your code follows the coding standards and all commands/tests pass
4. Update the documentation if necessary
5. Submit your pull request!

## 🛠️ Development Setup

### Prerequisites

- Node.js (see `package.json` for the supported range)
- pnpm (this repo uses pnpm; see `packageManager`)

### Installation

Fork the repository and clone it to your local machine:

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/github-profile-crt.git
cd github-profile-crt

# Install dependencies
pnpm install
```

### Configure env for local generation

Copy the template:

```bash
cp .env.example .env
```

Fill in:

- `GITHUB_USER` — login to render
- `GITHUB_TOKEN` — token with API access

### Run locally (fast iteration)

```bash
pnpm generate:dev
```

You should see SVGs written into `examples/` by default.

### Build

Library build (Vite):

```bash
pnpm build
```

Action bundle build (ncc):

```bash
pnpm build:action
```

Or both:

```bash
pnpm build:all
```

## 📁 Code layout

- `src/action.ts` — GitHub Action entrypoint (inputs, git commit/push)
- `src/config/*` — config parsing and defaults
- `src/github/*` — GitHub GraphQL/REST clients and fetchers
- `src/render/*` — SVG renderer + optimization
- `src/render/themes.ts` — theme definitions and light variants
- `docs/` — theme previews + docs pages

## 🎨 Adding a new theme

1. Add a new theme config in `src/render/themes.ts`
2. If you want a light variant, add a matching entry in `LIGHT_THEME_OVERRIDES`
3. Generate locally and confirm both `*-dark.svg` and `*-light.svg` output
4. Add a theme preview page under `docs/` and link it from `docs/themes.md`

## 📏 Coding Standards

- Keep output deterministic (given the same inputs)
- Prefer small, composable functions
- Avoid “magic” state in global variables
- Keep runtime network calls minimal and well‑bounded

Formatting and linting:

```bash
pnpm lint
pnpm format
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation only
- **style:** Code style (formatting, missing semi-colons, etc.)
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **perf:** Performance improvement
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, build, etc.)

### Scopes

Scopes are optional but can be used to specify the area of the codebase affected (e.g., `render`, `github`, `config`).

### Example

```bash
# New feature
git commit -m "feat(render): add new 'minimal' theme"
# Bug fix
git commit -m "fix(github): handle API rate limit errors gracefully"
# Documentation update
git commit -m "docs: update README with new theme examples"
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Run `pnpm build` — ensure the library builds without errors
- [ ] Run `pnpm build:action` — ensure the action bundle builds without errors
- [ ] Run `pnpm lint` — ensure code is properly formatted and linted
- [ ] Update documentation if your changes affect usage or themes
- [ ] Add tests for new features or bug fixes

### PR Description Template

Use the repository PR template from:

- [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md)

Minimum content for a high-quality PR:

1. **Summary** — what changed and why.
2. **Problem / Motivation** — which user or maintainer pain point is solved.
3. **Type of change** — bug/feature/docs/refactor/etc.
4. **Testing** — exact commands and what was verified.
5. **Visual diff** — before/after screenshots for any rendering change.

Example:

```markdown
## Summary

Adjust WINAMP pointer shades to improve visibility in light mode without changing geometry.

## Problem / Motivation

Pointer caps were near-invisible on light backgrounds.

## Type Of Change

- [x] Bug fix (non-breaking)

## Testing

- pnpm lint
- pnpm typecheck
- pnpm generate:dev
- Checked generated `assets/winamp-light.svg` in GitHub light and dark themes

## Visual Diff (if applicable)

- Attached before/after screenshots in the PR description.
```

### Review Process

1. **Automated Checks** — CI runs tests and builds
2. **Code Review** — Maintainer reviews code
3. **Feedback** — Address review comments
4. **Approval** — Maintainer approves PR
5. **Merge** — PR is merged to main

## 🚀 Release Process

Maintainers-only release flow:

1. Ensure `main` is green and docs are updated.
2. Update `CHANGELOG.md` manually:
   - Move completed items from `## [Unreleased]` into a new `## [X.Y.Z] - YYYY-MM-DD` section.
   - Keep entries short and user-facing (`Added`, `Changed`, `Fixed`, `Removed`).
   - This repository does **not** currently auto-generate changelog entries.
3. Run final validation locally:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build:all`
   - `pnpm generate:dev`
4. Commit any generated/required artifacts.
5. Bump version in `package.json` (if needed for release tracking).
6. Create and push a version tag:

```bash
git checkout main
git pull --ff-only
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

7. Create GitHub Release notes for `vX.Y.Z`.
8. Move the major action tag (for example `v1`) to the new release so users pinned to major get updates:

```bash
git tag -fa v1 -m "Update v1 to vX.Y.Z"
git push origin v1 --force
```

9. Verify Marketplace listing and sample workflow still work after release.

## 🎯 Areas We Need Help

- **🐛 Bug fixes** — Help identify and fix bugs
- **✨ New features** — Propose and implement new features or themes
- **🎨 More themes** — Adding more themes and light variants
- **📖 Documentation** - Improving documentation and examples
- **🧪 Adding tests** and improving coverage

## 💬 Community

- **GitHub Discussions:** [Ask questions, share ideas](https://github.com/stefashkaa/github-profile-crt/discussions)
- **Issues:** [Report bugs or request features](https://github.com/stefashkaa/github-profile-crt/issues)
- **Security:** [Report vulnerabilities privately](https://github.com/stefashkaa/github-profile-crt/security/advisories/new)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! ❤️

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/stefashkaa">@stefashkaa</a></sub>
  <br>
  <sub>If this project helps your profile stand out, star the repo and share your theme setup</sub>
</div>
