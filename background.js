// background.js
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'sendLogs') {
    try {
      const response = await fetch('https://browser-intake-datadoghq.com/api/v2/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message.data),
      });
      const responseData = await response.json();
      sendResponse({ success: true, data: responseData });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async response
  }
});
