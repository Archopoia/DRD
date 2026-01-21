#include "Menu.h"
#include "framework/renderer/UIRenderer.h"
#include <SDL2/SDL.h>

namespace Arena {

Menu::Menu()
    : m_state(MenuState::None)
    , m_selectedItem(0)
{
}

void Menu::Show(MenuState state) {
    m_state = state;
    m_selectedItem = 0;
}

void Menu::Hide() {
    m_state = MenuState::None;
    m_selectedItem = 0;
}

void Menu::Update(float deltaTime) {
    // Menu doesn't need per-frame updates
}

void Menu::Render(Font& font, int screenWidth, int screenHeight) {
    if (!IsVisible()) return;
    
    UIRenderer::Begin();
    
    switch (m_state) {
        case MenuState::Main:
            RenderMainMenu(font, screenWidth, screenHeight);
            break;
        case MenuState::Settings:
            RenderSettingsMenu(font, screenWidth, screenHeight);
            break;
        case MenuState::Pause:
            RenderPauseMenu(font, screenWidth, screenHeight);
            break;
        default:
            break;
    }
    
    UIRenderer::End();
}

void Menu::RenderMainMenu(Font& font, int screenWidth, int screenHeight) {
    float centerX = screenWidth * 0.5f;
    float startY = screenHeight * 0.3f;
    float itemSpacing = 50.0f;
    
    const char* items[] = { "New Game", "Load Game", "Settings", "Quit" };
    int numItems = 4;
    
    // Title
    UIRenderer::DrawTextCentered(font, "ARENA FRAMEWORK", centerX, startY - 80, screenWidth, 0xFFFFFFFF, 1.5f);
    
    // Menu items
    for (int i = 0; i < numItems; i++) {
        float y = startY + i * itemSpacing;
        uint32_t color = (i == m_selectedItem) ? 0xFFFF00FF : 0xFFFFFFFF;
        UIRenderer::DrawTextCentered(font, items[i], centerX, y, screenWidth, color, 1.0f);
    }
}

void Menu::RenderSettingsMenu(Font& font, int screenWidth, int screenHeight) {
    float centerX = screenWidth * 0.5f;
    float startY = screenHeight * 0.3f;
    
    UIRenderer::DrawTextCentered(font, "SETTINGS", centerX, startY - 80, screenWidth, 0xFFFFFFFF, 1.5f);
    UIRenderer::DrawTextCentered(font, "Settings menu - Coming soon", centerX, startY, screenWidth, 0xFFFFFFFF, 1.0f);
    UIRenderer::DrawTextCentered(font, "Press ESC to go back", centerX, startY + 50, screenWidth, 0x808080FF, 0.8f);
}

void Menu::RenderPauseMenu(Font& font, int screenWidth, int screenHeight) {
    float centerX = screenWidth * 0.5f;
    float startY = screenHeight * 0.3f;
    float itemSpacing = 50.0f;
    
    const char* items[] = { "Resume", "Settings", "Main Menu", "Quit" };
    int numItems = 4;
    
    // Semi-transparent overlay
    UIRenderer::DrawPanel(0, 0, screenWidth, screenHeight, 0x00000080, 0);
    
    // Title
    UIRenderer::DrawTextCentered(font, "PAUSED", centerX, startY - 80, screenWidth, 0xFFFFFFFF, 1.5f);
    
    // Menu items
    for (int i = 0; i < numItems; i++) {
        float y = startY + i * itemSpacing;
        uint32_t color = (i == m_selectedItem) ? 0xFFFF00FF : 0xFFFFFFFF;
        UIRenderer::DrawTextCentered(font, items[i], centerX, y, screenWidth, color, 1.0f);
    }
}

void Menu::HandleInput(float mouseX, float mouseY, bool mouseDown) {
    // Mouse input handling (simplified)
}

void Menu::HandleKeyInput(int key) {
    switch (m_state) {
        case MenuState::Main:
            HandleMainMenuInput(key);
            break;
        case MenuState::Settings:
            HandleSettingsMenuInput(key);
            break;
        case MenuState::Pause:
            HandlePauseMenuInput(key);
            break;
        default:
            break;
    }
}

void Menu::HandleMainMenuInput(int key) {
    const int numItems = 4;
    
    if (key == SDLK_UP || key == SDLK_w) {
        m_selectedItem = (m_selectedItem - 1 + numItems) % numItems;
    } else if (key == SDLK_DOWN || key == SDLK_s) {
        m_selectedItem = (m_selectedItem + 1) % numItems;
    } else if (key == SDLK_RETURN || key == SDLK_e) {
        switch (m_selectedItem) {
            case 0: // New Game
                Hide();
                // TODO: Start new game
                break;
            case 1: // Load Game
                // TODO: Show load game menu
                break;
            case 2: // Settings
                Show(MenuState::Settings);
                break;
            case 3: // Quit
                // TODO: Quit game
                break;
        }
    }
}

void Menu::HandleSettingsMenuInput(int key) {
    if (key == SDLK_ESCAPE) {
        Show(MenuState::Main);
    }
}

void Menu::HandlePauseMenuInput(int key) {
    const int numItems = 4;
    
    if (key == SDLK_ESCAPE) {
        Hide();
    } else if (key == SDLK_UP || key == SDLK_w) {
        m_selectedItem = (m_selectedItem - 1 + numItems) % numItems;
    } else if (key == SDLK_DOWN || key == SDLK_s) {
        m_selectedItem = (m_selectedItem + 1) % numItems;
    } else if (key == SDLK_RETURN || key == SDLK_e) {
        switch (m_selectedItem) {
            case 0: // Resume
                Hide();
                break;
            case 1: // Settings
                Show(MenuState::Settings);
                break;
            case 2: // Main Menu
                Show(MenuState::Main);
                // TODO: Return to main menu
                break;
            case 3: // Quit
                // TODO: Quit game
                break;
        }
    }
}

} // namespace Arena
