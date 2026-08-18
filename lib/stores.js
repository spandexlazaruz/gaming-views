// Maps each platform key the app already tracks (see PLATFORMS in lib/theme.js)
// to the matching storefront. "pc" -> Steam, since that's the only PC storefront
// this app has ever referenced (see the existing "ON STEAM" price/Deck card on
// the game detail screen) — no need for a separate mapping table there.
export const STORE_LABELS = {
  ps: 'PlayStation Store',
  xbox: 'Xbox Store',
  switch: 'Nintendo eShop',
  pc: 'Steam',
};

// Fallback when there's no exact store link for a game/platform — a generic
// storefront *search* URL, not a deep link to a specific product page. Used
// whenever the backend's storeLinks (built from IGDB's external_games data,
// see gaming-views-backend/api/games.js) doesn't have an entry for that
// platform — either because IGDB never tracked it (true for Nintendo eShop
// on every game — no such category exists in IGDB's data) or because this
// specific game just doesn't have a store listing yet (common for games in
// this app, since it only shows releases that haven't happened yet — store
// pages often don't exist until much closer to release).
export function storeSearchUrl(platformKey, title) {
  const q = encodeURIComponent(title);
  switch (platformKey) {
    case 'pc':
      return `https://store.steampowered.com/search/?term=${q}`;
    case 'xbox':
      return `https://www.xbox.com/en-US/games/store/search?q=${q}`;
    case 'ps':
      return `https://www.playstation.com/en-us/search/${q}/`;
    case 'switch':
      return `https://www.nintendo.com/us/search/?q=${q}`;
    default:
      return null;
  }
}

// Picks the real, exact store link if the backend found one for this game
// and platform, otherwise falls back to a plain search. `storeLinks` comes
// straight from the games API response — see toStoreLinks() in
// gaming-views-backend/api/games.js for how it's built.
export function resolveStoreUrl(platformKey, title, storeLinks) {
  const exact = storeLinks && storeLinks[platformKey];
  return exact || storeSearchUrl(platformKey, title);
}
