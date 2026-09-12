// RENAMED from lib/calendarScrollRef.js (Phase 3E follow-up) — no longer
// Calendar-specific: TopBar is shared by both Calendar and Watchlist (see
// components/TopBar.js), and tapping the logo now scrolls whichever of
// those two screens is currently showing back to its own top — never
// navigates away (see TopBar's own comment for why the earlier
// navigate-to-Calendar behavior was removed). One ref per screen, keyed by
// route name ('index' for Calendar, 'watchlist' for Watchlist), same
// "plain module-level shared state, not a Context provider" pattern
// lib/recentSwipes.js already uses for a comparable problem — TopBar and
// each list screen are siblings in the navigation tree, not parent/child,
// so there's no direct way for TopBar to reach either screen's list ref.
const scrollRefs = {};

export function registerScrollRef(routeName, ref) {
  scrollRefs[routeName] = ref;
}

// FIXED (real on-device bug): the first approach tried for Calendar,
// scrollToLocation({ sectionIndex: 0, itemIndex: 0 }), positions section
// 0/item 0 at the scroll viewport's own top edge — not the same as the
// list's true offset 0. Confirmed against Calendar's real SectionList: it
// has a genuine ListHeaderComponent (the hero carousel + all three filter
// chip rows) rendered above section 0 as part of the same scrollable
// content, so "item [0,0] at the viewport's top" left that entire header
// scrolled out of view above it.
//
// getScrollResponder() reaches the real underlying ScrollView's own scroll
// responder — scrollTo({ y: 0 }) on that moves the actual scroll position
// to true offset 0, header content included, regardless of whether the
// list underneath is a SectionList or a FlatList (confirmed against this
// project's actual installed react-native 0.81.5 source, not assumed:
// both Libraries/Lists/SectionList.js and FlatList.js implement
// getScrollResponder() correctly, forwarding down to the real ScrollView.
// There's a second, unrelated SectionListModern.js in the same RN version
// whose getScrollResponder() is genuinely broken — missing `return`
// statements, so it always yields undefined — but react-native's own
// index.js exports SectionList from the legacy SectionList.js, so that
// bug is never actually reachable here). One scroll call covers both
// screens with no per-list-type branching needed.
export function scrollToTop(routeName) {
  const list = scrollRefs[routeName]?.current;
  if (!list) return;
  try {
    const responder = list.getScrollResponder?.();
    responder?.scrollTo({ y: 0, animated: true });
  } catch {
    // Nothing sensible to scroll (e.g. an empty list) — nothing to do.
  }
}
