# hyde.dev

Personal developer portfolio and content site.

## Stack

- Astro
- TypeScript
- MDX
- Cloudflare Workers
- Pagefind
- Vanilla client-side TypeScript

## Development

```bash
npm install
npm run dev -- --background
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
├── data/             curated GitHub project registry
├── layouts/          page/content layouts
├── lib/
│   ├── github/       build-time API client and README processing
│   ├── projects/     project types, loader and selectors
│   ├── posts/        published post selectors
│   └── server/       runtime API logic
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

### GitHub projects

Add repositories to `src/data/projects.ts` with a unique `slug`, GitHub `repo`
URL, and `category`. Every build fetches repository metadata and the README from
GitHub's default branch. Optional titles, descriptions, tags and status values
in the registry override GitHub metadata. The resulting content collection powers
both project cards and `/projects/<slug>/` pages; `/projects/` lists all visible,
non-draft projects. Local Markdown/MDX projects remain in `src/content/projects/`.

Set `GITHUB_TOKEN` in the build environment (or a local `.env` file) to use
authenticated GitHub API limits. It is only used during content loading. Missing
READMEs produce an empty body; other GitHub errors fail the build rather than
publishing incomplete content.

Run the README rendering regression checks with:

```bash
npm test
```

### Maintaining the static site

- Page and card selectors read build-time collections. Fetch new external content
  in a loader, never from a card or browser script.
- Project categories and statuses live in `src/lib/projects/types.ts`; the shared
  collection schema validates both local and GitHub projects. Add a category's icon
  in `src/lib/projects/icons.ts` when extending the category list.
- GitHub projects belong only in `src/data/projects.ts`. Local project metadata
  belongs only in its Markdown/MDX frontmatter. Slugs must be unique across both.
- Posts use the same published-content selector for the homepage, list and routes.
  Drafts never generate pages or cards.
- Cloudflare serves prerendered pages from `dist/client`. Only `/api/health` runs
  per request. Keep new pages static unless they require request-time data.
- Pagefind's internal search assets are generated in `dist/client/pagefind` so
  they are deployed with the site. This does not change external indexing:
  individual post/project pages retain `noindex` and sitemap exclusions.
- `npm test` runs offline regression tests. `npm run build` performs type checking,
  fetches current GitHub content, builds pages and generates the search index.
  CI supplies its read-only GitHub token; configure `GITHUB_TOKEN` separately in
  Cloudflare's build environment. Runtime `.dev.vars` is not a build-token source.
