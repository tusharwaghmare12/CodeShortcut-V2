#ifndef CODESHORTCUT_HOOK_MANAGER_HPP
#define CODESHORTCUT_HOOK_MANAGER_HPP

#include <windows.h>
#include "ShortcutBuffer.hpp"
#include "SnippetManager.hpp"

class HookManager {
public:
    static bool startHook(HINSTANCE hInstance);
    static void stopHook();
    static bool isHookActive();

    static ShortcutBuffer& getBuffer();
    static SnippetManager& getSnippetManager();

private:
    static HHOOK s_hHook;
    static ShortcutBuffer s_buffer;
    static SnippetManager s_snippetManager;

    static LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam);
    static char vkToChar(DWORD vkCode, DWORD scanCode);
};

#endif // CODESHORTCUT_HOOK_MANAGER_HPP
