# KeyQuest (typing) — repo notes

**At session start:** check git sync, then read **`HANDOFF.md`** for where we left off.

This program follows the **Coniker Hub conventions**: Claude does all git (sync at start, push
when done); local/private data stays on the Mac (never pushed); web apps follow the shared
WEB_APP_STANDARDS — PWA + offline service worker, single-source version, in-app **🔄 Update**
button, `© <year> Coniker Systems™ · v<version>` footer, Coniker-standard About page, and never
trap a standalone (home-screen) app with top-level navigation.

KeyQuest specifics: vanilla **static PWA**, no build step. Version is single-sourced in
`js/version.js` — bump it **and** the `?v=` query strings in `index.html`/`about.html` **and**
`CACHE_NAME` in `sw.js` together on every deploy. Lessons gate sequentially (≥1 star unlocks the
next); a locked lesson can be **tapped to unlock** it (`forceUnlocked` map in `js/app.js`).

<!-- SOURCE-POLICY:START -->
## Source of truth: GitHub (master) — managed by Claude Hub

**GitHub is the master for Typing Trainer.** Develop in the cloud (claude.ai/code, or the Claude app on iPhone) — pick this repo and the "Cloud › Claude" environment. Do NOT develop on the Mac.

On the Mac this repo is a **replica**: each session pulls from GitHub first (safe fast-forward) and the local copy is never hand-edited. If it is detached to a pointer, `git clone` to restore a local copy. Databases/data stay local regardless — GitHub holds code only.
<!-- SOURCE-POLICY:END -->

<!-- SYNC-MERGE-POLICY:START -->
## "Sync to GitHub" = merge to `main` (deploy policy)

For any Coniker app where **GitHub is the master**, "sync to GitHub" means the whole relay, not just a push: **commit → push the working branch → merge it into `main` → `main` is the single up-to-date source.** A change parked on an un-merged branch is **not "done"** — don't leave dangling branches for Joe to manage.

- **Claude tests before merging.** Runs/loads the app off the branch in the cloud and verifies the change does what was asked. Joe does not read or review code.
- **Visual/substantial changes:** Claude sends Joe a **preview screenshot** of the running branch and gets an OK before merging (he reviews a picture, not code). Trivial/docs changes merge without a preview.
- **Reversible:** any merged change that misbehaves is reverted immediately (`git revert`) — `main` returns to its prior state, so merging is never a one-way door.
- The working branch/PR stays as the audit trail + rollback point.
- **After merge:** `main` is the current source — the live app/site redeploys where applicable, and the Mac replica picks it up on its next pull.

_(Hub-wide convention — see `WEB_APP_STANDARDS.md` and the universal `CLAUDE.md` workflow in Claude Hub.)_
<!-- SYNC-MERGE-POLICY:END -->
