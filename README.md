# Gaming Views (Expo)

## Run it

1. Unzip this folder somewhere on your computer.
2. Open a terminal inside the folder.
3. Run:
   ```
   npm install
   npx expo start
   ```
4. A QR code appears in the terminal.
   - **iPhone**: open the Camera app and point it at the QR code, then tap the notification.
   - **Android**: open the Expo Go app and use its built-in scanner.
5. The app opens live on your phone.

## What's in this build (v1 core)

- Calendar tab: hero spotlight, platform filters, release list grouped by month
- Watchlist tab: your saved games, with an empty state
- Tap any game to see its detail page
- Watchlist state is shared across the whole app (add from a card, the list, or the detail screen — it stays in sync everywhere)

## Not in this build yet

Search, Settings, Steam integration, onboarding, and notifications — these were mocked in the browser prototype and will be ported into this project next now that the foundation is running.

## Data

`lib/games.js` is a fixed list of ~50 real, researched upcoming 2026 titles, ported directly from the prototype. It doesn't update on its own — connecting it to a live source (e.g. IGDB) is a later step that needs a small backend to hold API credentials safely.
