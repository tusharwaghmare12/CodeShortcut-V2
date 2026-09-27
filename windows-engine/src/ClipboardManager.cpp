#include "ClipboardManager.hpp"
#include "Logger.hpp"

CRITICAL_SECTION ClipboardManager::s_cs;
bool ClipboardManager::s_csInitialized = false;

void ClipboardManager::initCS() {
    if (!s_csInitialized) {
        InitializeCriticalSection(&s_cs);
        s_csInitialized = true;
    }
}

std::wstring ClipboardManager::utf8ToWide(const std::string& utf8Str) {
    if (utf8Str.empty()) return L"";
    int sizeNeeded = MultiByteToWideChar(CP_UTF8, 0, utf8Str.c_str(), (int)utf8Str.size(), NULL, 0);
    std::wstring wstr(sizeNeeded, 0);
    MultiByteToWideChar(CP_UTF8, 0, utf8Str.c_str(), (int)utf8Str.size(), &wstr[0], sizeNeeded);
    return wstr;
}

std::string ClipboardManager::wideToUtf8(const std::wstring& wideStr) {
    if (wideStr.empty()) return "";
    int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, wideStr.c_str(), (int)wideStr.size(), NULL, 0, NULL, NULL);
    std::string str(sizeNeeded, 0);
    WideCharToMultiByte(CP_UTF8, 0, wideStr.c_str(), (int)wideStr.size(), &str[0], sizeNeeded, NULL, NULL);
    return str;
}

bool ClipboardManager::setText(const std::string& utf8Text) {
    initCS();
    EnterCriticalSection(&s_cs);

    std::wstring wtext = utf8ToWide(utf8Text);
    bool opened = false;

    for (int retry = 0; retry < 5; ++retry) {
        if (OpenClipboard(NULL)) {
            opened = true;
            break;
        }
        Sleep(10);
    }

    if (!opened) {
        LeaveCriticalSection(&s_cs);
        Logger::log("CLIPBOARD", "Failed to open clipboard for writing");
        return false;
    }

    EmptyClipboard();

    size_t bytesNeeded = (wtext.size() + 1) * sizeof(wchar_t);
    HGLOBAL hGlob = GlobalAlloc(GMEM_MOVEABLE, bytesNeeded);
    if (!hGlob) {
        CloseClipboard();
        LeaveCriticalSection(&s_cs);
        Logger::log("CLIPBOARD", "Failed to allocate global memory");
        return false;
    }

    wchar_t* pBuf = (wchar_t*)GlobalLock(hGlob);
    if (!pBuf) {
        GlobalFree(hGlob);
        CloseClipboard();
        LeaveCriticalSection(&s_cs);
        Logger::log("CLIPBOARD", "Failed to lock global memory");
        return false;
    }

    memcpy(pBuf, wtext.c_str(), bytesNeeded);
    GlobalUnlock(hGlob);

    if (!SetClipboardData(CF_UNICODETEXT, hGlob)) {
        GlobalFree(hGlob);
        CloseClipboard();
        LeaveCriticalSection(&s_cs);
        Logger::log("CLIPBOARD", "Failed to set clipboard data");
        return false;
    }

    CloseClipboard();
    LeaveCriticalSection(&s_cs);
    Logger::log("PASTE", "Clipboard updated with snippet text (" + std::to_string(utf8Text.size()) + " chars)");
    return true;
}

std::string ClipboardManager::getText() {
    initCS();
    EnterCriticalSection(&s_cs);

    bool opened = false;
    for (int retry = 0; retry < 3; ++retry) {
        if (OpenClipboard(NULL)) {
            opened = true;
            break;
        }
        Sleep(10);
    }

    if (!opened) {
        LeaveCriticalSection(&s_cs);
        return "";
    }

    HANDLE hData = GetClipboardData(CF_UNICODETEXT);
    if (!hData) {
        CloseClipboard();
        LeaveCriticalSection(&s_cs);
        return "";
    }

    wchar_t* pBuf = (wchar_t*)GlobalLock(hData);
    if (!pBuf) {
        CloseClipboard();
        LeaveCriticalSection(&s_cs);
        return "";
    }

    std::wstring wstr(pBuf);
    GlobalUnlock(hData);
    CloseClipboard();
    LeaveCriticalSection(&s_cs);

    return wideToUtf8(wstr);
}

DWORD WINAPI ClipboardManager::delayedRestoreThreadProc(LPVOID lpParam) {
    RestoreParam* param = (RestoreParam*)lpParam;
    if (param) {
        Sleep(param->delayMs);
        ClipboardManager::setText(param->text);
        delete param;
    }
    return 0;
}

void ClipboardManager::restoreTextDelayed(const std::string& previousText, int delayMs) {
    if (previousText.empty()) return;
    
    RestoreParam* param = new RestoreParam();
    param->text = previousText;
    param->delayMs = delayMs;

    HANDLE hThread = CreateThread(NULL, 0, delayedRestoreThreadProc, param, 0, NULL);
    if (hThread) {
        CloseHandle(hThread);
    } else {
        delete param;
    }
}
