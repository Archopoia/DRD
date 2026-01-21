#include "framework/utils/Log.h"
#include <cstring>

namespace Arena {

void Log::Print(LogLevel level, const char* format, va_list args) {
    const char* prefix = "";
    const char* color = "";
    
    switch (level) {
        case LogLevel::Info:
            prefix = "[INFO]";
            break;
        case LogLevel::Warn:
            prefix = "[WARN]";
            break;
        case LogLevel::Error:
            prefix = "[ERROR]";
            break;
    }

#ifdef __EMSCRIPTEN__
    // For WASM, use console.log/warn/error
    char buffer[1024];
    vsnprintf(buffer, sizeof(buffer), format, args);
    
    switch (level) {
        case LogLevel::Info:
            emscripten_log(EM_LOG_CONSOLE, "%s %s", prefix, buffer);
            break;
        case LogLevel::Warn:
            emscripten_log(EM_LOG_WARN, "%s %s", prefix, buffer);
            break;
        case LogLevel::Error:
            emscripten_log(EM_LOG_ERROR, "%s %s", prefix, buffer);
            break;
    }
#else
    // Native: use printf
    printf("%s ", prefix);
    vprintf(format, args);
    printf("\n");
    fflush(stdout);
#endif
}

void Log::Info(const char* format, ...) {
    va_list args;
    va_start(args, format);
    Print(LogLevel::Info, format, args);
    va_end(args);
}

void Log::Warn(const char* format, ...) {
    va_list args;
    va_start(args, format);
    Print(LogLevel::Warn, format, args);
    va_end(args);
}

void Log::Error(const char* format, ...) {
    va_list args;
    va_start(args, format);
    Print(LogLevel::Error, format, args);
    va_end(args);
}

} // namespace Arena
