#include "SnippetManager.hpp"
#include "Logger.hpp"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cctype>

SnippetManager::SnippetManager() {
    InitializeCriticalSection(&m_cs);
}

SnippetManager::~SnippetManager() {
    DeleteCriticalSection(&m_cs);
}

bool SnippetManager::isAlphaNumeric(char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_';
}

bool SnippetManager::isValidIdentifier(const std::string& str) {
    if (str.empty()) return false;
    if (std::isdigit((unsigned char)str[0])) return false;
    for (char c : str) {
        if (!isAlphaNumeric(c)) return false;
    }
    return true;
}

void SnippetManager::parseTemplate(const std::string& templateBody, std::string& outCleanText, int& outCharsAfterCursor) {
    const std::string marker = "${CURSOR}";
    size_t lastMarkerPos = std::string::npos;
    std::string clean;
    size_t lastIndex = 0;
    size_t found = templateBody.find(marker, lastIndex);

    while (found != std::string::npos) {
        clean += templateBody.substr(lastIndex, found - lastIndex);
        lastMarkerPos = clean.length();
        lastIndex = found + marker.length();
        found = templateBody.find(marker, lastIndex);
    }
    clean += templateBody.substr(lastIndex);

    outCleanText = clean;
    if (lastMarkerPos != std::string::npos) {
        outCharsAfterCursor = (int)(clean.length() - lastMarkerPos);
    } else {
        outCharsAfterCursor = 0;
    }
}

bool SnippetManager::loadFromFile(const std::string& filePath) {
    EnterCriticalSection(&m_cs);
    m_presets.clear();

    std::ifstream infile(filePath);
    if (!infile.is_open()) {
        LeaveCriticalSection(&m_cs);
        Logger::log("SNIPPET", "Failed to open snippets file: " + filePath);
        return false;
    }

    std::string line;
    std::string currentShortcut = "";
    std::string currentBody = "";

    auto saveCurrent = [&]() {
        if (!currentShortcut.empty() && !currentBody.empty()) {
            while (!currentBody.empty() && (currentBody.back() == '\n' || currentBody.back() == '\r')) {
                currentBody.pop_back();
            }
            PresetSnippet ps;
            ps.shortcut = currentShortcut;
            ps.rawBody = currentBody;
            parseTemplate(currentBody, ps.cleanText, ps.charactersAfterCursor);
            m_presets.push_back(ps);
        }
        currentShortcut.clear();
        currentBody.clear();
    };

    while (std::getline(infile, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }

        if (line.size() >= 3 && line.front() == '[' && line.back() == ']') {
            saveCurrent();
            currentShortcut = line.substr(1, line.size() - 2);
        } else if (!currentShortcut.empty()) {
            if (!currentBody.empty()) {
                currentBody += "\n";
            }
            currentBody += line;
        }
    }
    saveCurrent();

    std::sort(m_presets.begin(), m_presets.end(), [](const PresetSnippet& a, const PresetSnippet& b) {
        return a.shortcut.length() > b.shortcut.length();
    });

    size_t loadedCount = m_presets.size();
    LeaveCriticalSection(&m_cs);

    Logger::log("SNIPPET", "Loaded " + std::to_string(loadedCount) + " presets from " + filePath);
    return true;
}

SnippetMatch SnippetManager::evaluate(const std::string& buffer) const {
    EnterCriticalSection(&m_cs);

    SnippetMatch match;
    match.isMatch = false;
    match.isDynamic = false;
    match.charactersAfterCursor = 0;
    match.deleteLength = 0;

    if (buffer.empty()) {
        LeaveCriticalSection(&m_cs);
        return match;
    }

    size_t wordStart = buffer.length();
    while (wordStart > 0 && isAlphaNumeric(buffer[wordStart - 1])) {
        wordStart--;
    }
    std::string word = buffer.substr(wordStart);

    // 1. DYNAMIC RULE: push_back ("pb")
    // Example: apb, vpb, cpb, arrpb, vecpb, stackpb, myVectorpb
    if (word.length() > 2 && word.size() >= 3 && word.substr(word.size() - 2) == "pb") {
        std::string expr = word.substr(0, word.size() - 2);
        if (isValidIdentifier(expr)) {
            match.isMatch = true;
            match.isDynamic = true;
            match.shortcutTrigger = word;
            match.cleanText = expr + ".push_back();";
            match.charactersAfterCursor = 0; // Cursor ALWAYS at END of statement for dynamic pb!
            match.deleteLength = (int)word.length();
            LeaveCriticalSection(&m_cs);
            return match;
        }
    }

    // 2. DYNAMIC RULE: pop_back ("pp")
    // Example: app, npp, lpp, cpp, arrpp, myVectorpp
    if (word.length() > 2 && word.size() >= 3 && word.substr(word.size() - 2) == "pp") {
        std::string expr = word.substr(0, word.size() - 2);
        if (isValidIdentifier(expr)) {
            match.isMatch = true;
            match.isDynamic = true;
            match.shortcutTrigger = word;
            match.cleanText = expr + ".pop_back();";
            match.charactersAfterCursor = 0; // Cursor ALWAYS at END of statement for dynamic pp!
            match.deleteLength = (int)word.length();
            LeaveCriticalSection(&m_cs);
            return match;
        }
    }

    // 3. PRESET SNIPPETS LOOKUP
    for (const auto& ps : m_presets) {
        if (buffer.length() >= ps.shortcut.length()) {
            size_t startPos = buffer.length() - ps.shortcut.length();
            if (buffer.compare(startPos, ps.shortcut.length(), ps.shortcut) == 0) {
                bool startsWithWordChar = isAlphaNumeric(ps.shortcut[0]);
                if (startsWithWordChar && startPos > 0) {
                    char charBefore = buffer[startPos - 1];
                    if (isAlphaNumeric(charBefore)) {
                        continue;
                    }
                }

                match.isMatch = true;
                match.isDynamic = false;
                match.shortcutTrigger = ps.shortcut;
                match.cleanText = ps.cleanText;
                match.charactersAfterCursor = ps.charactersAfterCursor;
                match.deleteLength = (int)ps.shortcut.length();
                LeaveCriticalSection(&m_cs);
                return match;
            }
        }
    }

    LeaveCriticalSection(&m_cs);
    return match;
}
