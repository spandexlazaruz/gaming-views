import * as Sentry from '@sentry/react-native';
import * as Localization from 'expo-localization';

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

// ADDED 2026-08-19: region-aware "View in Store" links, per Dan's request —
// tapping "View in Store" was always sending everyone to the US storefront
// regardless of where they actually are, e.g. a UK-based user landing on
// store.playstation.com/en-us instead of /en-gb. Only PlayStation and Xbox
// actually have a confirmed, live, region-in-the-URL storefront pattern
// (`en-{region}`), confirmed via direct fetches. Steam's region/currency is
// IP/account-driven server-side — there's no reliable URL parameter for it
// (`?cc=gb` was tested and found unreliable) — so Steam links are
// deliberately left unchanged everywhere below. Nintendo's home/browse page
// has a confirmed regional pattern (nintendo.com/en-gb for the UK) but its
// *search* page uses a structurally different, unconfirmed format outside
// the US, so Nintendo search intentionally stays on the US pattern — see
// storeSearchUrl below.
//
// Deliberately conservative: only US and GB are in this allowlist because
// only those two were directly confirmed live during research. Anything
// else (device region CA, AU, IE, DE, ...) falls back to US rather than
// guessing an unconfirmed locale path — consistent with this file's
// established rule that every URL here must be one that's actually been hit
// and confirmed to load, not just "looks right" (see STORE_HOME_URL's
// history above). Auto-detect only, no manual override — Dan's call.
const SUPPORTED_REGIONS = new Set(['US', 'GB']);

function normalizeRegion(region) {
  return region && SUPPORTED_REGIONS.has(region) ? region : 'US';
}

// Reads the device's region out of expo-localization. Wrapped in a
// try/catch and defaulting to 'US' on any failure — a region mixup at worst
// sends a user to the store they were already getting before this feature
// existed, never a broken link, so this must never be able to throw and
// block the "View in Store" button.
function getDeviceRegion() {
  try {
    const locales = Localization.getLocales();
    const regionCode = locales && locales[0] && locales[0].regionCode;
    return normalizeRegion(regionCode ? regionCode.toUpperCase() : null);
  } catch (err) {
    Sentry.addBreadcrumb({
      category: 'store-link-region',
      message: `getDeviceRegion failed (${err && err.message}), defaulting to US`,
      level: 'info',
    });
    return 'US';
  }
}

// Rewrites the locale segment on an already-fetched IGDB "exact" store link
// (see resolveStoreUrl below) so it points at the user's region instead of
// whatever locale that link happened to be stored under. Only PlayStation
// and Xbox URLs are known to carry a rewritable `en-XX` path segment — Steam
// has no such segment (region is server-side, not URL-based) and IGDB never
// has Switch links at all (see storeSearchUrl's existing comment on that),
// so both are left untouched. If the URL doesn't actually contain an
// `en-XX` segment for some reason, this is a safe no-op — same
// fail-open shape as the rest of this file.
function localizeExactUrl(url, platformKey, region) {
  if (!url || (platformKey !== 'ps' && platformKey !== 'xbox')) return url;
  const r = normalizeRegion(region);
  const replacement = platformKey === 'ps' ? `en-${r.toLowerCase()}` : `en-${r}`;
  return url.replace(/en-[a-zA-Z]{2}/, replacement);
}

// Fallback when there's no exact store link for a game/platform — a generic
// storefront *search* URL, not a deep link to a specific product page. Used
// whenever the backend's storeLinks (built from IGDB's external_games data,
// see gaming-views-backend/api/games.js) doesn't have an entry for that
// platform — either because IGDB never tracked it (true for Nintendo eShop
// on every game — no such category exists in IGDB's data) or because this
// specific game just doesn't have a store listing yet (common for games in
// this app, since it only shows releases that haven't happened yet — store
// pages often don't exist until much closer to release).
//
// FIXED 2026-08-18: the PlayStation case was pointed at www.playstation.com
// (Sony's general marketing site) instead of store.playstation.com (the
// actual storefront domain) — confirmed the real root cause of Dan's first
// round of 404 reports, via real Sentry diagnostic data.
//
// FIXED AGAIN 2026-08-18 (later): the Xbox case (`/games/store/search?q=`)
// was never confirmed against a real xbox.com URL either — turned out not
// to be a real endpoint. Xbox's actual site search lives at
// `/en-us/generalsearchresults` (confirmed live via direct fetch — found by
// searching for real indexed xbox.com search-result URLs, since Xbox's own
// site doesn't document this anywhere). The exact query parameter name
// isn't confirmed (`q` is a best-effort guess, matching the convention used
// by every other platform here) — but this is still strictly safer than
// before, since it's a real page either way, and the live-check + store-home
// fallback below now also point at a *confirmed* real page instead of
// another guess (see STORE_HOME_URL's note).
// ADDED 2026-08-19: `region` param for region-aware links (see the block
// above STORE_LABELS for the full rationale). Defaults to 'US' so any
// existing caller that doesn't pass a region keeps today's behavior exactly.
export function storeSearchUrl(platformKey, title, region = 'US') {
  const q = encodeURIComponent(title);
  const r = normalizeRegion(region);
  switch (platformKey) {
    case 'pc':
      return `https://store.steampowered.com/search/?term=${q}`;
    case 'xbox':
      return `https://www.xbox.com/en-${r.toLowerCase()}/generalsearchresults?q=${q}`;
    case 'ps':
      return `https://store.playstation.com/en-${r.toLowerCase()}/search/${q}/`;
    case 'switch':
      // Nintendo's non-US search page uses a structurally different,
      // unconfirmed format (unlike the US `?q=` query-string search) — not
      // safe to guess, so search always uses the US pattern regardless of
      // region. Only the store home/browse fallback is region-aware for
      // Nintendo (see STORE_HOME_URL / storeHomeUrl below).
      return `https://www.nintendo.com/us/search/?q=${q}`;
    default:
      return null;
  }
}

// Guaranteed-safe last resort per platform — each storefront's own home/
// browse page. Added 2026-08-18 alongside the PlayStation domain fix, on
// the theory that a "safe" fallback URL could itself be wrong. Turned out
// to be right to worry about that: the *first* version of this map used
// `https://www.xbox.com/en-US/games/store` for Xbox — never actually
// verified, and apparently not a real page either, which is why Dan still
// saw "page cannot be found" even after that first round of fixes. Fixed
// 2026-08-18 (later): swapped it for `/games/browse`, confirmed live via a
// direct fetch this time rather than assumed. Lesson applied here going
// forward — every URL in this file should be one that's actually been
// hit and confirmed to load, not just "looks right." (Turned into the
// region-aware storeHomeUrl() function below on 2026-08-19 — see that
// function's own comment.)
// Nintendo's regional home pages don't follow the same simple `en-{region}`
// template as PlayStation/Xbox — the US page is `/us/store/` while the UK
// page (confirmed live) is `/en-gb/`, a differently-shaped path, not just a
// different locale segment on the same path. Only US and GB are ever looked
// up here (see SUPPORTED_REGIONS above), so this small table is enough.
const NINTENDO_HOME_BY_REGION = {
  US: 'https://www.nintendo.com/us/store/',
  GB: 'https://www.nintendo.com/en-gb/',
};

// ADDED 2026-08-19: turned from a static object into a region-aware
// function (see the block above STORE_LABELS for the full rationale).
// Defaults to 'US', matching the original static object's values exactly.
function storeHomeUrl(platformKey, region = 'US') {
  const r = normalizeRegion(region);
  switch (platformKey) {
    case 'pc':
      return 'https://store.steampowered.com/';
    case 'xbox':
      return `https://www.xbox.com/en-${r}/games/browse`;
    case 'ps':
      return `https://store.playstation.com/en-${r.toLowerCase()}`;
    case 'switch':
      return NINTENDO_HOME_BY_REGION[r] || NINTENDO_HOME_BY_REGION.US;
    default:
      return null;
  }
}

// IGDB's external_games data (see toStoreLinks() in gaming-views-backend/
// api/games.js) isn't guaranteed to stay valid — it's a community-maintained
// field with no documented revalidation, and real storefronts do things like
// swap a pre-order/placeholder product ID for a different one once a game's
// listing goes live. Confirmed in practice 2026-08-18: a game's stored
// PlayStation Store link 404'd even though the game had a real, live PS
// Store page under a different ID (same for Xbox). Rather than ever send
// someone to a dead page, do a quick live check before trusting a link — if
// it doesn't check out, fall back to the next option instead, exactly as if
// this option never existed. Used for exact IGDB links, the Xbox live-search
// result, and the generic search URL too, since that turned out not to be
// as safe an assumption as it looked (twice now).
//
// GET rather than HEAD: some storefronts reject HEAD requests outright
// (405) even though the page itself is fine, which would cause false
// fallbacks. Aborted after a few seconds so a slow/unresponsive host can't
// hang the button indefinitely. Fails OPEN (treats the link as live) on any
// error/timeout — a request that couldn't complete isn't evidence the page
// is actually broken, and worst case of failing open is the rare page that
// really was dead, which is the same risk profile as not checking at all.
//
// TEMPORARY DIAGNOSTIC (re-added 2026-08-18, later): Dan's still seeing
// Xbox 404 and PlayStation not opening the app after the first round of
// fixes. Logging the real HTTP status (or network error) again via Sentry
// so the next real tap tells us definitively whether these latest fixes
// actually resolved it, instead of guessing a third time. Safe to remove
// once confirmed clean on-device.
const LIVE_CHECK_TIMEOUT_MS = 3000;

async function checkUrlLive(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LIVE_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    Sentry.addBreadcrumb({
      category: 'store-link-check',
      message: `checkUrlLive ${url} -> HTTP ${res.status} (ok=${res.ok})`,
      level: 'info',
    });
    return res.ok;
  } catch (err) {
    Sentry.addBreadcrumb({
      category: 'store-link-check',
      message: `checkUrlLive ${url} -> network error (${err && err.message}), failing open`,
      level: 'info',
    });
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

// Xbox-only: when the cached IGDB link is missing or dead, try to find the
// game's *current* real Xbox Store page via Microsoft's own storefront
// search endpoint before giving up and falling back to a plain site search.
// Confirmed 2026-08-18: Xbox product IDs (the code in the URL, e.g.
// 9NLB6V0GNC9P) are opaque and not derivable from a title by any pattern —
// there's no way to "guess" a corrected link the way IGDB's category
// mapping already does for the platform itself. This is the same
// undocumented, unauthenticated search Microsoft's own store website uses
// (storeedgefd.dsx.mp.microsoft.com/v8.0/search) — real and reachable, but
// not officially documented or guaranteed stable, and known to be
// unreliable for fuzzy title matches even in Microsoft's own `winget` tool.
// Only trusted here on an exact (normalized) title match — a "closest
// guess" from a fuzzy search isn't good enough to confidently send someone
// to a specific game's page.
const XBOX_SEARCH_TIMEOUT_MS = 3000;

function normalizeTitle(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'game'
  );
}

// ADDED 2026-08-19: `region` param (see the block above STORE_LABELS) —
// passes the user's region as both `market` and `locale` on Microsoft's
// search endpoint, and into the resulting product URL, instead of the
// previously-hardcoded US market/locale. Defaults to 'US', unchanged from
// before.
async function findXboxProductUrl(title, region = 'US') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), XBOX_SEARCH_TIMEOUT_MS);
  try {
    const r = normalizeRegion(region);
    const q = encodeURIComponent(title);
    // FIXED 2026-09-08: this endpoint's `mediaType` param genuinely filters by
    // media type — `apps` returns zero results for real games (confirmed live:
    // a query for "The Blood of Dawnwalker" with mediaType=apps returned
    // TotalItems: 0, Cards: [], while the identical query with mediaType=games
    // returned an exact card with a real ProductId). This is the actual root
    // cause of every Xbox "View in Store" tap falling through to the generic
    // search page — Sentry showed 14/14 real Xbox taps in the last 30 days all
    // hitting `xbox-live-search-no-match`, 100% consistent with this endpoint
    // never having a chance to return a real game. Verified end-to-end: the
    // resulting https://www.xbox.com/en-GB/games/store/the-blood-of-dawnwalker/
    // 9MVWT39J9R2C URL loads the real product page, not a 404.
    const res = await fetch(
      `https://storeedgefd.dsx.mp.microsoft.com/v8.0/search?query=${q}&market=${r}&locale=en-${r}&mediaType=games&category=all&pageSize=5&skipItems=0`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cards = data && data.Payload && data.Payload.Cards;
    if (!Array.isArray(cards)) return null;

    const target = normalizeTitle(title);
    const match = cards.find((c) => c && c.Title && normalizeTitle(c.Title) === target);
    if (!match || !match.ProductId) return null;

    return `https://www.xbox.com/en-${r}/games/store/${slugify(title)}/${match.ProductId}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Picks the real, exact store link if the backend found one for this game
// and platform AND it still resolves to a real page — otherwise, for Xbox
// only, tries the live title search above — otherwise falls back to a
// generic search, itself live-checked — otherwise lands on that platform's
// store home/browse page (see storeHomeUrl above). `storeLinks` comes
// straight from the games API response — see toStoreLinks() in
// gaming-views-backend/api/games.js for how it's built. Async because of
// the network calls above; callers should show some kind of loading state
// while this resolves, since it can do a few real network round trips
// before returning (rare to hit them all in practice — each step only
// proceeds past a fast response or a 3-second timeout).
// ADDED 2026-08-19: region-aware, auto-detected from the device only (no
// manual override — Dan's explicit call) — see the block above
// STORE_LABELS for the full rationale and the SUPPORTED_REGIONS allowlist.
// Region is computed here rather than threaded in as a param, so every
// existing caller of this function (see app/game/[title].js) keeps working
// unchanged.
export async function resolveStoreUrl(platformKey, title, storeLinks) {
  const region = getDeviceRegion();
  const rawExact = storeLinks && storeLinks[platformKey];
  const exact = localizeExactUrl(rawExact, platformKey, region);
  let outcome = 'no-exact-link';
  let finalUrl;

  if (exact) {
    const isLive = await checkUrlLive(exact);
    if (isLive) {
      finalUrl = exact;
      outcome = 'used-exact-igdb-link';
    } else {
      outcome = 'exact-link-failed-live-check';
    }
  }

  if (!finalUrl && platformKey === 'xbox') {
    const found = await findXboxProductUrl(title, region);
    if (found) {
      const isLive = await checkUrlLive(found);
      if (isLive) {
        finalUrl = found;
        outcome = 'used-xbox-live-search-result';
      } else {
        outcome = 'xbox-live-search-result-failed-live-check';
      }
    } else {
      outcome = 'xbox-live-search-no-match';
    }
  }

  if (!finalUrl) {
    const search = storeSearchUrl(platformKey, title, region);
    if (search) {
      const isLive = await checkUrlLive(search);
      if (isLive) {
        finalUrl = search;
        outcome = `${outcome}-generic-search`;
      } else {
        outcome = `${outcome}-generic-search-failed-live-check`;
      }
    }
  }

  if (!finalUrl) {
    finalUrl = storeHomeUrl(platformKey, region) || null;
    outcome = `${outcome}-then-store-home`;
  }

  // TEMPORARY DIAGNOSTIC (re-added 2026-08-18, later, see checkUrlLive
  // above) — one info-level Sentry event per "View in Store" tap, so the
  // next real test tells us definitively whether this round of fixes
  // actually worked. Safe to remove once confirmed clean on-device.
  // `region` added 2026-08-19 alongside the region-aware links themselves,
  // so any future report of a wrong-storefront tap is diagnosable the same
  // way the earlier 404s were — from real Sentry data, not another guess.
  Sentry.captureMessage(`resolveStoreUrl: ${outcome}`, {
    level: 'info',
    tags: { platform: platformKey, outcome, region },
    extra: { title, exactLink: rawExact || null, localizedExactLink: exact || null, finalUrl, region },
  });

  return finalUrl;
}
