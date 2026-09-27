/**
 * CodeShortcut - Main Content Script
 * Intercepts shortcut + TAB keypresses, evaluates dynamic pb/pp rules & normal snippets,
 * performs atomic text replacement, and positions real editor carets using setCursorPosition + moveCursorLeft.
 */

(function () {
  let snippetsMap = {};
  let settings = { enabled: true, debugMode: false, siteSettings: {} };

  /**
   * Debug logging utility
   */
  function logDebug(...args) {
    if (settings.debugMode) {
      console.log('[CodeShortcut]', ...args);
    }
  }

  /**
   * Initializes snippets and settings from Chrome storage
   */
  async function init() {
    try {
      if (typeof StorageManager !== 'undefined') {
        snippetsMap = await StorageManager.getSnippets();
        settings = await StorageManager.getSettings();
        logDebug('Initialized with', Object.keys(snippetsMap).length, 'snippets.');
      }
    } catch (e) {
      console.error('[CodeShortcut] Initialization error:', e);
    }
  }

  // Reload snippets/settings whenever chrome.storage changes
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.snippets && changes.snippets.newValue) {
        snippetsMap = changes.snippets.newValue;
        logDebug('Snippets reloaded from storage.');
      }
      if (changes.enabled !== undefined || changes.debugMode !== undefined || changes.siteSettings) {
        StorageManager.getSettings().then(s => {
          settings = s;
          logDebug('Settings updated:', settings);
        });
      }
    });
  }

  /**
   * Checks if CodeShortcut is enabled for the current site domain
   */
  function isSiteEnabled() {
    if (!settings.enabled) return false;
    const hostname = window.location.hostname.toLowerCase();
    
    // Check specific domain matches
    for (const [domain, isEnabled] of Object.entries(settings.siteSettings || {})) {
      if (domain !== 'all_sites' && hostname.includes(domain)) {
        return isEnabled;
      }
    }
    
    // Fallback to global site setting
    return settings.siteSettings ? settings.siteSettings.all_sites !== false : true;
  }

  /**
   * Keydown event listener - captures TAB key before browser/editor handles it
   */
  function handleKeyDown(e) {
    if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (!isSiteEnabled()) return;

    const activeElement = document.activeElement;
    if (!activeElement) return;

    const adapter = EditorAdapterFactory.getAdapter(activeElement);
    const fullText = adapter.getText();
    const cursorOffset = adapter.getCursorPosition();

    // Evaluate dynamic rules (pb/pp) or normal registered snippets
    const matched = SnippetParser.findShortcutBeforeCursor(fullText, cursorOffset, snippetsMap);

    if (matched) {
      // PREVENT MONACO / CODEMIRROR / BROWSER AUTOCOMPLETE & TAB EXPANSION
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }

      let { shortcut, cleanText, cursorOffset: relativeCursorPos, startOffset, endOffset, isDynamic } = matched;

      // Inspect trailing character right after cursor for auto-paired quotes/braces/semicolons
      const charAfter = fullText.charAt(endOffset);
      if (charAfter && /["'\}\);]/.test(charAfter)) {
        if (cleanText.endsWith(charAfter) || (cleanText.includes(charAfter) && charAfter !== ';')) {
          endOffset++;
        }
      }

      logDebug(`Shortcut triggered: "${shortcut}". Replacing range [${startOffset}, ${endOffset}]`);

      // Perform atomic range replacement
      adapter.replaceRange(startOffset, endOffset, cleanText);

      // Target cursor position relative to start
      const targetAbsPos = startOffset + relativeCursorPos;
      
      // Update DOM selection range
      adapter.setCursorPosition(targetAbsPos, targetAbsPos);

      // Dispatch ArrowLeft keystrokes to move Monaco/CodeMirror internal visual caret to ${CURSOR}
      const stepsLeft = cleanText.length - relativeCursorPos;
      if (stepsLeft > 0) {
        adapter.moveCursorLeft(stepsLeft);
      }

      logDebug(`Snippet expanded cleanly. Target cursor positioned at ${targetAbsPos} (moved left ${stepsLeft} steps).`);
    } else {
      logDebug('No matching shortcut found before cursor. TAB passed through.');
    }
  }

  // Register capture-phase keydown listener for immediate TAB interception
  window.addEventListener('keydown', handleKeyDown, true);

  // Initialize extension context
  init();
})();
