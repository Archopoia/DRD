#pragma once

namespace Arena {

struct InputState {
    bool key_down[256];
    bool key_pressed[256];
    bool key_released[256];
    
    bool mouse_down[8];
    bool mouse_pressed[8];
    bool mouse_released[8];
    
    float mouse_x;
    float mouse_y;
    float mouse_delta_x;
    float mouse_delta_y;
    
    bool mouse_locked;
    
    InputState();
    void ResetFrame();
};

class Input {
public:
    static void Init();
    static void Update();
    static void ProcessEvent(void* event);
    
    static const InputState& GetState() { return s_state; }
    
    static bool IsKeyDown(int keycode);
    static bool IsKeyPressed(int keycode);
    static bool IsKeyReleased(int keycode);
    
    static bool IsMouseDown(int button);
    static bool IsMousePressed(int button);
    static bool IsMouseReleased(int button);
    
    static void GetMousePosition(float& x, float& y);
    static void GetMouseDelta(float& dx, float& dy);

private:
    static InputState s_state;
    static InputState s_prevState;
};

} // namespace Arena
