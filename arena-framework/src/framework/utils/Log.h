#pragma once

#include <cstdio>
#include <cstdarg>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace Arena {

enum class LogLevel {
    Info,
    Warn,
    Error
};

class Log {
public:
    static void Info(const char* format, ...);
    static void Warn(const char* format, ...);
    static void Error(const char* format, ...);

private:
    static void Print(LogLevel level, const char* format, va_list args);
};

} // namespace Arena
