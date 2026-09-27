#include "Logger.hpp"

bool Logger::s_debugMode = false;
CRITICAL_SECTION Logger::s_cs;
bool Logger::s_csInitialized = false;

void Logger::initCS() {
    if (!s_csInitialized) {
        InitializeCriticalSection(&s_cs);
        s_csInitialized = true;
    }
}

void Logger::setDebugMode(bool enabled) {
    initCS();
    EnterCriticalSection(&s_cs);
    s_debugMode = enabled;
    if (s_debugMode) {
        std::cout << "[CodeShortcut V2] Debug Mode Enabled." << std::endl;
    }
    LeaveCriticalSection(&s_cs);
}

bool Logger::isDebugMode() {
    initCS();
    EnterCriticalSection(&s_cs);
    bool mode = s_debugMode;
    LeaveCriticalSection(&s_cs);
    return mode;
}

void Logger::log(const std::string& tag, const std::string& message) {
    initCS();
    EnterCriticalSection(&s_cs);
    if (s_debugMode) {
        std::cout << "[" << tag << "] " << message << std::endl;
    }
    LeaveCriticalSection(&s_cs);
}
