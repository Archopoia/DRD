#include "Time.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#include <SDL2/SDL.h>
#endif

namespace Arena {

float Time::s_deltaTime = 0.0f;
float Time::s_totalTime = 0.0f;
float Time::s_fps = 0.0f;
float Time::s_lastTime = 0.0f;
float Time::s_fpsAccumulator = 0.0f;
int Time::s_fpsFrames = 0;

void Time::Init() {
#ifdef __EMSCRIPTEN__
    s_lastTime = emscripten_get_now() / 1000.0f;
#else
    s_lastTime = SDL_GetTicks() / 1000.0f;
#endif
    s_deltaTime = 0.0f;
    s_totalTime = 0.0f;
    s_fps = 0.0f;
    s_fpsAccumulator = 0.0f;
    s_fpsFrames = 0;
}

void Time::Update() {
#ifdef __EMSCRIPTEN__
    float currentTime = emscripten_get_now() / 1000.0f;
#else
    float currentTime = SDL_GetTicks() / 1000.0f;
#endif
    
    s_deltaTime = currentTime - s_lastTime;
    s_lastTime = currentTime;
    s_totalTime += s_deltaTime;
    
    // Cap delta time to prevent large jumps
    if (s_deltaTime > 0.1f) {
        s_deltaTime = 0.1f;
    }
    
    // Calculate FPS
    s_fpsAccumulator += s_deltaTime;
    s_fpsFrames++;
    if (s_fpsAccumulator >= 1.0f) {
        s_fps = s_fpsFrames / s_fpsAccumulator;
        s_fpsAccumulator = 0.0f;
        s_fpsFrames = 0;
    }
}

} // namespace Arena
