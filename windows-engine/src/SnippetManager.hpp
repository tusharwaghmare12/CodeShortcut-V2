#ifndef CODESHORTCUT_SNIPPET_MANAGER_HPP
#define CODESHORTCUT_SNIPPET_MANAGER_HPP

#include <windows.h>
#include <string>
#include <vector>

struct SnippetMatch {
    bool isMatch;
    bool isDynamic;
    std::string shortcutTrigger;
    std::string cleanText;
    int charactersAfterCursor;
    int deleteLength;
};

class SnippetManager {
public:
    SnippetManager();
    ~SnippetManager();

    bool loadFromFile(const std::string& filePath);
    SnippetMatch evaluate(const std::string& buffer) const;

    static void parseTemplate(const std::string& templateBody, std::string& outCleanText, int& outCharsAfterCursor);

private:
    struct PresetSnippet {
        std::string shortcut;
        std::string rawBody;
        std::string cleanText;
        int charactersAfterCursor;
    };

    mutable CRITICAL_SECTION m_cs;
    std::vector<PresetSnippet> m_presets;

    static bool isAlphaNumeric(char c);
    static bool isValidIdentifier(const std::string& str);
};

#endif // CODESHORTCUT_SNIPPET_MANAGER_HPP
