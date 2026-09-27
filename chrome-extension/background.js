/**
 * CodeShortcut - Background Service Worker (Manifest V3)
 */

try {
  importScripts('data/defaultSnippets.js', 'utils/storage.js');
} catch (e) {
  console.warn('[CodeShortcut SW] importScripts warning:', e);
}

// Initialize default snippets and settings on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[CodeShortcut] Extension installed. Initializing default snippets and settings...');
    if (typeof StorageManager !== 'undefined') {
      await StorageManager.getSnippets();
      await StorageManager.getSettings();
    }
  }
});

// Message listener for popup/options script requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ok', time: Date.now() });
  } else if (request.action === 'getCurrentTabDomain') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        try {
          const urlObj = new URL(tabs[0].url);
          sendResponse({ domain: urlObj.hostname });
        } catch (e) {
          sendResponse({ domain: null });
        }
      } else {
        sendResponse({ domain: null });
      }
    });
    return true; // Keep response channel open for async tabs query
  }
});
