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

- **Tabs:** Matches, Groups (standings), Knockout, Rankings (FIFA, auto-updated), Watch (broadcasters). Bottom nav is **text-only, no emoji**.
- **Guest access** — no login; optional team selection via slide-up picker ("Maybe later" to skip).
- **Live scores** — auto-refresh 45s (live) / 5min (idle), synced via Firebase to all users.
- **"Your fixtures"** — selected team's group-stage + KO matches sticky-pinned atop Matches tab (`position:sticky;top:56px;z-index:100`). KO fixtures pulled from `window._koData`. Renders with flags, IST date·time, round label in purple. `renderMyRow()` handles both group and KO match objects.
- **Vertical scroll timeline** — pixel-based date ruler on Matches right edge. `TL_SPACING=40px`, `TL_PAD=24px`. Container scrollable (`overflow-y:scroll;scrollbar-width:none`), `height:calc(100vh-9.5rem)`, sticky at `top:80px`. `buildTimelineNodes()` writes to `#tl-inner`. Initial load auto-scrolls to today. `updateTimelineActive()` updates bloom/fill/node colors only — no auto-scroll (removing it fixed dates at month boundaries being un-tappable).
- **Inline predictions** — per match card, community vote %.
- **Match detail** (tap a card) — line-ups on a formation pitch with player photos, stats bars, goals/cards/subs timeline. Header label: single-letter group → "Group A"; multi-word KO round → shown as-is (fixed "Group Round of 32" bug).
- **KO match detail** — `openKOMatchDetail(espnId)` in `matchdetail.js` looks up event in `window._koData`, builds a synthetic `MD.match` object, then fetches ESPN summary.
- **Shareable result poster** — 9:16 pitch-style Canvas image with flags, score, scorers (+ Wikimedia photos), getgol.in footer; Web Share / download.
- **Notifications (Tier 1)** — local browser alerts for kickoff/goal/FT while app is open. Bell toggle + dismissible banner.
- **Knockout bracket** — full card style matching group stage: 48×36 flags (or shield `🛡️` for TBD slots; current standings-leader flag at 70% opacity as hint), VS / LIVE badge / score, venue, round label in purple, "Tap for line-ups" button, prediction buttons (Home/Away only — no Draw). `fetchKnockout()` in `app.js` stores `espnId` + `venue` per event in `window._koData`. Event-driven ESPN refetch when a match ends; provisional re-render from cache otherwise (`rebuildKnockoutFromLive` / `renderKnockoutFromLive` in `live.js`). Knockout tab list view uses same `matchRow()` full card style.
- **Football pitch background** — fixed SVG (`position:fixed;inset:0;z-index:0;opacity:0.22`). Bright `#4caf50` lines on dark `#071c07` alternating turf stripes, `preserveAspectRatio="xMidYMid slice"`.
- **Flag system** — `getCountryCode(team)` in `app.js` maps all 48 WC team names to flagcdn.com ISO codes. `ESPN_NAME_MAP` in `live.js` normalizes ESPN variants (e.g. `"Côte D'Ivoire"` → `"Ivory Coast"`, `"Korea Republic"` → `"South Korea"`, `"Türkiye"` → `"Turkey"`, `"Congo, DR"` → `"DR Congo"`). All `<img>` flag tags have `onerror` hide fallback.
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

## WHERE WE LEFT OFF (current state, 2026-07-03)

Everything above is **built, verified, and live on `main`** at `gol-v72`. The tournament is into the knockout stage.

### Key implementation details to remember

**Timeline (Matches tab right side):**
- Pixel-based, not %-based. `TL_SPACING=40`, `TL_PAD=24`. Inner div `id="tl-inner"`.
- Timeline scrollable independently of page. `updateTimelineActive()` must NOT call `tlEl.scrollTo()` — only the initial render scroll is allowed. Doing otherwise breaks tapping dates near month boundaries (Jun 29, Jul 1, Jul 4).
- IST date for KO matches: `new Date(new Date(iso).getTime() + 5.5*60*60*1000).toISOString().slice(0,10)`

**KO match data shape** (from `fetchKnockout()` → `window._koData[round][]`):
```js
{ date, status, espnId, clock, venue, home: { real, code, name, score }, away: { same } }
```
- `real`: true if team is determined, false if TBD
- `code`: team name string
- `name`: display name (real team name or slot string like "W74")

**Flag helpers in app.js:**
- `getCountryCode(team)` → ISO code for flagcdn.com, covers all 48 WC teams
- In KO cards: `flagOrSlot(t, side)` — real flag → standings-leader flag at 70% opacity → shield placeholder
- `displayName(t)` — real name → standings-leader name → italic slot string

**Match detail header:**
```js
m.group.length === 1 ? 'Group ' + m.group : (m.group || '')
```
Group stage: single letter "A"–"L" → "Group A". KO: full string → shown as-is.

**Commit flow:** Always `git pull --rebase origin main` before pushing. GitHub Actions auto-bump `sw.js` can create a conflict if not rebased. Bump `CACHE` in `sw.js` (`gol-vNN`) on every JS change.

### Open discussion — banner/player imagery (no decision yet, paused)
How to make poster/banner visuals look premium without legal exposure:
- **AI-generating real players is NOT safe** — likeness/publicity rights apply.
- **Agreed-safe direction:** generic AI/vector stadium atmosphere backgrounds + flags + the free Wikimedia/TheSportsDB player photos already wired in.
- **Still owed:** (1) a premium-but-clean stadium-atmosphere background mockup for the poster — not yet shown; (2) disclaimer wording options for player imagery — not yet answered.

### Backlog (not started)
- Head-to-head tab in match detail (data already in ESPN summary).
- Tier 2 push notifications (FCM, works when app closed — needs Firebase Blaze plan).
- Cleanup: delete dead code (`browseRankings`, `getTeamMatches`) + empty files (`js/chat.js`, `js/predictions.js`, `js/share.js`); cap photo lookups to starters; de-duplicate team-color maps.
- Build out the reserved-but-unused `lineups`/`presence`/`stats` Firebase paths if those features get picked up.
