#ifndef CODESHORTCUT_CLIPBOARD_MANAGER_HPP
#define CODESHORTCUT_CLIPBOARD_MANAGER_HPP

#include <windows.h>
#include <string>

class ClipboardManager {
public:
    static bool setText(const std::string& utf8Text);
    static std::string getText();
    static void restoreTextDelayed(const std::string& previousText, int delayMs = 150);

private:
    static CRITICAL_SECTION s_cs;
    static bool s_csInitialized;
    static void initCS();
    static std::wstring utf8ToWide(const std::string& utf8Str);
    static std::string wideToUtf8(const std::wstring& wideStr);

    struct RestoreParam {
        std::string text;
        int delayMs;
    };
    static DWORD WINAPI delayedRestoreThreadProc(LPVOID lpParam);
};

#endif // CODESHORTCUT_CLIPBOARD_MANAGER_HPP
