#pragma once
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Font.h"
#include <cstdint>

namespace Arena {

enum class MenuState {
    Main,
    Settings,
    Pause,
    None
};

class Menu {
public:
    Menu();
    
    void Show(MenuState state);
    void Hide();
    bool IsVisible() const { return m_state != MenuState::None; }
    MenuState GetState() const { return m_state; }
    
    void Update(float deltaTime);
    void Render(Font& font, int screenWidth, int screenHeight);
    
    // Input handling
    void HandleInput(float mouseX, float mouseY, bool mouseDown);
    void HandleKeyInput(int key);

private:
    MenuState m_state;
    int m_selectedItem;
    
    void RenderMainMenu(Font& font, int screenWidth, int screenHeight);
    void RenderSettingsMenu(Font& font, int screenWidth, int screenHeight);
    void RenderPauseMenu(Font& font, int screenWidth, int screenHeight);
    
    void HandleMainMenuInput(int key);
    void HandleSettingsMenuInput(int key);
    void HandlePauseMenuInput(int key);
};

} // namespace Arena
