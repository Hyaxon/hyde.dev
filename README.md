# hyde.dev

Personal developer portfolio and content site.

## Stack

- Astro
- TypeScript
- MDX
- Cloudflare Workers
- Pagefind
- Vanilla client-side TypeScript
- React only where required

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run format
npm run check
npm run build
```

## Preview

```bash
npm run preview
```

## Content

Posts:

```text
src/content/posts/
```

Projects:

```text
src/content/projects/
```

Markdown and MDX are validated through Astro Content Collections.

## Architecture

```text
src/
├── components/       reusable UI
├── content/          Markdown/MDX
├── layouts/          page/content layouts
├── lib/
│   ├── client/       browser-only TypeScript
│   ├── server/       server/API logic
│   └── shared/       environment-agnostic code
├── pages/
│   └── api/          thin HTTP endpoints
└── styles/
```

Normal pages are statically generated.

Dynamic API routes opt out of prerendering with:

```ts
export const prerender = false;
```

## Deployment

- GitHub repository
- `main` is production
- Cloudflare builds and deploys `main` to `hyde.dev`
- Non-production branches receive preview deployments

## Dependency policy

This repository uses an npm minimum release age to reduce exposure to fresh supply-chain compromises.

See `.npmrc`.

## Secrets

Local server-side secrets belong in:

```text
.dev.vars
```

Use:

```text
.dev.vars.example
```

to document required variables.

## Indexing

Top-level pages may be indexed.

Individual project and post pages use `noindex` and are excluded from the sitemap.

## Development workflow

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching, pull requests, CI, and deployment workflow.
