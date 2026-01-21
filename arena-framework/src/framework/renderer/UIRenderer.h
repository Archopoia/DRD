#pragma once
#include "framework/math/Vec2.h"
#include "Renderer2D.h"
#include "Font.h"
#include <cstdint>

namespace Arena {

class UIRenderer {
public:
    static void Init(int screenWidth, int screenHeight);
    static void Shutdown();
    
    // Begin/End UI rendering
    static void Begin();
    static void End();
    
    // Panel drawing
    static void DrawPanel(float x, float y, float width, float height, uint32_t bgColor, uint32_t borderColor);
    static void DrawPanelWithPadding(float x, float y, float width, float height, float padding, uint32_t bgColor, uint32_t borderColor);
    
    // Text rendering
    static void DrawText(Font& font, const char* text, float x, float y, uint32_t color, float scale = 1.0f);
    static void DrawTextCentered(Font& font, const char* text, float x, float y, float width, uint32_t color, float scale = 1.0f);
    
    // Button
    struct Button {
        float x, y, width, height;
        const char* text;
        bool hovered;
        bool pressed;
    };
    
    static void DrawButton(Button& button, Font& font, uint32_t bgColor, uint32_t hoverColor, uint32_t textColor);
    static bool IsButtonClicked(Button& button, float mouseX, float mouseY, bool mouseDown);
    
    // Progress bar
    static void DrawProgressBar(float x, float y, float width, float height, float progress, uint32_t bgColor, uint32_t fillColor, uint32_t borderColor);
    
    // Input focus management
    static void SetFocus(int focusId);
    static int GetFocus() { return s_focusId; }
    static bool HasFocus(int focusId) { return s_focusId == focusId; }

private:
    static bool s_initialized;
    static int s_screenWidth;
    static int s_screenHeight;
    static int s_focusId;
};

} // namespace Arena
