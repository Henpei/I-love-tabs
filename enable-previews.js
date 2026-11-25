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

// Page script for enable-previews.html — kept in a separate file because the
// default extension CSP (script-src 'self') blocks inline scripts.

const status = document.getElementById('status');
const continueButton = document.getElementById('continue-button');
const tryAgainButton = document.getElementById('try-again-button');

function showSuccess() {
    status.textContent = 'Previews enabled — you can close this tab';
    continueButton.hidden = true;
    tryAgainButton.hidden = true;
}

function showDismissed() {
    status.textContent = 'The permission request was dismissed or cancelled.';
    continueButton.hidden = true;
    tryAgainButton.hidden = false;
}

function showContinue() {
    status.textContent = 'Click Continue to grant I Love Tabs permission to show tab previews.';
    continueButton.hidden = false;
    tryAgainButton.hidden = true;
}

// Must run directly in a user-gesture handler to be accepted by Firefox
async function requestPermission() {
    try {
        const granted = await browser.permissions.request({ origins: ['<all_urls>'] });
        if (granted) {
            showSuccess();
        } else {
            showDismissed();
        }
    } catch {
        // Called without a valid user gesture — ask the user to click
        showContinue();
    }
}

continueButton.addEventListener('click', requestPermission);
tryAgainButton.addEventListener('click', requestPermission);

// Immediately on load, try to request the optional host permission
requestPermission();
