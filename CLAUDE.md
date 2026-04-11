# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Start development server
yarn build        # Build + generate sitemap (next build --turbo && next-sitemap)
yarn export       # Static export (runs after build)
yarn lint         # ESLint + TypeScript typecheck
yarn typecheck    # TypeScript only
yarn format       # ESLint with auto-fix
```

The build output goes to `dist/` (not `.next/`). Feeds (RSS/Atom/JSON) are generated at build time into `public/`.

## Code style

- Run `yarn format` after every file change to keep code conformant with the ESLint styleguide, then run `yarn test` to confirm nothing is broken.
- Do not use single-character variable names — use descriptive names even for short-lived variables (e.g., `post` not `p`, `index` not `i`).
- Never use `eslint-disable` or `eslint-disable-next-line` comments to suppress ESLint errors — fix the underlying code instead.
- Enforce required environment variables at module scope using `import { strict as assert } from "assert"` followed by `assert( !!VAR )`. This ensures the build fails immediately if a variable is missing. See `src/utils/contentfulUtils.ts` for the canonical example. Never defer these checks to function-level.
- Never use TypeScript `as` type assertions — they bypass the type checker and hide bugs. Use type guards, narrowing, or `satisfies` instead. See [why `as` is harmful](https://dev.to/alexanderop/the-problem-with-as-in-typescript-why-its-a-shortcut-we-should-avoid-2km4).

## Architecture

**Static blog site** built with Next.js (`output: "export"`), deployed to GitHub Pages. Content is managed in Contentful CMS; there is no server or database at runtime.

### Data flow

- `src/utils/contentfulUtils.ts` wraps the Contentful SDK — all CMS access goes through `getBlogPosts()`, `getBlogPost(slug)`, `getTags()`, `getAuthors()`, and `getAuthor(slug)`.
- Pages use `getStaticProps` to fetch content at build time. No client-side data fetching from Contentful.
- Search (`src/pages/search.tsx`) is fully client-side using Fuse.js — all posts are embedded in the page as props and searched in-browser.
- Spotify integration (`src/utils/spotify/`) fetches data at build time and is embedded statically.
- Feeds are generated in `src/lib/generateFeeds.ts` and called from `getStaticProps` in `src/pages/index.tsx`.

### Routing

| Route | File | Notes |
|---|---|---|
| `/` | `pages/index.tsx` | Paginated post list, tag filter, search form |
| `/search` | `pages/search.tsx` | Client-side Fuse.js search |
| `/post/[slug]` | `pages/post/[slug].tsx` | Individual blog post |
| `/page/[page]` | `pages/page/[page].tsx` | Pagination |
| `/tags/[tagId]` | `pages/tags/[tagId].tsx` | Tag-filtered listing |
| `/author/[slug]` | `pages/author/[slug].tsx` | Author profile page |

### Styling

SCSS modules in `src/styles/`. Each page/component has a corresponding `.module.scss` file. Global styles in `src/styles/globals.scss`.

### Path aliases

`@/*` maps to `src/*` — use `@/components/...`, `@/utils/...`, etc.

### Contentful type generation

TypeScript types for Contentful content models live in `src/types/contentful/`. Regenerate with:
```bash
make types
```
This first exports the full space to `contentful/export.json` (intermediate file, gitignored), then generates types with JSDoc, type guards, and response variants. Do not use `yarn cf-content-types-generator` directly — it skips the export step and produces a stripped-down format.

## Environment variables

Required (set in GitHub Actions secrets; create `.env.local` locally):

```
CONTENTFUL_SPACE_ID
CONTENTFUL_ACCESS_TOKEN
CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN
CONTENTFUL_ENVIRONMENT          # default: master
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
```
