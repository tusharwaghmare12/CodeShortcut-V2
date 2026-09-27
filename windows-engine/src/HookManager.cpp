#include "HookManager.hpp"
#include "ClipboardManager.hpp"
#include "InputInjector.hpp"
#include "Logger.hpp"
#include <cctype>

HHOOK HookManager::s_hHook = NULL;
ShortcutBuffer HookManager::s_buffer;
SnippetManager HookManager::s_snippetManager;

bool HookManager::startHook(HINSTANCE hInstance) {
    if (s_hHook != NULL) return true;

    s_hHook = SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, hInstance, 0);
    if (s_hHook == NULL) {
        Logger::log("HOOK", "SetWindowsHookEx failed! Error code: " + std::to_string(GetLastError()));
        return false;
    }

    Logger::log("HOOK", "WH_KEYBOARD_LL low-level keyboard hook successfully installed.");
    return true;
}

void HookManager::stopHook() {
    if (s_hHook != NULL) {
        UnhookWindowsHookEx(s_hHook);
        s_hHook = NULL;
        Logger::log("HOOK", "Low-level keyboard hook unhooked.");
    }
}

bool HookManager::isHookActive() {
    return s_hHook != NULL;
}

ShortcutBuffer& HookManager::getBuffer() {
    return s_buffer;
}

SnippetManager& HookManager::getSnippetManager() {
    return s_snippetManager;
}

char HookManager::vkToChar(DWORD vkCode, DWORD scanCode) {
    BYTE keyboardState[256] = {0};
    if (GetKeyState(VK_SHIFT) & 0x8000) {
        keyboardState[VK_SHIFT] = 0x80;
    }
    WORD asciiChar = 0;
    if (ToAscii(vkCode, scanCode, keyboardState, &asciiChar, 0) == 1) {
        char c = (char)asciiChar;
        if (c >= 'A' && c <= 'Z') {
            c = (char)std::tolower(c);
        }
        return c;
    }
    return 0;
}

LRESULT CALLBACK HookManager::LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode < 0) {
        return CallNextHookEx(s_hHook, nCode, wParam, lParam);
    }

    KBDLLHOOKSTRUCT* kbd = (KBDLLHOOKSTRUCT*)lParam;
    bool isInjected = (kbd->flags & LLKHF_INJECTED) || g_isInjecting.load();

    if (isInjected) {
        Logger::log("INJECTED EVENT IGNORED", "vkCode=" + std::to_string(kbd->vkCode));
        return CallNextHookEx(s_hHook, nCode, wParam, lParam);
    }

    if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
        DWORD vk = kbd->vkCode;

        // TAB KEY INTERCEPTION & EXPANSION
        if (vk == VK_TAB) {
            std::string buf = s_buffer.getBuffer();
            SnippetMatch match = s_snippetManager.evaluate(buf);

            if (match.isMatch) {
                Logger::log("SHORTCUT DETECTED", match.shortcutTrigger);
                Logger::log("SNIPPET", match.cleanText);

                // 1. Save user's current clipboard text
                std::string prevClip = ClipboardManager::getText();

                // 2. Set clean snippet text to Windows clipboard
                ClipboardManager::setText(match.cleanText);

                // 3. Delete original shortcut characters from active editor
                InputInjector::sendBackspaces(match.deleteLength);

                // 4. Paste snippet atomically via Ctrl+V
                InputInjector::sendPaste();

                // 5. Move real editor cursor LEFT by charactersAfterCursor steps if > 0
                if (match.charactersAfterCursor > 0) {
                    InputInjector::sendLeftArrows(match.charactersAfterCursor);
                }

                // 6. Restore user's previous clipboard text safely after short delay
                ClipboardManager::restoreTextDelayed(prevClip, 150);

                // 7. Reset shortcut buffer completely
                s_buffer.clear();

                // CONSUME TAB EVENT IMMEDIATELY (Do not pass TAB to target editor!)
                return 1;
            } else {
                // TAB pressed without shortcut match -> clear buffer cleanly
                s_buffer.clear();
                return CallNextHookEx(s_hHook, nCode, wParam, lParam);
            }
        }

        // BACKSPACE KEY
        if (vk == VK_BACK) {
            s_buffer.popBack();
            return CallNextHookEx(s_hHook, nCode, wParam, lParam);
        }

        // BOUNDARY KEYS RESET BUFFER
        if (vk == VK_ESCAPE || vk == VK_RETURN || vk == VK_SPACE ||
            vk == VK_UP || vk == VK_DOWN || vk == VK_LEFT || vk == VK_RIGHT ||
            vk == VK_HOME || vk == VK_END || vk == VK_PRIOR || vk == VK_NEXT) {
            s_buffer.clear();
            return CallNextHookEx(s_hHook, nCode, wParam, lParam);
        }

        // ALPHANUMERIC & PUNCTUATION CHARACTERS
        char c = vkToChar(vk, kbd->scanCode);
        if (c != 0 && (std::isalnum((unsigned char)c) || c == '_' || c == '.')) {
            s_buffer.append(c);
        }
    }

    return CallNextHookEx(s_hHook, nCode, wParam, lParam);
}
