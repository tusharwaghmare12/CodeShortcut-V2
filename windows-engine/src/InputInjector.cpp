#include "InputInjector.hpp"
#include "Logger.hpp"
#include <vector>

std::atomic<bool> g_isInjecting(false);

void InputInjector::sendBackspaces(int count) {
    if (count <= 0) return;
    RAII_InjectorGuard guard;

    Logger::log("DELETE", "Sending " + std::to_string(count) + " Backspace keypresses");

    std::vector<INPUT> inputs;
    inputs.reserve(count * 2);

    for (int i = 0; i < count; ++i) {
        INPUT down = {0};
        down.type = INPUT_KEYBOARD;
        down.ki.wVk = VK_BACK;
        inputs.push_back(down);

        INPUT up = {0};
        up.type = INPUT_KEYBOARD;
        up.ki.wVk = VK_BACK;
        up.ki.dwFlags = KEYEVENTF_KEYUP;
        inputs.push_back(up);
    }

    SendInput((UINT)inputs.size(), inputs.data(), sizeof(INPUT));
    Sleep(15); // Small delay to allow editor buffer to process deletion
}

void InputInjector::sendPaste() {
    RAII_InjectorGuard guard;

    Logger::log("PASTE", "Sending Ctrl+V shortcut injection");

    INPUT inputs[4] = {0};

    // Ctrl Down
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;

    // V Down
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'V';

    // V Up
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'V';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;

    // Ctrl Up
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(4, inputs, sizeof(INPUT));
    Sleep(25); // Small delay to allow paste to complete cleanly
}

void InputInjector::sendLeftArrows(int count) {
    if (count <= 0) return;
    RAII_InjectorGuard guard;

    Logger::log("CURSOR", "Moving cursor LEFT " + std::to_string(count) + " steps");

    std::vector<INPUT> inputs;
    inputs.reserve(count * 2);

    for (int i = 0; i < count; ++i) {
        INPUT down = {0};
        down.type = INPUT_KEYBOARD;
        down.ki.wVk = VK_LEFT;
        inputs.push_back(down);

        INPUT up = {0};
        up.type = INPUT_KEYBOARD;
        up.ki.wVk = VK_LEFT;
        up.ki.dwFlags = KEYEVENTF_KEYUP;
        inputs.push_back(up);
    }

    SendInput((UINT)inputs.size(), inputs.data(), sizeof(INPUT));
}
