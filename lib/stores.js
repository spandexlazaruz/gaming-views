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

// These are generic storefront *search* URLs, not deep links to a specific
// product page — the backend doesn't track a per-store product ID for any
// platform (IGDB's response used here only has name/date/platforms/genre/
// summary/cover, nothing store-specific), so a search-by-title is the only
// honest option without a much bigger backend change. Matches this app's
// existing "does what it says, nothing more" approach (see Send Feedback,
// Steam/Xbox "Coming Soon" — both plain, no invented data).
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
