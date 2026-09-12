// ADDED (Phase 3E — tap logo to scroll Calendar to top): a small, deliberately
// dumb piece of shared state, same pattern lib/recentSwipes.js already uses
// for a comparable problem — two components that aren't parent/child need a
// lightweight way to talk to each other, and a full Context provider is
// overkill for something this narrow. TopBar (components/TopBar.js) is
// rendered by the Tabs navigator as Calendar's own header — a sibling in the
// navigation tree, not something that can reach Calendar's SectionList ref
// directly — so Calendar registers its ref here once, and TopBar calls this
// module's own scrollCalendarToTop() instead of needing to know anything
// about how Calendar's list is actually implemented.
let calendarListRef = null;

export function registerCalendarListRef(ref) {
  calendarListRef = ref;
}

export function scrollCalendarToTop() {
  const list = calendarListRef?.current;
  if (!list) return;
  try {
    // SectionList (not FlatList) — scrollToOffset isn't available on it;
    // scrollToLocation is the real imperative API for a sectioned list.
    list.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewOffset: 0, animated: true });
  } catch {
    // No sections to scroll to (e.g. every game currently filtered out) —
    // nothing to do, and nothing worth crashing over.
  }
}
