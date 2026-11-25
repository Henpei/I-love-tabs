// SPDX-License-Identifier: GPL-3.0-or-later
//
// I Love Tabs — a Firefox extension for browsing and searching open tabs.
// Copyright (C) 2026 André Motoda
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

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
