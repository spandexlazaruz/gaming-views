# Gaming Views (frontend) — context for Claude Code

Paid iOS/Android game-release tracker app. Expo/React Native, Expo Router. This repo is the **app**; the companion **backend** repo (Vercel serverless functions, IGDB integration) lives in the sibling folder `../gaming-views-backend`. Don't mix the two up — a recurring real mistake has been running git commands or dropping files in the wrong one.

The fuller project history — roadmap, fix log, App Store/Play Store launch checklists, past decisions — lives in a separate claude.ai Project ("Gaming Views App") that this Claude Code session doesn't have access to. If something here looks incomplete or you need launch-status context, ask Dan rather than guessing from git history alone.

## Current state (as of 2026-10-11 — verify before trusting)

- iOS and Android are both **live in production on v0.6.0** (iOS build 43, Android versionCode 21) — the Steam wishlist auto-sync release, including the two-way sync fix (removing a game from Steam removes it from the in-app Watchlist too).
- Latest commit on `origin/main`: `ca66c96d` "Update privacy policy for live Steam linking, fix stale settings copy" — updates `docs/privacy-policy.html` (now accurately describes the live Steam linking feature instead of calling it "(Future)") and a stale Settings row. Published directly via GitHub Pages (serves `docs/` on `main`, no build step), not gated by either store.
- Still open/unconfirmed, console-only (not visible from the repo): App Privacy answers (iOS) and the Data Safety form (Play) for the Steam ID / wishlist data; whether the App Review Notes field has a paragraph covering Steam OpenID linking (relevant to Apple Guideline 4.8 — current read is it shouldn't apply, since the app has no accounts and Steam linking is an optional sync, but this hasn't been tested against a real Apple review yet).

## The one habit that matters most: verify, don't trust

This project has been burned more than once by trusting a prior "pushed" or "fixed" claim instead of checking. Real examples: a whole feature (region-aware store links) sat uncommitted in the working tree for weeks despite being logged as "delivered"; a Sentry setup wizard silently overwrote an unrelated `app.json` plugin config. Before building on top of anything, or telling Dan something is done: check `git status`/`git diff`/`git log` yourself, don't take chat history or code comments at face value.

## Practical notes

- Native dependency versions should be checked against Expo SDK 54's actual `bundledNativeModules.json` (on the `sdk-54` branch), not `npm view <pkg> latest` — this project's SDK pins versions that differ from npm's latest.
- Any new native module (not pure JS) needs a real native rebuild (`eas build`) — it can't ship via OTA/JS-only update.
- Vercel env var changes need a fresh deploy to take effect — editing one after a deployment already ran doesn't retroactively apply.
- Windows dev environment (PowerShell) — expect Expo dev server file locks, OneDrive sync delays on brand-new files, etc.
- Production/Release EAS builds need `SENTRY_AUTH_TOKEN` set via `eas env:set` (scoped to the `production` environment) or the build fails at the last step — dev/internal builds never hit this since it's Release-only.
