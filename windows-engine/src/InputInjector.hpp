#ifndef CODESHORTCUT_INPUT_INJECTOR_HPP
#define CODESHORTCUT_INPUT_INJECTOR_HPP

#include <windows.h>
#include <atomic>

extern std::atomic<bool> g_isInjecting;

class RAII_InjectorGuard {
public:
    RAII_InjectorGuard() {
        g_isInjecting.store(true);
    }
    ~RAII_InjectorGuard() {
        g_isInjecting.store(false);
    }
};

class InputInjector {
public:
    static void sendBackspaces(int count);
    static void sendPaste();
    static void sendLeftArrows(int count);
};

#endif // CODESHORTCUT_INPUT_INJECTOR_HPP
