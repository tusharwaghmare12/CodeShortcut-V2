@echo off
echo ==================================================
echo Building CodeShortcut V2 with MinGW g++...
echo ==================================================

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

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================
    echo SUCCESS: CodeShortcut.exe built successfully!
    echo Run CodeShortcut.exe --debug to start in debug mode.
    echo ==================================================
) else (
    echo.
    echo ==================================================
    echo BUILD FAILED! Check compiler errors above.
    echo ==================================================
)
