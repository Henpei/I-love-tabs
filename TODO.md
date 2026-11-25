# I Love Tabs

## Future roadmap

- [ ] Group tabs
- [ ] Search also matches URL
- [ ] User-adjustable popup themes
- [ ] Save/restore a tab session
- [ ] Search for more than one word

## v1.3+ ideas

- [ ] Onboarding: open a welcome page on `runtime.onInstalled` that
      explains features and offers the previews opt-in there instead of
      the mid-session enable flow (cleaner UX)
- [ ] Style `enable-previews.html` so the permission flow feels
      intentional, not like a random empty page
- [ ] Screenshots via optional host permissions (v2)

## Known issues

- [ ] Play/pause toggle (♪ button) unreponsive — needs debugging
- [ ] Mute button unreliable (popup context dies mid-tabs.update?)

## Technical notes

- The previews permission flow must run in a real tab
  (`enable-previews.html`): Firefox closes the popup when the
  permission doorhanger opens.
- Pause/play and mute use `browser.tabs.executeScript` / `tabs.update`
  from the popup; the background script exists to survive popup
  closure. Known issues above are suspected popup-lifetime bugs.
