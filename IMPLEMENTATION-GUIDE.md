# Implementing the search-crash fix — step by step

Goal: get the `expo-image` fix into a real build so you can record the Apple screen captures. Follow these in order; each step tells you how to check it worked before moving to the next.

---

## 0. Before you start

- Make sure you're on a clean working copy — run `git status` in your `gaming-views` project folder. If it says "nothing to commit, working tree clean," you're good. If not, either commit or stash whatever's outstanding first, so it's easy to tell what's from this fix and what isn't.
- Work on a new branch rather than directly on `main`, so you can back out cleanly if anything looks wrong:
  ```
  git checkout -b fix/search-crash
  ```

---

## 1. Replace the four code files

Copy each attached file into the project, overwriting what's there, at these exact paths (relative to your project root):

| Attached file | Goes to |
|---|---|
| `GameCard.js` | `components/GameCard.js` |
| `search.js` | `app/search.js` |
| `tabs-index.js` | `app/(tabs)/index.js` |
| `tabs-watchlist.js` | `app/(tabs)/watchlist.js` |

Don't use the `package.json` I sent for this — see step 2, there's a safer way to do that part.

---

## 2. Add the expo-image dependency

Don't hand-edit `package.json` — run this instead, from the project root:

```
npx expo install expo-image
```

This is Expo's own tool for adding a dependency at the exact version your installed Expo SDK expects (in your case `~3.0.11`), so you don't end up with a mismatched version. It'll update `package.json` and `package-lock.json` (or `yarn.lock`) and install the package.

**Check it worked:** open `package.json` and confirm you see a line like `"expo-image": "~3.0.11"` in the dependencies. If the command instead errors out or can't reach the network, fall back to:
```
npm install expo-image@~3.0.11
```

---

## 3. Sanity-check locally before building

```
npx expo start
```

Open the app in Expo Go on your phone or a simulator (Expo Go includes `expo-image` already, so this will work without a custom build). Check:
- Cover images still load and look right on Calendar, Search, and Watchlist.
- Scroll a long list (Calendar with no filter, or search "a") reasonably fast — this is the exact condition that triggered the original crash, so it's worth specifically trying to reproduce that stress rather than just a gentle scroll.
- Type quickly in Search, backspacing and retyping a few times — that's the fastest way to trigger the list-churn that caused the crash originally.

If anything looks visually different (spacing, missing images, a broken layout) stop here and send me a screenshot before continuing — better to catch it now than after a build.

---

## 4. Build for real

Expo Go can run the JS fine, but **the actual crash fix only exists in a real native build** (Expo Go bundles its own copy of native modules, so it's a good visual smoke test but not proof the fix works). Since you already have EAS set up from Build 4:

```
eas build --platform ios
```

If you also want this in the next Android build, add `--platform android` (or run it separately) — but only if you're ready to also push a new Android build right now; not required for the Apple resubmission specifically.

Wait for the build to finish (EAS will give you a link to track it).

---

## 5. Install and test the real build

Once the build finishes, install it on your device (via TestFlight if that's your usual path, or `eas build:run` for a quicker local install). Repeat the same stress test from step 3 — fast search typing, fast scrolling on Calendar — on the actual build this time, since that's what proves the native fix is really in effect.

Give it a few minutes of normal use too, then check Sentry — if nothing new shows up matching the old `EXC_BAD_ACCESS`/`nativeImageResponseProgress` signature, that's your confirmation.

---

## 6. Record the Apple screen captures

Once you're confident the build is stable, this is the point to do the screen recording Apple asked for (Control Center → Screen Recording, as covered earlier).

---

## 7. Push to git

Once you're happy with it:
```
git add components/GameCard.js app/search.js "app/(tabs)/index.js" "app/(tabs)/watchlist.js" package.json package-lock.json
git commit -m "Fix production crash: use expo-image for card covers, restore removeClippedSubviews"
git push -u origin fix/search-crash
```
Then merge that branch into `main` (via a PR if that's your habit, or directly — your call).

---

## If something goes wrong

- **Build fails referencing expo-image / native module errors:** most likely a stale `node_modules`. Try `rm -rf node_modules && npm install` and rebuild.
- **You want to back out entirely:** since you did this on a branch, your `main` branch is untouched — just `git checkout main` and delete the `fix/search-crash` branch. Nothing is lost.
- **Something's visually broken but you're not sure why:** send me a screenshot — the change is small and contained to one component, so it should be quick to spot.

---

## Optional — worth considering while you're already rebuilding

You still have fix log **item 1** (the Android tab-bar/safe-area fix) sitting written-but-unpushed from earlier this session. Since you're doing a rebuild for this crash fix anyway, it's a good moment to fold that one in too rather than paying for a second rebuild later — but only if you want to; it's not required for the Apple resubmission and I don't want to complicate this specific fix. Your call.
