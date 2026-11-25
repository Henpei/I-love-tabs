# I Love Tabs - Future roadmap

## Ideas for the future
- Add possibility to group tabs
- Search will also look at URL.
- Create useradjustable themes for the popup.
- Possibility to save a "tab-session".
- Possibility to search for more than one word.
- Pausa YouTube via content script (kräver host permission, framtida)
- Screenshots via optional host permissions (v2)
- Previews permission flow must run in a real tab (enable-previews.html): Firefox closes the popup when the permission doorhanger opens

## v1.3+ ideas
- [ ] Onboarding: open a welcome page on runtime.onInstalled that explains features and offers the previews opt-in there instead of the mid-session enable flow (cleaner UX)
- [ ] Style enable-previews.html so the permission flow feels intentional, not like a random empty page
- [ ] Mute button unreliable (popup context dies mid-tabs.update?) — separate investigation needed
