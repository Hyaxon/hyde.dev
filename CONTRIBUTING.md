# Contributing

This repository uses a feature-branch workflow.

`main` is the production branch and should remain deployable at all times.

## Branching

Do not develop features directly on `main`.

Start from an up-to-date `main` branch:

```bash
git checkout main
git pull
```

Then create a branch for the change:

```bash
git switch -c feature/search
```

Use branch prefixes such as:

```text
feature/   new functionality
fix/       bug fixes
chore/     maintenance and tooling
refactor/  internal code changes
docs/      documentation
```

Examples:

```text
feature/weather-widget
feature/command-palette
fix/mobile-navigation
chore/update-dependencies
refactor/api-client
docs/update-readme
```

## Development

Run the local development server with:

```bash
npm run dev
```

Before pushing a branch, run:

```bash
npm run format
npm run check
npm run build
```

You can verify formatting without modifying files with:

```bash
npm run format:check
```

## Commits

Use concise commit messages that describe the change.

Examples:

```text
add command palette
correct mobile navigation overflow
update project dependencies
separate weather API logic
document deployment workflow
```

Keep commits focused when practical.

## Pull Requests

Push the branch:

```bash
git push -u origin feature/search
```

Then open a pull request into `main`.

Each pull request should:

- pass CI
- build successfully
- receive a Cloudflare preview deployment
- be tested in the preview environment
- avoid unrelated changes
- be merged only when ready for production

## Preview Deployments

Non-production branches receive Cloudflare preview deployments.

Use the preview deployment to verify:

- layout and styling
- mobile behavior
- client-side interactions
- API routes
- content rendering
- production build behavior

Preview deployments should be tested before merging.

## Production

Merging into `main` triggers the production deployment.

Production is available at:

```text
https://hyde.dev
```

Avoid:

- committing unfinished work directly to `main`
- force-pushing `main`
- bypassing CI without a clear reason
- committing secrets or local environment files

## Dependency Policy

This repository uses an npm minimum release age to reduce exposure to fresh supply-chain compromises.

The policy is defined in `.npmrc`.

Do not disable or bypass the release-age policy casually.

If a newly released dependency is required for a verified security fix, review the advisory and dependency chain before making a temporary exception.

After dependency changes, run:

```bash
npm audit
```

## Secrets

Never commit real secrets.

Local server-side secrets belong in:

```text
.dev.vars
```

Document required variables in:

```text
.dev.vars.example
```

Cloudflare production secrets should be configured through Cloudflare rather than committed to the repository.
