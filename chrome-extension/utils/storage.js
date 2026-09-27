/**
 * CodeShortcut - Chrome Storage Manager
 * Handles local storage for snippets, user settings, enable toggles, and import/export.
 */

const StorageManager = {
  // In-memory fallback for test or headless environments
  _memoryStorage: {},

  // Default sites supported by CodeShortcut
  DEFAULT_SITES: {
    "leetcode.com": true,
    "codechef.com": true,
    "codeforces.com": true,
    "hackerrank.com": true,
    "geeksforgeeks.org": true,
    "chatgpt.com": true,
    "naukri.com": true, // Coding Ninjas / Code360
    "all_sites": true
  },

  /**
   * Helper to execute storage get safely
   */
  async _getStorage(keys) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      });
    }

    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
      const res = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(k => {
        const val = localStorage.getItem('codeshortcut_' + k);
        if (val !== null) {
          try { res[k] = JSON.parse(val); } catch (e) { res[k] = val; }
        }
      });
      return res;
    }

    // Fallback to in-memory store
    const res = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(k => {
      if (this._memoryStorage[k] !== undefined) {
        res[k] = this._memoryStorage[k];
      }
    });
    return res;
  },

  /**
   * Helper to execute storage set safely
   */
  async _setStorage(items) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => resolve(true));
      });
    }

    if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
      Object.keys(items).forEach(k => {
        localStorage.setItem('codeshortcut_' + k, JSON.stringify(items[k]));
      });
      return true;
    }

    // Fallback to in-memory store
    Object.keys(items).forEach(k => {
      this._memoryStorage[k] = items[k];
    });
    return true;
  },

  /**
   * Retrieves all active snippets, initializing with default snippets if empty.
   */
  async getSnippets() {
    const data = await this._getStorage(['snippets']);
    if (!data.snippets || Object.keys(data.snippets).length === 0) {
      const defaults = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : {};
      await this._setStorage({ snippets: defaults });
      return defaults;
    }
    return data.snippets;
  },

  /**
   * Saves or updates a single snippet
   */
  async saveSnippet(shortcut, snippetData) {
    if (!shortcut || typeof shortcut !== 'string') {
      throw new Error('Shortcut name must be a valid non-empty string.');
    }
    const cleanShortcut = shortcut.trim();
    if (!cleanShortcut) {
      throw new Error('Shortcut name cannot be empty.');
    }
    if (!snippetData || typeof snippetData.body !== 'string' || snippetData.body.length === 0) {
      throw new Error('Snippet body content cannot be empty.');
    }

    const snippets = await this.getSnippets();
    snippets[cleanShortcut] = {
      description: snippetData.description || '',
      body: snippetData.body,
      isCustom: true,
      updatedAt: Date.now()
    };
    await this._setStorage({ snippets });
    return snippets;
  },

  /**
   * Deletes a snippet by shortcut name
   */
  async deleteSnippet(shortcut) {
    const snippets = await this.getSnippets();
    if (snippets[shortcut]) {
      delete snippets[shortcut];
      await this._setStorage({ snippets });
    }
    return snippets;
  },

  /**
   * Resets all snippets to default preloaded snippets
   */
  async resetToDefaults() {
    const defaults = typeof DEFAULT_SNIPPETS !== 'undefined' ? DEFAULT_SNIPPETS : {};
    await this._setStorage({ snippets: defaults });
    return defaults;
  },

  /**
   * Retrieves user configuration settings
   */
  async getSettings() {
    const data = await this._getStorage(['enabled', 'debugMode', 'siteSettings']);
    return {
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      debugMode: data.debugMode !== undefined ? Boolean(data.debugMode) : false,
      siteSettings: data.siteSettings || { ...this.DEFAULT_SITES }
    };
  },

  /**
   * Saves updated settings object
   */
  async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = {
      enabled: settings.enabled !== undefined ? settings.enabled : current.enabled,
      debugMode: settings.debugMode !== undefined ? settings.debugMode : current.debugMode,
      siteSettings: settings.siteSettings ? { ...current.siteSettings, ...settings.siteSettings } : current.siteSettings
    };
    await this._setStorage(updated);
    return updated;
  },

  /**
   * Exports all snippets to formatted JSON string
   */
  async exportSnippets() {
    const snippets = await this.getSnippets();
    const exportData = {};
    for (const [key, val] of Object.entries(snippets)) {
      exportData[key] = {
        description: val.description || '',
        body: val.body || ''
      };
    }
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Imports snippets from JSON string with validation
   */
  async importSnippets(jsonString, overwrite = false) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format: ' + e.message);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid JSON structure: Expected an object mapping shortcut keys to snippet objects.');
    }

    const currentSnippets = await this.getSnippets();
    const updatedSnippets = overwrite ? {} : { ...currentSnippets };
    let importedCount = 0;

    for (const [key, item] of Object.entries(parsed)) {
      if (!key || typeof key !== 'string') continue;
      const cleanKey = key.trim();
      if (!cleanKey) continue;

      let body = '';
      let description = '';

      if (typeof item === 'string') {
        body = item;
      } else if (item && typeof item === 'object') {
        body = item.body || '';
        description = item.description || '';
      }

      if (body) {
        updatedSnippets[cleanKey] = {
          description,
          body,
          isCustom: true,
          updatedAt: Date.now()
        };
        importedCount++;
      }
    }

    if (importedCount === 0) {
      throw new Error('No valid snippets found in imported file.');
    }

    await this._setStorage({ snippets: updatedSnippets });
    return { count: importedCount, snippets: updatedSnippets };
  }
};

if (typeof globalThis !== 'undefined') {
  globalThis.StorageManager = StorageManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
