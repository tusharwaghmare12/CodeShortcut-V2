# CodeShortcut V2

CodeShortcut is a coding productivity tool that converts short keyboard shortcuts into complete, customizable code snippets.

It works across:

- Web-based coding platforms
- Browser code editors
- Desktop IDEs
- Native Windows applications

### Shortcut Examples

```text
fo + TAB
→

for(int i = 0; i < n; i++){
    |
}
```

```text
vpb + TAB
→

v.push_back();|
```

```text
cpp + TAB
→

c.pop_back();|
```

---

## 🏛️ Architecture Overview

CodeShortcut V2 offers two independent, production-ready implementations:

1. **Chrome Extension (Manifest V3)**: Operates inside browser-based editors (**LeetCode**, **Codeforces**, **CodeChef**, **HackerRank**, **ChatGPT**, web textareas).
2. **System-wide C++ Windows Engine**: Operates globally across native desktop applications (**VS Code**, **Visual Studio**, **Notepad++**, desktop IDEs).

```text
                   CodeShortcut V2
                         |
            +------------+------------+
            |                         |
     Chrome Extension          C++ Windows Engine
            |                         |
     Web Editors                 Desktop Apps
            |                         |
  LeetCode / Codeforces       VS Code / Visual Studio
  CodeChef / etc.             Notepad++ / IDEs
```

---

## 🔍 Problem

Competitive programmers and students type repetitive code boilerplate hundreds of times daily (loop declarations, vector operations, input/output statements). Existing browser or editor tools often:

- Conflict with editor auto-closing quote/bracket pairs (`cout << "h";ello`).
- Suffer from cursor drift due to line/column CRLF mismatches.
- Require multi-step tab stops that get stuck or break when editing.
- Fail to clean up shortcut buffers, causing stale characters to corrupt subsequent shortcuts.

---

## 💡 Solution

CodeShortcut V2 solves these issues with a dual-engine architecture:

1. **Single `${CURSOR}` Caret Positioning**: Specifies exact target cursor placement without complex tab stops.
2. **Dynamic `pb` and `pp` Suffix Rules**: Automatically converts `<expression>pb` &rarr; `<expression>.push_back();|` and `<expression>pp` &rarr; `<expression>.pop_back();|` with caret at the end of the statement.
3. **Capture-Phase & Hook Event Interception**: Consumes <kbd>TAB</kbd> immediately to prevent editor autocomplete widgets from stealing keypresses.
4. **Atomic Text Replacement**: Pastes complete clean templates cleanly, avoiding character-by-character auto-pair triggers.

---

## ✨ Features

- **Instant Shortcut Expansion**: Type `fo`, `ci`, `co`, `fn`, `t` + <kbd>TAB</kbd> for instant boilerplate insertion.
- **Dynamic Method Suffixes**: Works dynamically on any variable name (`apb`, `vpb`, `cpb`, `arrpb`, `cpp`, `npp`, `lpp`, `arrpp`).
- **Multi-Editor Compatibility**: Tested on LeetCode, Codeforces, CodeChef, HackerRank, ChatGPT, VS Code, Visual Studio, and Notepad++.
- **Zero Overhead**: Pure vanilla JS (browser extension) and low-level C++ (Windows engine). No external frameworks or tracking.
- **Customizable Snippets**: Manage snippets via the extension UI or edit `snippets.txt`.

---

## 🌐 Chrome Extension

Located in `chrome-extension/`. Built with Chrome Extension **Manifest V3**.

- **Content Script (`content.js`)**: Captures <kbd>TAB</kbd> in capture phase (`e.stopImmediatePropagation()`).
- **Editor Adapter (`utils/editorAdapter.js`)**: Abstraction for `<textarea>`, `contenteditable`, Monaco Editor, and CodeMirror.
- **UI (`popup/` & `options/`)**: Sleek dark-theme popup and options manager.

See [`chrome-extension/README.md`](chrome-extension/README.md) for full extension documentation.

---

## 💻 Windows C++ Engine

Located in `windows-engine/`. Built with **Win32 C++11**.

- **Low-Level Hook (`src/HookManager.cpp`)**: `WH_KEYBOARD_LL` callback filtering out injected events (`LLKHF_INJECTED`).
- **Input Injection (`src/InputInjector.cpp`)**: Sends Backspaces, `Ctrl+V` paste, and `VK_LEFT` cursor movement.
- **Clipboard Safety (`src/ClipboardManager.cpp`)**: UTF-16 Unicode clipboard manager with delayed background restoration.

See [`windows-engine/README.md`](windows-engine/README.md) for full C++ compilation and setup instructions.

---

## 💻 Supported Editors

- **LeetCode** (`leetcode.com`) - Monaco Editor
- **Codeforces** (`codeforces.com`) - CodeMirror Editor
- **CodeChef** (`codechef.com`) - Web Editors & Textareas
- **HackerRank** (`hackerrank.com`) - Ace & CodeMirror
- **ChatGPT** (`chatgpt.com`) - Textareas & Code blocks
- **VS Code / Visual Studio / Notepad++** - Desktop Applications

---

## 📥 Installation

### Chrome Extension
1. Go to `chrome://extensions/` in Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `chrome-extension/` directory.

### Windows C++ Engine
1. Open Command Prompt in `windows-engine/`.
2. Compile using MinGW `g++`:
   ```cmd
   build.bat
   ```
3. Run `CodeShortcut.exe --debug`.

---

## 📖 Usage

1. Open any supported editor.
2. Type a shortcut (e.g. `fo` or `vpb`).
3. Press <kbd>TAB</kbd>.
4. The shortcut is replaced with the clean snippet, and the cursor lands at `${CURSOR}`.

---

## 📁 Project Structure

```text
CodeShortcut/
│
├── README.md                  # Main GitHub documentation
├── LICENSE                    # MIT License
├── .gitignore                 # Build & OS ignore rules
│
├── chrome-extension/          # Manifest V3 Chrome Extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── data/
│   ├── icons/
│   ├── options/
│   ├── popup/
│   └── utils/
│
├── windows-engine/            # Native Win32 C++ Background Application
│   ├── src/
│   │   ├── main.cpp
│   │   ├── HookManager.cpp
│   │   ├── ShortcutBuffer.cpp
│   │   ├── SnippetManager.cpp
│   │   ├── ClipboardManager.cpp
│   │   ├── InputInjector.cpp
│   │   └── Logger.cpp
│   ├── snippets.txt
│   ├── build.bat
│   └── Makefile
│
└── screenshots/               # Application UI & Editor Screenshots
    ├── leetcode.png
    ├── vscode.png
    └── popup.png
```

---

## 🧪 Testing

Run automated verification test suites:
- **Chrome Extension Tests**: `node scratch/test_suite.js` (47/47 tests passed)
- **Windows Engine Tests**: See `windows-engine/tests/README.md`

---

## 🛠️ Technologies Used

- **Languages**: C++11, JavaScript (ES6+), HTML5, CSS3
- **APIs & Libraries**: Win32 API (`WH_KEYBOARD_LL`, `SendInput`, `OpenClipboard`), Chrome Extension APIs (Manifest V3, `chrome.storage.local`)
- **Compilers**: MinGW `g++` (GCC 6.3.0+)

---

## 🚀 Future Roadmap

- Linked variable placeholders.
- Language auto-detection (C++, Python, Java).
- Cloud snippet synchronization across devices.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
