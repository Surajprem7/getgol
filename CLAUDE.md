# Gol! — Project Instructions

FIFA World Cup 2026 fan web app for Indian supporters. Live at **getgol.in**.
Repo: `Surajprem7/getgol`. A free, no-login Progressive Web App. Built as a
weekend hobby project.

---

## Tech stack

- **Vanilla JS** SPA — no frameworks, no build step. Inline styles throughout.
- **PWA** — service worker (`sw.js`), `manifest.json`, installable.
- **Firebase Realtime Database** — live data cache + community predictions, anonymous auth.
- **Glassmorphism dark UI** — gold accent `#f0a500`, team-color theming.
- Deploy = push to `main` (static hosting serves the repo at getgol.in).

## File map

| File | Purpose |
|---|---|
| `index.html` | Shell, SEO meta/JSON-LD, `<noscript>` SEO content, script loading |
| `js/firebase.js` | Firebase init, anon auth, `savePrediction`, `getPredictionCounts` |
| `js/matches.js` | `MATCHES` array (72 group matches), `getTeamMatches`, `formatIST` |
| `js/live.js` | ESPN fetch + Firebase sync, `window.LIVE` cache, score/standings/rankings |
| `js/notifications.js` | Tier 1 local match notifications (kickoff/goal/FT) + bell + banner |
| `js/poster.js` | Shareable 9:16 result poster (Canvas) + Web Share |
| `js/matchdetail.js` | Expandable match detail: line-ups/formation, stats, summary, player photos |
| `js/app.js` | Main app — tabs, rendering, team picker, timeline, rankings, watch, knockout bracket |
| `js/selfcheck.js` | Runtime self-check (loaded last, sanity-checks app boot) |
| `js/install.js` | "Add to Home Screen" install prompt for the PWA |
| `sw.js` | Service worker (network-first, precache). Bump `CACHE` version on JS changes — auto-bumped weekly by a GitHub Action (`chore: bump service worker cache` commits from `github-actions[bot]`). |
| `database.rules.json` | Firebase security rules (reference copy — **edit this file directly now**, it mirrors what's live in the Firebase console) |
| `scripts/update-rankings.mjs` | GitHub Action script: FIFA rankings → Firebase |
| `.github/workflows/update-rankings.yml` | Weekly cron for the rankings sync |

Empty/unused: `js/chat.js`, `js/predictions.js`, `js/share.js` (dead — safe to delete).
Script load order in `index.html`: firebase(CDN×3) → firebase.js → matches → notifications → live → poster → matchdetail → app → selfcheck → install.

## Data sources / APIs (all free)

- **ESPN public API** (no key) — scores, standings, match summary (line-ups, stats, events).
  - Scoreboard: `site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD-YYYYMMDD`
  - Standings: `.../apis/v2/sports/soccer/fifa.world/standings?season=2026`
  - Summary: `.../apis/site/v2/sports/soccer/fifa.world/summary?event={id}`
  - Status: ESPN soccer uses `status.type.state` (`pre`/`in`/`post`) — normalized to `'SCHEDULED'`/`'LIVE'`/`'FT'`. Do NOT rely on `status.type.name`.
- **FIFA official rankings** — scraped server-side by the GitHub Action (CORS-blocked in browser).
- **flagcdn.com** — country flags (CORS-friendly, canvas-safe).
- **Wikimedia Commons** (Wikipedia pageimages API) — player photos on the **poster** (CORS-safe → canvas-exportable). Mostly CC/CC0/CC-BY-SA.
- **TheSportsDB** (free dev key `3`) — player cutouts for **line-up display** (not canvas — fails CORS). Squad endpoint + per-player fallback, cached.

## Firebase structure (`wc2026` + predictions)

- `wc2026/scores/{matchId}` — `{home, away, status, clock, espnId}` (granular per-match paths; merge-on-read so partial syncs never wipe results).
- `wc2026/standings`, `wc2026/_updated`
- `wc2026/rankings`, `wc2026/rankingsMeta` — written ONLY by the GitHub Action (service account bypasses rules; client writes blocked).
- `predictions/{matchId}/{pick}` — community vote counts (transaction increment).
- `userPredictions/{uid}/{matchId}` — user's own pick.
- `lineups` — reserved, read-only to clients, no writer yet (placeholder for a future feature).
- `presence/{uid}` — reserved, boolean per-user, self-write only (placeholder, not yet used by app code).
- `stats/totalUsers` — reserved, signed-in write, numeric counter (placeholder, not yet used by app code).

**Security:** rules are locked down (was `.read/.write: true`), applied directly in the Firebase console and mirrored in `database.rules.json`. Public reads; signed-in validated writes; rankings client-locked. The `lineups`/`presence`/`stats` nodes exist in the rules ahead of any code using them — fine to build into later without a rules change.

## Features built

- **Tabs:** Matches, Groups (standings), Rankings (FIFA, auto-updated), Watch (broadcasters).
- **Guest access** — no login; optional team selection via slide-up picker ("Maybe later" to skip).
- **Live scores** — auto-refresh 45s (live) / 5min (idle), synced via Firebase to all users.
- **"Your fixtures"** — selected team's matches pinned atop Matches (2-line mobile layout: date·time / matchup / group).
- **Vertical scroll timeline** — date-based ruler on Matches; tap a date to jump.
- **Inline predictions** — per match card, community vote %.
- **Match detail** (tap a card) — line-ups on a formation pitch with player photos, stats bars, goals/cards/subs timeline.
- **Shareable result poster** — 9:16 pitch-style Canvas image with flags, score, scorers (+ Wikimedia photos), getgol.in footer; Web Share / download.
- **Notifications (Tier 1)** — local browser alerts for kickoff/goal/FT while app is open. Bell toggle + dismissible banner.
- **Knockout bracket** — event-driven rebuild from ESPN only when a match newly finishes; provisional re-render from cache otherwise (`rebuildKnockoutFromLive`/`renderKnockoutFromLive` in `live.js`).
- **Auto FIFA rankings** — weekly GitHub Action (Mon 06:00 UTC) → Firebase. Needs `FIREBASE_SERVICE_ACCOUNT` repo secret (already configured).
- **Install prompt** — "Add to Home Screen" PWA install banner (`js/install.js`).
- **SEO/PWA** — meta, Open Graph (`icons/icon-512.png`), Twitter card, JSON-LD, sitemap, robots, service worker.

## Conventions

- Team names use app spellings: `USA`, `South Korea`, `Czechia`, `Bosnia`, `Ivory Coast`, `DR Congo`, `Curacao`, `Turkey`, `Cape Verde`. ESPN/FIFA names normalized via maps in `live.js` (`normName`) and `scripts/update-rankings.mjs`.
- Score DOM elements use `data-vs`/`data-vs-style` attributes (NOT unique ids) so a match can render in two places without id collisions.
- Bump `sw.js` `CACHE` version when changing precached JS.
- Verify changes with the preview server (`.claude/launch.json` → `npx http-server`) before pushing. Screenshots may time out due to live polling / external images — use `preview_eval` pixel/DOM checks instead.
- End commits with the Co-Authored-By trailer.

---

## WHERE WE LEFT OFF (current state, 2026-06-20)

Everything above is **built, verified, and live on `main`**. The audit fixed a misnamed PWA/social icon, and Firebase rules were locked down (applied in console, mirrored in `database.rules.json`, verified working — public reads, validated signed-in writes, rankings client-locked). A weekly GitHub Action also auto-bumps the `sw.js` cache version.

### Open discussion — banner/player imagery (no decision yet, paused mid-stream)
How to make poster/banner visuals look as premium as the player-photo posters seen on Etsy/wallpaper apps, **without legal exposure**:
- **AI-generating real players is NOT safe** — likeness/publicity rights still apply, plus accuracy issues at squad scale.
- **Most poster/wallpaper sites using player faces are unlicensed** — tolerated via selective enforcement, not actually legal. Risk for getgol.in is low-but-nonzero (public, on LinkedIn, owner's name attached).
- **Agreed-safe direction:** generic AI/vector **backgrounds** (stadium atmosphere, lights, trophy/ball — no real people/logos) + flags + the free Wikimedia/TheSportsDB player photos already wired in.
- **Still owed to the user:** (1) a "premium-but-clean" stadium-atmosphere background mockup for the poster/banner — asked to see it, not yet shown; (2) a short list of disclaimer wording options for if/when player imagery is used — asked, not yet answered.

### Other backlog ideas (not started)
- Head-to-head tab in match detail (data already in ESPN summary).
- Tier 2 push notifications (FCM, works when app closed — needs Firebase Blaze plan).
- Cleanup: delete dead code (`browseRankings`, `getTeamMatches`) + empty files (`js/chat.js`, `js/predictions.js`, `js/share.js`); cap photo lookups to starters; de-duplicate team-color maps.
- Build out the reserved-but-unused `lineups`/`presence`/`stats` Firebase paths if those features get picked up.
