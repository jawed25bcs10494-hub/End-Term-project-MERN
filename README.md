# RetroGate — A Game History Archive

**GitHub repository:** [v0-retrogate-app-development-elW5wVKNlyD](https://github.com/jawed25bcs10494-hub/v0-retrogate-app-development-elW5wVKNlyD)  
**Deployment:** Add the public Vercel URL here after publishing.  
**Demo video:** Add the 3–5 minute demo URL here before submitting.

## Problem statement

Game history is spread across individual articles, platform timelines, and technical references. RetroGate gives students, players, and game-design enthusiasts one approachable place to explore how games changed over time, with a curated title for each year and context about its creators, platform, hardware, influence, and trivia.

The selection is editorial: a featured title is a curator pick, not a claim that it was objectively the only or universally best game of that year.

## What users can do

- Browse the archive from 1970 through the current year using the year slider, previous/next controls, or digit dials that jump only to years represented in the archive.
- Search entries by year, title, creator, genre, platform, or developer, then open a result directly.
- Read a game's historical impact, development and publishing credits, original platform, hardware context, and a related fact.
- Save picks and add year-specific archivist notes during the current browser session.
- View artwork only when it is attached to that game's exact Wikipedia article. The image panel links to the image's source and rights information; when the article has no image, it clearly shows a custom archive reference card rather than substituting an unrelated result.

## Target users

Students learning about the history of games and computing, retro-game enthusiasts, and designers looking for concise examples of how genres, platforms, and hardware evolved.

## Main workflows

1. **Explore a year:** change the year with the slider, year dials, previous/next controls, or the archive list; the featured entry updates to that year.
2. **Find a game:** search across the archive's descriptive fields and select a result to open its year.
3. **Build a session collection:** save and revisit curator picks from the saved-picks panel.
4. **Add a note:** attach a short memory, observation, or correction to the currently selected year. Notes are intentionally session-only; they are not represented as account data or durable storage.
5. **Inspect the image source:** the server looks up the lead image for the exact game article, fetches its available file attribution/license metadata, and caches the result. It does not search generic filenames, which helps prevent unrelated images from appearing.

## Technology stack

- Next.js 16 App Router and React 19
- TypeScript
- SWR for cached client-side artwork lookups
- Wikimedia/Wikipedia API for game-article images and available file metadata
- `next/image`, Lucide icons, and CSS design tokens
- Vercel Analytics in production

## Architecture

- `app/page.tsx` renders the museum experience.
- `components/game-history-museum.tsx` owns the year selection, search, saved-pick, and session-note workflows.
- `components/game-history-card.tsx` presents the selected game and its editorial details.
- `components/game-artwork.tsx` loads the selected game's image panel, shows attribution, and provides a clear no-image fallback.
- `app/api/game-image/route.ts` validates the requested archive year, uses that entry's curated Wikipedia article slug to find its lead image, fetches image metadata, validates image/source hosts, and returns a cached response. If no verified image is available, the route returns an empty image result and the UI displays its fallback.
- `lib/game-history.ts` contains the curated annual entries. The game-history text is project data; user notes and saved picks are in-memory session state.

There is no authentication or database because the archive is public and its current user-generated interactions are explicitly temporary. Do not enter private information into archivist notes.

## Local setup

Requirements: Node.js compatible with Next.js 16 and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. To verify a production build:

```bash
pnpm exec tsc --noEmit
pnpm run build
```

## Environment variables

No project-specific environment variables are required. The image lookup uses the public Wikimedia API and does not require an API key.

## Deployment

Deploy the repository with Vercel using the Next.js framework preset. No database migration or secret configuration is required. After deployment, add the public deployment URL to the link at the top of this README and verify it in a private browser window.

## Demo video

Record a 3–5 minute walkthrough that introduces the archive, demonstrates year navigation and search, opens a game entry, checks the image attribution/fallback, saves a pick, and adds a session note. Add the public video URL to the link at the top of this README and to the final submission form.

## Submission checklist

- [ ] Public deployment URL added and verified without sign-in
- [ ] Public demo-video URL added and verified without extra permissions
- [ ] Repository access checked in a private browser window
- [ ] Final submission form completed: https://forms.gle/sBy4sfqyiRG2Zpom9
