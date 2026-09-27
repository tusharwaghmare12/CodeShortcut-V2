#include "ShortcutBuffer.hpp"
#include "Logger.hpp"

ShortcutBuffer::ShortcutBuffer() {
    InitializeCriticalSection(&m_cs);
    m_buffer.reserve(32);
}

ShortcutBuffer::~ShortcutBuffer() {
    DeleteCriticalSection(&m_cs);
}

void ShortcutBuffer::append(char c) {
    EnterCriticalSection(&m_cs);
    if (m_buffer.size() >= MAX_BUFFER_SIZE) {
        m_buffer.erase(0, m_buffer.size() - MAX_BUFFER_SIZE + 1);
    }
    m_buffer.push_back(c);
    std::string currentBuf = m_buffer;
    LeaveCriticalSection(&m_cs);

    Logger::log("KEY", std::string(1, c));
    Logger::log("BUFFER", currentBuf);
}

void ShortcutBuffer::popBack() {
    EnterCriticalSection(&m_cs);
    if (!m_buffer.empty()) {
        m_buffer.pop_back();
    }
    std::string currentBuf = m_buffer;
    LeaveCriticalSection(&m_cs);

    Logger::log("BUFFER", currentBuf.empty() ? "<EMPTY>" : currentBuf);
}

void ShortcutBuffer::clear() {
    EnterCriticalSection(&m_cs);
    bool wasEmpty = m_buffer.empty();
    m_buffer.clear();
    LeaveCriticalSection(&m_cs);

    if (!wasEmpty) {
        Logger::log("BUFFER RESET", "<EMPTY>");
    }
}

std::string ShortcutBuffer::getBuffer() const {
    EnterCriticalSection(&m_cs);
    std::string copy = m_buffer;
    LeaveCriticalSection(&m_cs);
    return copy;
}

bool ShortcutBuffer::isEmpty() const {
    EnterCriticalSection(&m_cs);
    bool empty = m_buffer.empty();
    LeaveCriticalSection(&m_cs);
    return empty;
}
