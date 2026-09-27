#ifndef CODESHORTCUT_SHORTCUT_BUFFER_HPP
#define CODESHORTCUT_SHORTCUT_BUFFER_HPP

#include <windows.h>
#include <string>

class ShortcutBuffer {
public:
    ShortcutBuffer();
    ~ShortcutBuffer();

    void append(char c);
    void popBack();
    void clear();
    std::string getBuffer() const;
    bool isEmpty() const;

private:
    mutable CRITICAL_SECTION m_cs;
    std::string m_buffer;
    static const size_t MAX_BUFFER_SIZE = 100;
};

#endif // CODESHORTCUT_SHORTCUT_BUFFER_HPP
