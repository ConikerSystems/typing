# HANDOFF — resume notes for the next session
_Updated 2026-09-20 · KeyQuest (typing)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.3.2**; service-worker cache **keyquest-v16**. Single source of version:
  `js/version.js` (`window.APP_VERSION`); keep the `?v=` query strings in `index.html` +
  `about.html` and `CACHE_NAME` in `sw.js` in lockstep when bumping.
- Pushed to `github.com/ConikerSystems/typing` (origin/main). Hosted at
  `conikersystems.github.io/typing/`.
- The programs moved out of iCloud on 2026-09-20 — this repo now lives at
  **`~/claude_code/typing`**. All paths in the app are relative; nothing references the old
  `~/Documents/claude` location.

## What we did (recent sessions)
- **1.3.2 (2026-09-20) — full regression sweep + two real fixes.** A 195-check suite was run
  against the live app in a real browser (data, persistence, gating, scoring, the typing
  engine driven by real keystrokes, Word Zap, the service worker, About, responsive, console).
  Two defects found and fixed:
  - **Offline was broken on a first offline launch.** `sw.js` precaches `./js/app.js` but
    `index.html` requests `js/app.js?v=1.3.2`; `caches.match()` matches the query string, so
    the lookup missed and the old app-shell fallback answered every `<script>`/`<link>` with
    **index.html** — a styleless, dead app. Fixed with
    `caches.match(event.request, { ignoreSearch: true })`, and the app-shell fallback is now
    limited to `request.mode === 'navigate'` so an asset request fails honestly instead of
    receiving HTML. Verified with the dev server stopped: shell, CSS and all five JS files
    load, and a full lesson can be played and saved offline.
    **This class of bug returns on any release that changes the `?v=` strings — keep
    ignoreSearch.**
  - **Seven lessons asked for keys they had not taught yet** (lesson 5 used `slab`/`glad`/
    `flash` — b, g, h are not home row and are not taught until lessons 19/20; also 6, 7, 8,
    11, 18, 19). Replaced with vocabulary that stays inside each lesson's own key set. The
    suite now asserts this, so it cannot regress.
  - Level 4 (`lessons 25-32`) had dropped `;` `,` `.` `/` from its cumulative `keys` list;
    restored, so the intro's "new keys" delta stays correct and lesson text matches metadata.
  - `FINGER_MAP` gained the shifted punctuation row (`! @ # $ % ^ & * ( ) : " ?`) — the Level 4
    and final exams use `:` and `!`, and `getFingerName()` returned `''` for them.
  - Header chips and About-page chips raised to a 44px touch target (were 35-37px).
- **1.3.1 (2026-09-15) — Update button + SW brought to the Hub standard** (ported from Axis):
  `updateApp()` in `js/app.js` fetches `js/version.js?u=…` with `cache:'no-store'`, shows
  "✅ UP TO DATE — vX" or "UPDATING TO vY…", and when newer **unregisters** all SW registrations
  (was `r.update()`, not enough on iPad), deletes caches, then `location.replace`. `sw.js` fetch
  uses `{cache:'no-store'}`, precache uses `new Request(u, {cache:'reload'})`. `?v=` strings
  bumped to 1.3.1. `.gitignore` gained the Hub sensitive-files block. Verified in a local
  browser (SW registered manually, since the app skips it on localhost); not yet on a real iPad.
- **NEW: Word Zap arcade game** (v1.3.0) — typing.com-style engagement layer. Words fall from
  the top of a playfield; type them to zap them before they hit the ground. 3 landed words =
  game over. All in **`js/game.js`**:
  - Word pool built ONLY from keys the player has unlocked (`getZapKeys()`: lesson 1's F/J as
    the floor + keys of every lesson with ≥1 star). Early lessons get generated F/J drill
    combos; real kid-friendly words (from `ZAP_WORDS`) appear once the home row unlocks.
  - First-letter targeting (locks the lowest matching word), green matched-prefix, gold target
    glow, streak multiplier (×2 at 5, ×3 at 10), level-up every 8 words (faster falls + spawn),
    pop/particle/score-popup animations, laser/life-lost/level-up synth sounds.
  - Wrong key = buzz + shake only (no life lost, target kept) — kind to a kid.
  - High score per profile in `progress.games.wordzap` (`{highScore, highLevel, plays}`);
    **`loadProgress()` in app.js whitelists fields — `games` was added there** (any future
    progress field must be added to that whitelist or it silently drops on next save).
  - Home screen: "🎮 Game Zone" section at top (`renderGameZone()` in app.js) with the Word Zap
    tile + best-score badge. New `#view-game` in index.html (added to the `views` map).
  - Auto-pauses on `visibilitychange` (iPad app switch); Esc pauses; own keydown listener gated
    on `state.view === 'game'` so the lesson engine is untouched.
  - Gotcha: the existing `shake`/pop keyframes animate `transform`, which clobbers the falling
    words' `translateY` — words get frozen via `top` before pop/land animations, and misses use
    a dedicated `zap-shake` (margin-based).
- Reviewed vs. piano-app standards: Share, About page, profiles, footer, Update button, offline
  SW were **already present and conformant** — no changes needed there.
- About page: added a "⚡ Word Zap Game" tile to What's Inside; regenerated `keyquest-about.pdf`.
- (Earlier) Coniker web-app standard, tap-to-unlock, About PDF download, About scroll fix.

## Unfinished / in progress
- None blocking.

## Next steps (ideas from the typing.com comparison, not yet requested)
- Streak + daily-goal habit loop (port piano's `stats.js` pattern).
- Achievement badges; standalone 1-minute typing test; problem-key drills; placement test.
- Axis & Allies still needs the web-app-standard treatment (separate program, Vite/React).

## How to run / test
- **There is no committed test suite.** The 2026-09-20 regression suite was built in a session
  scratchpad and driven through the browser console against the running app (it exercises the
  real globals: `LESSONS`, `loadProgress`, `isLessonUnlocked`, `calculateStars`, `getZapKeys`,
  `handleKeyDown` via synthetic `KeyboardEvent`s, and the service worker). Worth committing as
  `tests/` next time rather than rebuilding it.
- **Testing the service worker on localhost does not work by default:** `registerServiceWorker()`
  in `js/app.js` deliberately unregisters the worker and deletes all caches on localhost. To test
  offline, register `./sw.js` by hand from the console (use a unique `?fresh=` query so the
  browser runs a real install), let it precache, then stop the server and reload.
- Serve locally from `typing/`: `python3 -m http.server 8820 --directory .` → open
  `http://localhost:8820/`. The service worker is intentionally disabled on localhost.
- Or use the Claude Code preview config **`keyquest`** in `.claude/launch.json` for
  eval/screenshotting.
- Word Zap quick test: create/pick a player → tap the Game Zone tile → Play. Fresh player gets
  F/J drill words; complete lessons 2–5 and real words (sad, ask, dads…) appear.
