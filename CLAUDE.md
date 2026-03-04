# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build to /dist
npm run preview  # Preview production build locally
```

No lint or test scripts are configured.

## Stack

- **Astro 5** (static output) + **React 19** + **Tailwind CSS 3** + **MDX**
- Deployed to GitHub Pages on push to `master` via GitHub Actions

## Architecture

### Routing

File-based routing in `src/pages/`. Dynamic routes (`[slug].astro`) use `getStaticPaths()` to generate pages from Astro content collections at build time.

### Content Collections

Defined in `src/content.config.ts`. Three collections:

| Collection | Location | Format | Key fields |
|---|---|---|---|
| `posts` | `src/content/posts/` | `.md` | `title`, `date`, `original_post_url?` |
| `projects` | `src/content/projects/` | `.md`/`.mdx` | `title`, `start_date`, `featured?`, `tags?`, `collaborators?` |
| `notes` | `src/content/notes/` | `.md` | `date` (filename is also the slug, e.g. `2024-03-01.md`) |

Projects support MDX with embedded React components. The `featured` field (number) controls homepage display order.

### Layout

All pages use `BaseLayout.astro`, which wraps content with `Nav.astro` and `Footer.astro`. Accepts a `wide` prop for wider container layout.

### Data

`src/data/collaborators.json` — reference data for project collaborators referenced in project frontmatter.

`src/pages/api/timeline.json.ts` — JSON API endpoint exposing timeline data.

### Styling

Tailwind with a custom `accent` color palette (blues) and `@tailwindcss/typography` for prose/markdown rendering.
