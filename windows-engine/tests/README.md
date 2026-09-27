# CodeShortcut V2 - C++ Engine Verification Tests 🧪

This directory contains documentation and test specifications for the CodeShortcut V2 C++ engine.

---

## 📋 Verified Test Cases

The test suite validates:

1. **Preset Snippet Parsing**: Correct clean text extraction and calculation of `charactersAfterCursor` for `fo`, `ci`, `co`, `if`, `wh`, `t`, `ve`, `so`, `sz`, `um`, `pq`, `ll`, `else`, `ife`, `sw`, `fn`, `ret`, `br`, `ct`.
2. **Multiple `${CURSOR}` Markers**: Validates that multi-marker snippets (e.g. `[in]`) resolve target cursor location to the **LAST** `${CURSOR}` marker (`int ;\ncin >> |;`).
3. **Dynamic `pb` Rules**: Validates `apb`, `vpb`, `cpb`, `arrpb`, `vecpb`, `stackpb`, `myVectorpb` $\rightarrow$ `<expression>.push_back();|` (cursor at the end of statement).
4. **Dynamic `pp` Rules**: Validates `app`, `npp`, `lpp`, `cpp`, `arrpp`, `myVectorpp` $\rightarrow$ `<expression>.pop_back();|` (cursor at the end of statement).
5. **Standalone `pb` / `pp`**: Confirms standalone `pb` or `pp` without preceding expression is NOT matched as dynamic rules and falls back to normal snippet lookup.
6. **ShortcutBuffer Boundary Tracking**: Validates thread-safe buffer tracking and immediate buffer clearing on boundary keys (`VK_ESCAPE`, `VK_RETURN`, `VK_SPACE`, `VK_TAB`, Arrows).

---

## 🏃 Execution Command

To compile and run the verification test suite using MinGW `g++`:

```cmd
g++ -std=c++11 -Wall -O2 -I. -I../src tests/test_runner.cpp ../src/SnippetManager.cpp ../src/ShortcutBuffer.cpp ../src/Logger.cpp -o test_runner.exe
.\test_runner.exe
```
