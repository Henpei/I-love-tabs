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


document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('tabs-container');
    const searchInput = document.getElementById('search-tabs');
    let allTabs = []; // Store all tabs here

    // Set up a debounce function to avoid searching on every keystroke
    let debounceTimeout;
    const debounceDelay = 300; // Delay in milliseconds (e.g., 300ms after typing stops)

    // Event listener for the search bar
    searchInput.addEventListener('input', (event) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const query = event.target.value.toLowerCase();
            const filteredTabs = allTabs.filter(tab => tab.title.toLowerCase().includes(query));
            displayTabs(filteredTabs);
        }, debounceDelay);
    });

    // Function to capture a screenshot of the tab
    async function captureScreenshot(tabId) {
        try {
            const screenshotUrl = await browser.tabs.captureTab(tabId, {});
            return screenshotUrl;
        } catch {
            return 'icons/default-screenshot.png'; // Fallback if screenshot fails to load
        }
    }

    // Serialize display runs so overlapping calls can't interleave (race condition guard)
    let displayQueue = Promise.resolve();

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

            // Create screenshot image element with error handling
            const tabScreenshot = document.createElement('img');
            tabScreenshot.className = 'tab-screenshot';
            tabScreenshot.src = await captureScreenshot(tab.id);

            // Add click event to activate the tab and raise its window
            tabPreview.addEventListener('click', async () => {
                await browser.tabs.update(tab.id, { active: true });
                await browser.windows.update(tab.windowId, { focused: true });
                window.close();
            });

            // Append elements to the tab preview
            tabPreview.appendChild(tabFavicon);
            tabPreview.appendChild(tabScreenshot);
            tabPreview.appendChild(tabTitle);
            tabsContainer.appendChild(tabPreview);
        }
    }

    // Initial load of tabs
    browser.tabs.query({}).then((tabs) => {
        allTabs = tabs; // Store the initial tabs
        displayTabs(tabs);
    }).catch(error => {
        console.error('Failed to query tabs:', error);
    });
});
