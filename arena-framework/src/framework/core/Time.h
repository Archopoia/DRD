#pragma once

namespace Arena {

class Time {
public:
    static void Init();
    static void Update();
    
    static float GetDeltaTime() { return s_deltaTime; }
    static float GetTotalTime() { return s_totalTime; }
    static float GetFPS() { return s_fps; }

private:
    static float s_deltaTime;
    static float s_totalTime;
    static float s_fps;
    static float s_lastTime;
    static float s_fpsAccumulator;
    static int s_fpsFrames;
};

} // namespace Arena
