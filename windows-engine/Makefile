# CodeShortcut V2 - MinGW Makefile

CXX = g++
CXXFLAGS = -std=c++11 -Wall -O2 -I. -Isrc
LDFLAGS = -luser32 -lgdi32

SRCS = src/main.cpp \
       src/HookManager.cpp \
       src/ShortcutBuffer.cpp \
       src/SnippetManager.cpp \
       src/ClipboardManager.cpp \
       src/InputInjector.cpp \
       src/Logger.cpp

OBJS = $(SRCS:.cpp=.o)
TARGET = CodeShortcut.exe

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	del /f /q src\*.o $(TARGET) 2>nul || rm -f src/*.o $(TARGET)

.PHONY: all clean
