# GOL! — Project Workflow & Journey

> Full story of how Gol! (getgol.in) was built — every decision, system, method tried, error hit, and how it was solved. Living document, updated as we go.

---

## What is Gol!

A free, no-login Progressive Web App (PWA) for Indian football fans to follow FIFA World Cup 2026. Built as a weekend hobby project. Live at **getgol.in**.

- **Repo:** github.com/Surajprem7/getgol
- **Deploy:** Push to `main` branch = live instantly
- **Stack:** Vanilla JS, Firebase Realtime Database, ESPN public API, GitHub Actions

---

## Tech Stack — Why We Chose Each

| Tool | Why |
|---|---|
| Vanilla JS (no framework) | No build step, fast, simple to deploy as static site |
| Firebase Realtime Database | Free tier, real-time sync to all users, anonymous auth |
| ESPN public API | Completely free, no API key, covers scores/standings/lineups |
| GitHub Actions | Free CI/CD, runs server-side data sync on schedule |
| Cloudflare (domain) | DNS for getgol.in |
| flagcdn.com | Free, CORS-friendly country flags |
| Wikimedia Commons | Free player photos for match poster (CORS-safe, canvas-exportable) |
| TheSportsDB | Free dev key, player cutout images for lineup display |
| PWA / Service Worker | Installable on phone, works offline, no app store needed |

---

## Systems & Connections

### Firebase Structure
```
wc2026/
  scores/{matchId}     — live scores per match (home, away, status, clock, espnId)
  standings/           — group standings A–L
  rankings/            — FIFA rankings (Elo-calculated, 48 WC teams)
  rankingsCalcMeta/    — tracks which matches have been Elo-processed
  rankingsMeta/        — source info, last updated timestamp
  schedule/            — IST date/time per match
  _updated             — last sync timestamp

lineups/{matchId}      — ESPN match summary (rosters, stats, keyEvents)

predictions/{matchId}/{pick}     — community vote counts
userPredictions/{uid}/{matchId}  — per-user pick

presence/{uid}         — reserved (not yet used)
stats/totalUsers       — reserved (not yet used)
```

### GitHub Actions (Automated Jobs)
| Workflow | Schedule | What it does |
|---|---|---|
| `sync-live-data.yml` | Every 10 min (actually ~hourly, GitHub throttles free tier) | Fetches ESPN scores + standings + lineups → writes to Firebase. Also runs Elo ranking calculation after each FT match |
| `update-rankings.yml` | Every Monday 06:00 UTC | Previously scraped FIFA rankings. Now a no-op — rankings handled by Elo in sync script |
| `bump-sw-cache.yml` | Weekly (auto) | Bumps service worker cache version so users get fresh files |

### Script Load Order (index.html)
```
Firebase CDN (×3) → firebase.js → matches.js → notifications.js → live.js
→ poster.js → matchdetail.js → app.js → selfcheck.js → install.js
```

---

## Features Built — Chronological

### Foundation
- Vanilla JS SPA with tab navigation (Matches, Groups, Knockout, Rankings, Watch, Stats)
- Firebase anonymous auth + Realtime Database connection
- PWA setup — manifest.json, service worker (sw.js), installable
- SEO — meta tags, Open Graph, JSON-LD structured data, sitemap, robots.txt

### Match Data
- `MATCHES` array in `js/matches.js` — all 72 group stage fixtures (single source of truth)
- ESPN scoreboard fetch in `js/live.js` — live scores, auto-refresh 45s (live) / 5min (idle)
- Firebase sync via GitHub Actions — server-side ESPN fetch so all users share one data source instead of every browser hitting ESPN

### Live Scores & Standings
- Real-time score cards per match
- Group standings table (A–L) from ESPN
- Status normalized: ESPN `status.type.state` → `SCHEDULED` / `LIVE` / `FT`
- Team name normalization map (`normName`) — handles ESPN vs our app name mismatches

### Your Fixtures
- Team picker (slide-up modal, "Maybe later" to skip)
- Selected team's matches pinned at top of Matches tab
- 2-line mobile layout: date·time / matchup / group

### Match Detail
- Tap any match card → expandable detail panel
- Line-ups on a formation pitch with player photos (TheSportsDB)
- Match stats bars (possession, shots, corners etc.)
- Goals/cards/subs timeline (keyEvents from ESPN summary)
- Cached in Firebase `lineups/` node

### Predictions
- Per-match community vote (Home / Draw / Away)
- Firebase transaction increment (atomic, no race conditions)
- Vote % shown on each match card

### Result Poster
- 9:16 Canvas image — flags, score, scorers, player photos (Wikimedia)
- Web Share API / download button
- Player photos fetched from Wikimedia Commons (CORS-safe for canvas)

### Notifications
- Local browser alerts for kickoff / goal / FT (while app is open)
- Bell toggle + dismissible banner
- Tier 1 only — no FCM yet (app must be open)

### Rankings
- FIFA rankings tab showing all 48 WC teams
- Initially scraped from FIFA's API via GitHub Actions

### Knockout Bracket
- Event-driven rebuild from ESPN when a match newly finishes
- `rebuildKnockoutFromLive` / `renderKnockoutFromLive` in `live.js`

### Install Prompt
- "Add to Home Screen" PWA banner via `js/install.js`

### SEO & Icons
- Open Graph image (`icons/icon-512.png`)
- Twitter card
- JSON-LD structured data

### Firebase Security Rules
- Locked down from open `.read/.write: true`
- Public reads, validated signed-in writes, rankings client-locked
- Rules mirrored in `database.rules.json`

### Contact Button
- WhatsApp "Message on WhatsApp" button in Watch tab
- Links to wa.me/919995992458

### Auto-Update for All Users
- Service worker checks for updates on every app open (`reg.update()`)
- `controllerchange` event triggers auto-reload when new SW takes over
- All users get updates silently without manual refresh

---

## Problems Encountered & How We Solved Them

---

### Problem 1: Match stats/lineups stale during live matches

**What happened:** GitHub Actions `*/10` cron is throttled to ~hourly on free tier. Firebase lineup cache could be hours old during a live match.

**What we tried:** Nothing else — identified root cause directly.

**Solution:** In `js/matchdetail.js`, bypass Firebase cache when match is LIVE and cache is >2 minutes old. Go straight to ESPN instead:
```javascript
const isLive = window.LIVE && window.LIVE.score(m.id)?.status === 'LIVE';
const stale = isLive && (!stored?.syncedAt || Date.now() - stored.syncedAt > 120000);
if (stored && stored.rosters && stored.rosters.length && !stale) { ... }
```

---

### Problem 2: FIFA Rankings showing Sep 2025 data (Spain #1, should be Argentina #1)

**What happened:** Our weekly GitHub Action was scraping FIFA's old API format (`id14xxx`) which only had data up to Sep 2025. FIFA released a new API format (`FRS_Male_Football_YYYYMMDD`) with 2026 data but it's protected by Akamai bot detection.

**Methods tried:**

#### Method 1: Direct fetch from GitHub Actions
- Fetched `inside.fifa.com/api/ranking-overview?dateId=FRS_Male_Football_20260401`
- **Result:** `{"rankings":[]}` — Akamai blocks all Azure/GitHub cloud IPs

#### Method 2: Puppeteer + stealth plugin in GitHub Actions
- Used headless Chrome with `puppeteer-extra-plugin-stealth`
- Two-step navigation: load FIFA page first (to get Akamai cookies), then navigate to API URL
- **Error:** ESM/CJS interop issue — `import puppeteerExtra` silently failed to apply stealth plugin
- **Fix for error:** Used `createRequire` from Node.js to load puppeteer-extra as CommonJS
- **Final result:** Still `{"rankings":[]}` — Akamai blocks by IP, not fingerprint. Stealth doesn't help.

#### Method 3: Cloudflare Worker as proxy
- Created Worker `fifa-rankings-proxy` at `surajtxglive.workers.dev`
- Worker fetches FIFA API and returns JSON with CORS headers
- **Result:** `{"rankings":[]}` — Cloudflare edge IPs are ALSO on Akamai's blocklist
- **Decision:** Deleted the Worker (no longer needed)

#### Method 4 (Final): Self-calculate using FIFA Elo formula ✅
- Use existing Firebase baseline (Sep 2025 data) as starting points
- After every WC match turns FT, apply FIFA Elo formula to both teams
- Track processed match IDs in `wc2026/rankingsCalcMeta` (no double-counting)
- Rankings auto-update within ~1 hour of each match ending via sync script

**FIFA Elo formula:**
```
K = 60 (WC match weight)
W_e = 1 / (1 + 10^(−(team_points − opponent_points) / 600))
New_Points = Old_Points + K × (W − W_e)
W = 1 (win) / 0.5 (draw) / 0 (loss)
```

**Implemented in:** `scripts/sync-live-data.mjs` → `updateEloRankings()`

---

### Problem 3: Scoreboard would stop fetching after June 28

**What happened:** `fetchScoreboardEvents()` in sync script had hardcoded date range `20260611-20260628`. After June 28 (end of group stage), it would fetch nothing — killing all score syncing during knockout rounds.

**`buildDateRange()` existed but was never called.**

**Solution:** Changed hardcoded URL to use `buildDateRange()` (dynamic: today +3 days). Now covers all knockout matches automatically.

---

### Problem 4: Elo only covered group stage matches

**What happened:** `updateEloRankings` looped through our `MATCHES` array (only 72 group stage fixtures). Knockout matches don't exist in that array (teams unknown until bracket fills).

**Solution:** Rewrote to use raw ESPN `events` array instead. Now processes ALL FT events from ESPN regardless of whether they're in MATCHES — covers Round of 32 onwards automatically.

---

### Problem 5: Users not getting app updates

**What happened:** Service worker caches old files. Users who had the app open or installed didn't see new features after a push.

**What we tried first:** Manual "bump CACHE version" — worked but required users to force-refresh (`Ctrl+Shift+R`).

**Solution:**
1. `reg.update()` — checks for new SW on every app open, not just navigation
2. `controllerchange` listener — auto-reloads all open tabs when new SW activates

```javascript
navigator.serviceWorker.register('/sw.js').then(reg => { reg.update(); });
navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
```

---

### Problem 6: Git push rejected (remote has newer commits)

**What happened:** GitHub Actions auto-bump workflow pushed a commit while we were also committing locally. Push rejected with "fetch first" error.

**Solution:** `git pull --rebase origin main && git push origin main`
This became a recurring pattern — always rebase before push.

---

## Feature Roadmap (FotMob Study — June 2026)

After a deep study of FotMob (17M users, best football app), we identified what Gol! can realistically build for free vs what costs money.

### FREE — Build These (Priority Order)

| # | Feature | Needs | Impact |
|---|---|---|---|
| 1 | **Push notifications** — goal/FT alerts when app closed | Firebase FCM (free) | ⭐⭐⭐⭐⭐ |
| 2 | **Head-to-head tab** in match detail | ESPN API (already free) | ⭐⭐⭐⭐ |
| 3 | **Live ticker upgrade** — better goals/cards UI | keyEvents already in app | ⭐⭐⭐⭐ |
| 4 | **World Cup Predictor game** — bracket picker + leaderboard | Firebase (free) | ⭐⭐⭐⭐ |
| 5 | **Live polls during matches** — Man of Match, score prediction | Firebase (free) | ⭐⭐⭐ |
| 6 | **Calendar sync** — add fixtures to Google/Apple Calendar | Web API (free) | ⭐⭐⭐ |
| 7 | **Match momentum bar** — using shots/possession from ESPN | ESPN (free) | ⭐⭐⭐ |
| 8 | **Player search** — find any player's team & stats | ESPN (free) | ⭐⭐ |

### PAID — Skip for Now

| Feature | Blocker |
|---|---|
| xG graph + shot maps | Opta/StatsBomb data — $$$$/month |
| Player heatmaps | Same |
| Player ratings | Complex model + paid data |
| Video highlights | Licensing |
| Lock screen Live Activities | Native iOS/Android app required |
| News feed | Editorial/content licensing |
| Transfer news | Data feed subscription |

---

## Current Status (June 2026)

- ✅ All 72 group stage matches covered
- ✅ Live scores syncing via Firebase
- ✅ Elo rankings calculating after each FT match
- ✅ Knockout bracket rendering
- ✅ Match detail (lineups, stats, timeline)
- ✅ Firebase security rules locked down
- ✅ Auto-update for all users on new deploy
- ✅ WhatsApp contact button
- ✅ PWA installable
- ⏳ Rankings Elo update pending (first run after code push)
- ⬜ Push notifications (FCM) — next to build
- ⬜ Head-to-head tab
- ⬜ World Cup Predictor game

---

## Lessons Learned

1. **Akamai blocks all cloud IPs** — GitHub Actions, Cloudflare Workers, AWS all blocked. Only residential IPs work. Don't waste time trying to bypass with stealth plugins.
2. **GitHub free tier throttles `*/10` cron to ~hourly** — design around this, don't rely on 10-min accuracy.
3. **Always use `buildDateRange()` for dynamic dates** — hardcoded date ranges break when tournaments progress.
4. **`git pull --rebase` before every push** — GitHub Actions auto-commits (sw cache bump) will always conflict otherwise.
5. **Self-calculate where possible** — FIFA Elo from existing match data beats scraping a blocked API.
6. **Service worker versioning** — bump `CACHE` version in `sw.js` on every JS change, or users get stale files.
