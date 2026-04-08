# Contributing

Thanks for your interest in improving `github-profile-crt`.

## Ways To Contribute

- Report bugs
- Propose new themes or visual upgrades
- Improve docs and examples
- Fix issues and submit pull requests

## Local Setup

1. Fork and clone the repository.
2. Install dependencies:

```bash
pnpm install
```

3. Copy and edit local env values:

```bash
cp .env.example .env
```

4. Run the generator in dev mode:

```bash
pnpm generate:dev
```

## Before Opening A Pull Request

Run checks locally:

```bash
pnpm lint
pnpm typecheck
pnpm generate:dev
```

If you touched docs or config formatting:

```bash
pnpm format
```

## Pull Request Guidelines

- Keep changes focused and easy to review
- Include a short description of user impact
- Attach before/after screenshots for visual changes
- Update docs when adding or changing env options

## Commit Style

Conventional commit prefixes are preferred:

- `feat:`
- `fix:`
- `docs:`
- `chore:`
- `refactor:`

## Development Notes

- Generated SVGs live in `assets/`
- Rendering logic lives in `src/render/svgRenderer.ts`
- Theme tuning lives in `src/render/themes.ts`

## Code Of Conduct

By participating in this project, you agree to follow
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
