#include "UIRenderer.h"
#include "Renderer2D.h"
#define WIN32_LEAN_AND_MEAN
#include <SDL2/SDL_opengl.h>
#undef DrawText  // Undefine Windows macro if present
#include <algorithm>

namespace Arena {

bool UIRenderer::s_initialized = false;
int UIRenderer::s_screenWidth = 0;
int UIRenderer::s_screenHeight = 0;
int UIRenderer::s_focusId = 0;

void UIRenderer::Init(int screenWidth, int screenHeight) {
    s_screenWidth = screenWidth;
    s_screenHeight = screenHeight;
    s_focusId = 0;
    s_initialized = true;
}

void UIRenderer::Shutdown() {
    s_initialized = false;
}

void UIRenderer::Begin() {
    Renderer2D::BeginFrame();
}

void UIRenderer::End() {
    Renderer2D::EndFrame();
}

void UIRenderer::DrawPanel(float x, float y, float width, float height, uint32_t bgColor, uint32_t borderColor) {
    // Background
    Renderer2D::DrawRect(x, y, width, height, bgColor, true);
    
    // Border
    Renderer2D::DrawRect(x, y, width, height, borderColor, false);
}

void UIRenderer::DrawPanelWithPadding(float x, float y, float width, float height, float padding, uint32_t bgColor, uint32_t borderColor) {
    DrawPanel(x, y, width, height, bgColor, borderColor);
    // Padding is handled by caller when drawing content
}

void UIRenderer::DrawText(Font& font, const char* text, float x, float y, uint32_t color, float scale) {
    uint8_t r, g, b, a;
    Renderer2D::GetColor(color, r, g, b, a);
    
    glColor4ub(r, g, b, a);
    font.DrawText(text, x, y, scale);
    glColor4ub(255, 255, 255, 255); // Reset color
}

void UIRenderer::DrawTextCentered(Font& font, const char* text, float x, float y, float width, uint32_t color, float scale) {
    float textWidth = font.GetTextWidth(text, scale);
    float startX = x + (width - textWidth) * 0.5f;
    DrawText(font, text, startX, y, color, scale);
}

void UIRenderer::DrawButton(Button& button, Font& font, uint32_t bgColor, uint32_t hoverColor, uint32_t textColor) {
    uint32_t currentBgColor = button.hovered ? hoverColor : bgColor;
    DrawPanel(button.x, button.y, button.width, button.height, currentBgColor, 0xFFFFFFFF);
    
    DrawTextCentered(font, button.text, button.x, button.y, button.width, textColor, 1.0f);
}

bool UIRenderer::IsButtonClicked(Button& button, float mouseX, float mouseY, bool mouseDown) {
    bool inside = mouseX >= button.x && mouseX <= button.x + button.width &&
                  mouseY >= button.y && mouseY <= button.y + button.height;
    
    button.hovered = inside;
    
    if (inside && mouseDown) {
        button.pressed = true;
        return true;
    }
    
    button.pressed = false;
    return false;
}

void UIRenderer::DrawProgressBar(float x, float y, float width, float height, float progress, uint32_t bgColor, uint32_t fillColor, uint32_t borderColor) {
    progress = std::max(0.0f, std::min(1.0f, progress));
    
    // Background
    Renderer2D::DrawRect(x, y, width, height, bgColor, true);
    
    // Fill
    float fillWidth = width * progress;
    if (fillWidth > 0.0f) {
        Renderer2D::DrawRect(x, y, fillWidth, height, fillColor, true);
    }
    
    // Border
    Renderer2D::DrawRect(x, y, width, height, borderColor, false);
}

void UIRenderer::SetFocus(int focusId) {
    s_focusId = focusId;
}

} // namespace Arena
