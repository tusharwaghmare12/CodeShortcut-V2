#include <windows.h>
#include <iostream>
#include <csignal>
#include "Logger.hpp"
#include "HookManager.hpp"
#include "SnippetManager.hpp"

void signalHandler(int signum) {
    Logger::log("SYSTEM", "Signal received (" + std::to_string(signum) + "). Shutting down CodeShortcut...");
    HookManager::stopHook();
    exit(signum);
}

int main(int argc, char* argv[]) {
    // Enable ANSI console colors on Windows 10/11 if available
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD dwMode = 0;
    if (hOut != INVALID_HANDLE_VALUE && GetConsoleMode(hOut, &dwMode)) {
        SetConsoleMode(hOut, dwMode | 0x0004);
    }

    bool debugArg = false;
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--debug" || arg == "-d") {
            debugArg = true;
        }
    }

    Logger::setDebugMode(debugArg);

    std::cout << "==================================================" << std::endl;
    std::cout << "   CodeShortcut V2 - System-Wide C++ Engine       " << std::endl;
    std::cout << "==================================================" << std::endl;

    // Load snippets from snippets.txt
    std::string snippetsFile = "snippets.txt";
    if (!HookManager::getSnippetManager().loadFromFile(snippetsFile)) {
        std::cerr << "[ERROR] Could not load " << snippetsFile << ". Please ensure snippets.txt exists in working directory." << std::endl;
        return 1;
    }

    HINSTANCE hInstance = GetModuleHandle(NULL);
    if (!HookManager::startHook(hInstance)) {
        std::cerr << "[ERROR] Failed to install low-level keyboard hook!" << std::endl;
        return 1;
    }

    signal(SIGINT, signalHandler);
    signal(SIGTERM, signalHandler);

    std::cout << "[READY] CodeShortcut V2 active. Press CTRL+C in console to stop." << std::endl;
    if (debugArg) {
        std::cout << "[DEBUG] Verbose event logging is ACTIVE." << std::endl;
    }

    // Windows Message Loop
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    HookManager::stopHook();
    return 0;
}
