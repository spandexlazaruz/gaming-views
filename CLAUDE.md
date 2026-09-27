# Gaming Views (frontend) — context for Claude Code

Paid iOS/Android game-release tracker app. Expo/React Native, Expo Router. This repo is the **app**; the companion **backend** repo (Vercel serverless functions, IGDB integration) lives in the sibling folder `../gaming-views-backend`. Don't mix the two up — a recurring real mistake has been running git commands or dropping files in the wrong one.

The fuller project history — roadmap, fix log, App Store/Play Store launch checklists, past decisions — lives in a separate claude.ai Project ("Gaming Views App") that this Claude Code session doesn't have access to. If something here looks incomplete or you need launch-status context, ask Dan rather than guessing from git history alone.

## Current state (as of 2026-09-08 — verify before trusting)

- iOS: submitted to Apple, "Waiting for Review" (expedited review requested).
- Android: approved by Google, sitting in "Changes ready to publish" — deliberately held back for a simultaneous dual-store launch with iOS.
- Latest local commit at handoff: `17ab0e7c` "Post-launch update 1 batch" (bundles several fix-log items: region-aware store links, platform badge colors, trailer miniplayer fix, onboarding filter race, hero carousel tap bug, weekly-digest-when-empty bug, Xbox store-link fix). **This commit had NOT been pushed to `origin` as of handoff** — a prior session's device-bridge shell had no GitHub credentials to push with. First thing worth checking: `git log origin/main -1` vs `git log -1` to see if it's landed yet.
- Nothing from this commit (or anything recent) has been built via EAS or submitted to either store yet — that's deliberately held until both launches are live.

## The one habit that matters most: verify, don't trust

This project has been burned more than once by trusting a prior "pushed" or "fixed" claim instead of checking. Real examples: a whole feature (region-aware store links) sat uncommitted in the working tree for weeks despite being logged as "delivered"; a Sentry setup wizard silently overwrote an unrelated `app.json` plugin config. Before building on top of anything, or telling Dan something is done: check `git status`/`git diff`/`git log` yourself, don't take chat history or code comments at face value.

## Practical notes

- Native dependency versions should be checked against Expo SDK 54's actual `bundledNativeModules.json` (on the `sdk-54` branch), not `npm view <pkg> latest` — this project's SDK pins versions that differ from npm's latest.
- Any new native module (not pure JS) needs a real native rebuild (`eas build`) — it can't ship via OTA/JS-only update.
- Vercel env var changes need a fresh deploy to take effect — editing one after a deployment already ran doesn't retroactively apply.
- Windows dev environment (PowerShell) — expect Expo dev server file locks, OneDrive sync delays on brand-new files, etc.
- Production/Release EAS builds need `SENTRY_AUTH_TOKEN` set via `eas env:set` (scoped to the `production` environment) or the build fails at the last step — dev/internal builds never hit this since it's Release-only.
