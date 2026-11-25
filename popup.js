/*
 * Mozilla Public License, v. 2.0
 * 
 * This code is licensed under the Mozilla Public License, v. 2.0.
 * You can obtain a copy of the License at:
 * https://www.mozilla.org/en-US/MPL/2.0/
 * 
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

// Inline SVG icons (14x14, fill: currentColor) for the "now playing" indicator and the mute button
const ICON_NOW_PLAYING = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
const ICON_VOLUME = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
const ICON_VOLUME_MUTED = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

// Parse an SVG template string into a DOM node (avoids innerHTML)
function createSvgIcon(svgString) {
    const parsed = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    return document.importNode(parsed.documentElement, true);
}

document.addEventListener('DOMContentLoaded', async () => {
    const tabsContainer = document.getElementById('tabs-container');
    const searchInput = document.getElementById('search-tabs');
    const enablePreviewsButton = document.getElementById('enable-previews');
    let allTabs = []; // Store all tabs here
    let previewsEnabled = false; // Whether the <all_urls> host permission is granted
    const screenshotCache = new Map(); // tabId -> dataURL, lives as long as the popup does

    // Set up a debounce function to avoid searching on every keystroke
    let debounceTimeout;
    const debounceDelay = 300; // Delay in milliseconds (e.g., 300ms after typing stops)

    // Serialize display runs so overlapping calls can't interleave (race condition guard)
    let displayQueue = Promise.resolve();

    // Returns the tabs matching the current search query
    function getFilteredTabs() {
        const query = searchInput.value.toLowerCase();
        return allTabs.filter(tab => tab.title.toLowerCase().includes(query));
    }

    // Event listener for the search bar
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            displayTabs(getFilteredTabs());
        }, debounceDelay);
    });

    // Show the "Enable previews" button only when the host permission is NOT granted
    async function updatePreviewsState() {
        previewsEnabled = await browser.permissions.contains({ origins: ['<all_urls>'] });
        enablePreviewsButton.hidden = previewsEnabled;
    }

    // Firefox closes the popup when the permission doorhanger opens, so the
    // permission request must happen in a real tab — open enable-previews.html
    // (the popup closing afterwards is fine)
    enablePreviewsButton.addEventListener('click', () => {
        browser.tabs.create({ url: browser.runtime.getURL('enable-previews.html') });
    });

    // Capture a tab screenshot; caches dataURLs and falls back to a placeholder on protected pages
    async function captureScreenshot(tabId) {
        if (screenshotCache.has(tabId)) {
            return screenshotCache.get(tabId);
        }
        try {
            const dataUrl = await browser.tabs.captureTab(tabId, { format: 'jpeg', quality: 60 });
            screenshotCache.set(tabId, dataUrl);
            return dataUrl;
        } catch {
            return 'icons/default-screenshot.png'; // Placeholder for protected pages (about:*, addons.mozilla.org, ...)
        }
    }

    // Function to display the tabs and create previews
    function displayTabs(tabs) {
        displayQueue = displayQueue.then(() => renderTabs(tabs)).catch((error) => {
            console.error('Failed to display tabs:', error);
        });
        return displayQueue;
    }

    async function renderTabs(tabs) {
        tabsContainer.innerHTML = ''; // Clear the current tabs

        for (const tab of tabs) {
            const tabPreview = document.createElement('div');
            tabPreview.className = 'tab-preview';

            // Current mute state (holding state) comes from tab.mutedInfo
            const isMuted = !!(tab.mutedInfo && tab.mutedInfo.muted);
            if (tab.audible) {
                tabPreview.classList.add('audible'); // Highlight rows that are playing sound
            }

            // Preview thumbnail on the left side of the row (only when the permission is granted)
            if (previewsEnabled) {
                const tabScreenshot = document.createElement('img');
                tabScreenshot.className = 'tab-screenshot';
                tabScreenshot.src = await captureScreenshot(tab.id);
                tabPreview.appendChild(tabScreenshot);
            }

            const tabTitle = document.createElement('div');
            tabTitle.className = 'tab-title';
            tabTitle.textContent = tab.title;

            // Create favicon image element with error handling
            const tabFavicon = document.createElement('img');
            tabFavicon.className = 'tab-favicon';
            tabFavicon.src = tab.favIconUrl || 'icons/default-favicon.png'; // Use a default favicon if not available
            tabFavicon.onerror = function () {
                if (!this.hasAttribute('data-fallback')) {
                    this.setAttribute('data-fallback', 'true');
                    this.src = 'icons/default-favicon.png'; // Fallback if favicon fails to load
                }
            };

            // Add click event to activate the tab and raise its window
            tabPreview.addEventListener('click', async () => {
                await browser.tabs.update(tab.id, { active: true });
                await browser.windows.update(tab.windowId, { focused: true });
                window.close();
            });

            // Append favicon + title to the tab preview
            tabPreview.appendChild(tabFavicon);
            tabPreview.appendChild(tabTitle);

            // "Now playing" indicator (click to pause) + mute button for tabs that are audible (or muted)
            if (tab.audible || isMuted) {
                if (tab.audible) {
                    const audibleButton = document.createElement('button');
                    audibleButton.type = 'button';
                    audibleButton.className = 'tab-audible-icon';
                    audibleButton.appendChild(createSvgIcon(ICON_NOW_PLAYING));
                    audibleButton.title = 'Now playing';
                    audibleButton.setAttribute('aria-label', 'Now playing');
                    audibleButton.addEventListener('click', async (event) => {
                        event.stopPropagation(); // Don't activate the tab when pausing
                        // Only attempt to pause when the optional host permission is granted
                        const granted = await browser.permissions.contains({ origins: ['<all_urls>'] });
                        if (!granted) return;
                        try {
                            // MV2 API: toggle play/pause on the first <video> element in the tab
                            await browser.tabs.executeScript(tab.id, {
                                code: "var v = document.querySelector('video'); if (v) { v.paused ? v.play() : v.pause(); }"
                            });
                        } catch {
                            // Silently ignore: protected pages, no video element, etc.
                        }
                    });
                    tabPreview.appendChild(audibleButton);
                }

                let muted = isMuted;
                const muteButton = document.createElement('button');
                muteButton.type = 'button';
                muteButton.className = 'tab-mute-button';
                const updateMuteButton = () => {
                    muteButton.replaceChildren(createSvgIcon(muted ? ICON_VOLUME_MUTED : ICON_VOLUME));
                    muteButton.title = muted ? 'Unmute tab' : 'Mute tab';
                    muteButton.setAttribute('aria-label', muted ? 'Unmute tab' : 'Mute tab');
                };
                updateMuteButton();
                muteButton.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Don't activate the tab when toggling mute
                    muted = !muted;
                    await browser.tabs.update(tab.id, { muted });
                    tab.mutedInfo = { muted }; // Keep holding state in sync
                    updateMuteButton();
                });
                tabPreview.appendChild(muteButton);
            }

            tabsContainer.appendChild(tabPreview);
        }
    }

    // Initial load: check permission, then load and display the tabs
    await updatePreviewsState();
    browser.tabs.query({}).then((tabs) => {
        allTabs = tabs; // Store the initial tabs
        displayTabs(getFilteredTabs());
    }).catch(error => {
        console.error('Failed to query tabs:', error);
    });
});
