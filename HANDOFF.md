# HANDOFF — resume notes for the next session
_Updated 2026-07-06 · KeyQuest (typing) · local (Mac)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.3.0**; service-worker cache **keyquest-v14**. Single source of version:
  `js/version.js` (`window.APP_VERSION`); keep the `?v=` query strings in `index.html` +
  `about.html` and `CACHE_NAME` in `sw.js` in lockstep when bumping.
- Pushed to `github.com/ConikerSystems/typing` (origin/main). Hosted at
  `conikersystems.github.io/typing/`.

## What we did (recent sessions)
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
- Serve locally from `typing/`: `python3 -m http.server 8820 --directory .` → open
  `http://localhost:8820/`. The service worker is intentionally disabled on localhost.
- Or use the Claude Code preview config **`keyquest`** in `.claude/launch.json` for
  eval/screenshotting.
- Word Zap quick test: create/pick a player → tap the Game Zone tile → Play. Fresh player gets
  F/J drill words; complete lessons 2–5 and real words (sad, ask, dads…) appear.
