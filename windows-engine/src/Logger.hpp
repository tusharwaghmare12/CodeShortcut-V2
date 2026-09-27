#ifndef CODESHORTCUT_LOGGER_HPP
#define CODESHORTCUT_LOGGER_HPP

#include <windows.h>
#include <iostream>
#include <string>

class Logger {
public:
    static void setDebugMode(bool enabled);
    static bool isDebugMode();
    static void log(const std::string& tag, const std::string& message);

private:
    static bool s_debugMode;
    static CRITICAL_SECTION s_cs;
    static bool s_csInitialized;
    static void initCS();
};

#endif // CODESHORTCUT_LOGGER_HPP
