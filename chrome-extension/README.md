# CodeShortcut V2 - Chrome Extension ⚡

CodeShortcut V2 is a Manifest V3 browser extension that brings instant keyboard shortcut expansions and single `${CURSOR}` target positioning directly to web-based code editors and competitive programming platforms.

---

## 🚀 Features

- **Manifest V3 Architecture**: Lightweight, high-performance content script with zero external dependencies.
- **Single `${CURSOR}` Placement**: Defines exact target caret location in expanded snippets without complex tab stops.
- **Dynamic `pb` & `pp` Shortcuts**: Automatically converts `<expression>pb` &rarr; `<expression>.push_back();|` and `<expression>pp` &rarr; `<expression>.pop_back();|` with caret positioned at the end of the statement.
- **Universal Editor Support**: Works with standard `<textarea>`, `<input>`, `contenteditable`, Monaco Editor (LeetCode, ChatGPT), and CodeMirror (Codeforces, GeeksforGeeks, HackerRank).
- **Auto-Pair Conflict Prevention**: Intercepts <kbd>TAB</kbd> in capture phase (`e.stopImmediatePropagation()`) to prevent Monaco/CodeMirror autocomplete widgets from stealing input or inserting leftover characters.

---

## 📥 Installation

1. Open **Google Chrome** and navigate to:
   ```text
   chrome://extensions/
   ```
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click **Load unpacked** in the top left corner.
4. Select the `chrome-extension` directory.
5. CodeShortcut V2 is now active in your browser!

---

## ⌨️ Shortcut Examples

| Shortcut | Expanded Output | Caret Position |
| :--- | :--- | :--- |
| `fo` + <kbd>TAB</kbd> | `for(int i = 0; i < n; i++){\n    \n}` | Inside loop body |
| `ci` + <kbd>TAB</kbd> | `cin >> ;` | Before semicolon |
| `co` + <kbd>TAB</kbd> | `cout << "";` | Inside quotes |
| `apb` + <kbd>TAB</kbd> | `a.push_back();` | End of statement |
| `cpp` + <kbd>TAB</kbd> | `c.pop_back();` | End of statement |

---

## 📁 Directory Structure

```text
chrome-extension/
├── manifest.json            # Manifest V3 configuration
├── background.js             # Service worker & storage initializer
├── content.js                # Core content script & TAB key interceptor
├── data/
│   └── defaultSnippets.js   # Preloaded 21 default C++ snippets
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── options/
│   ├── options.html         # Settings & guide page
│   ├── options.css
│   └── options.js
├── popup/
│   ├── popup.html           # Quick popup UI
│   ├── popup.css
│   └── popup.js
└── utils/
    ├── editorAdapter.js     # Textarea, ContentEditable, Monaco & CodeMirror adapter
    ├── snippetParser.js     # Snippet ${CURSOR} parser & dynamic rule evaluator
    └── storage.js           # Chrome Local Storage manager
```
