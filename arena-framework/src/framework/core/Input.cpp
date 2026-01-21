#include "Input.h"
#include <cstring>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <SDL2/SDL.h>
#else
#include <SDL2/SDL.h>
#endif

namespace Arena {

InputState::InputState() {
    memset(key_down, 0, sizeof(key_down));
    memset(key_pressed, 0, sizeof(key_pressed));
    memset(key_released, 0, sizeof(key_released));
    memset(mouse_down, 0, sizeof(mouse_down));
    memset(mouse_pressed, 0, sizeof(mouse_pressed));
    memset(mouse_released, 0, sizeof(mouse_released));
    mouse_x = mouse_y = 0.0f;
    mouse_delta_x = mouse_delta_y = 0.0f;
    mouse_locked = false;
}

void InputState::ResetFrame() {
    memset(key_pressed, 0, sizeof(key_pressed));
    memset(key_released, 0, sizeof(key_released));
    memset(mouse_pressed, 0, sizeof(mouse_pressed));
    memset(mouse_released, 0, sizeof(mouse_released));
    mouse_delta_x = 0.0f;
    mouse_delta_y = 0.0f;
}

InputState Input::s_state;
InputState Input::s_prevState;

void Input::Init() {
    s_state = InputState();
    s_prevState = InputState();
}

void Input::Update() {
    // Copy current state to previous
    s_prevState = s_state;
    
    // Reset frame-specific data
    s_state.ResetFrame();
    
    // Update mouse position and delta
    int mx, my;
    int relX, relY;
    Uint32 buttons = SDL_GetMouseState(&mx, &my);
    
    // Use relative mouse mode if enabled (for first-person controls)
    if (SDL_GetRelativeMouseMode()) {
        SDL_GetRelativeMouseState(&relX, &relY);
        s_state.mouse_delta_x = (float)relX;
        s_state.mouse_delta_y = (float)relY;
        s_state.mouse_x = (float)mx;
        s_state.mouse_y = (float)my;
    } else {
        s_state.mouse_x = (float)mx;
        s_state.mouse_y = (float)my;
        // Calculate mouse delta from absolute position
        s_state.mouse_delta_x = s_state.mouse_x - s_prevState.mouse_x;
        s_state.mouse_delta_y = s_state.mouse_y - s_prevState.mouse_y;
    }
    
    // Update mouse button states
    s_state.mouse_down[0] = (buttons & SDL_BUTTON(SDL_BUTTON_LEFT)) != 0;
    s_state.mouse_down[1] = (buttons & SDL_BUTTON(SDL_BUTTON_RIGHT)) != 0;
    s_state.mouse_down[2] = (buttons & SDL_BUTTON(SDL_BUTTON_MIDDLE)) != 0;
    
    // Calculate pressed/released
    for (int i = 0; i < 8; i++) {
        s_state.mouse_pressed[i] = s_state.mouse_down[i] && !s_prevState.mouse_down[i];
        s_state.mouse_released[i] = !s_state.mouse_down[i] && s_prevState.mouse_down[i];
    }
    
    // Update keyboard state
    const Uint8* keystate = SDL_GetKeyboardState(nullptr);
    for (int i = 0; i < 256; i++) {
        SDL_Scancode scancode = (SDL_Scancode)i;
        s_state.key_down[i] = keystate[scancode] != 0;
        s_state.key_pressed[i] = s_state.key_down[i] && !s_prevState.key_down[i];
        s_state.key_released[i] = !s_state.key_down[i] && s_prevState.key_down[i];
    }
}

void Input::ProcessEvent(void* event) {
    SDL_Event* e = (SDL_Event*)event;
    
    switch (e->type) {
        case SDL_MOUSEBUTTONDOWN:
        case SDL_MOUSEBUTTONUP:
        case SDL_MOUSEMOTION:
        case SDL_KEYDOWN:
        case SDL_KEYUP:
            // Handled in Update()
            break;
    }
}

bool Input::IsKeyDown(int keycode) {
    SDL_Scancode scancode = SDL_GetScancodeFromKey(keycode);
    if (scancode < 256) {
        return s_state.key_down[scancode];
    }
    return false;
}

bool Input::IsKeyPressed(int keycode) {
    SDL_Scancode scancode = SDL_GetScancodeFromKey(keycode);
    if (scancode < 256) {
        return s_state.key_pressed[scancode];
    }
    return false;
}

bool Input::IsKeyReleased(int keycode) {
    SDL_Scancode scancode = SDL_GetScancodeFromKey(keycode);
    if (scancode < 256) {
        return s_state.key_released[scancode];
    }
    return false;
}

bool Input::IsMouseDown(int button) {
    if (button >= 0 && button < 8) {
        return s_state.mouse_down[button];
    }
    return false;
}

bool Input::IsMousePressed(int button) {
    if (button >= 0 && button < 8) {
        return s_state.mouse_pressed[button];
    }
    return false;
}

bool Input::IsMouseReleased(int button) {
    if (button >= 0 && button < 8) {
        return s_state.mouse_released[button];
    }
    return false;
}

void Input::GetMousePosition(float& x, float& y) {
    x = s_state.mouse_x;
    y = s_state.mouse_y;
}

void Input::GetMouseDelta(float& dx, float& dy) {
    dx = s_state.mouse_delta_x;
    dy = s_state.mouse_delta_y;
}

} // namespace Arena
