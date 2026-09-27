# CodeShortcut V2 - System-Wide Windows C++ Engine 💻

CodeShortcut V2 Windows Engine is a high-performance background application written in native C++ that provides system-wide code shortcut expansion across desktop IDEs, text editors, and native Windows applications.

---

## 🛠️ Architecture

- **Low-Level Hook**: Uses Win32 `WH_KEYBOARD_LL` (`SetWindowsHookEx`) to intercept keyboard events before target applications receive them.
- **Injection Protection**: Strictly filters out injected keys (`LLKHF_INJECTED` and `g_isInjecting` RAII guard) to prevent `Ctrl+V` or Backspace keys from corrupting the shortcut buffer.
- **Win32 Clipboard + Caret Positioning**: Pastes clean snippet templates atomically via UTF-16 Clipboard (`CF_UNICODETEXT`) + `Ctrl+V`, then moves the caret left by `charactersAfterCursor` steps (`VK_LEFT`).
- **Delayed Clipboard Restoration**: Automatically backs up and restores the user's previous clipboard text after snippet insertion.

---

## ⚙️ Compilation & Build Instructions

### Prerequisites
- MinGW `g++` (GCC 6.3.0 or later) with C++11 support.

### Compilation Command

```cmd
g++ -std=c++11 -Wall -O2 -I. -Isrc ^
  src/main.cpp ^
  src/HookManager.cpp ^
  src/ShortcutBuffer.cpp ^
  src/SnippetManager.cpp ^
  src/ClipboardManager.cpp ^
  src/InputInjector.cpp ^
  src/Logger.cpp ^
  -o CodeShortcut.exe ^
  -luser32 -lgdi32
```

*(Or simply run `build.bat` in Command Prompt / PowerShell).*

---

## 🚀 Running the Engine

1. Ensure `snippets.txt` is located in the working directory.
2. Run `CodeShortcut.exe` in Command Prompt:
   ```cmd
   .\CodeShortcut.exe --debug
   ```
3. Open any desktop IDE (VS Code, Visual Studio, Notepad++) and type shortcuts (e.g., `fo` + <kbd>TAB</kbd>, `cpp` + <kbd>TAB</kbd>).

---

## 📁 Directory Structure

```text
windows-engine/
├── src/
│   ├── main.cpp              # WinMain / main entry point & message loop
│   ├── HookManager.hpp       # WH_KEYBOARD_LL low-level hook & callback
│   ├── HookManager.cpp
│   ├── ShortcutBuffer.hpp    # Buffer management & boundary tracking
│   ├── ShortcutBuffer.cpp
│   ├── SnippetManager.hpp    # snippets.txt parser, ${CURSOR} & dynamic pb/pp logic
│   ├── SnippetManager.cpp
│   ├── ClipboardManager.hpp  # Win32 Clipboard Open/Set/Restore wrapper
│   ├── ClipboardManager.cpp
│   ├── InputInjector.hpp     # SendInput Backspaces, Ctrl+V, VK_LEFT wrapper
│   ├── InputInjector.cpp
│   ├── Logger.hpp            # Thread-safe debug logging
│   └── Logger.cpp
│
├── snippets.txt              # Snippets definition file
├── build.bat                 # Windows build script
├── Makefile                  # MinGW g++ Makefile
└── tests/
    └── README.md             # Verification test suite guide
```
