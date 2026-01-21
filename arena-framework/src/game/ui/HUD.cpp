#include "HUD.h"
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Renderer2D.h"
#include "framework/math/Vec2.h"
#include <cstdio>

namespace Arena {

HUD::HUD()
    : m_showMinimap(true)
    , m_showCrosshair(true)
{
}

void HUD::Render(Font& font, const Player& player, int screenWidth, int screenHeight) {
    UIRenderer::Begin();
    
    // Health bar (bottom left)
    DrawHealthBar(font, 20.0f, screenHeight - 60.0f, 200.0f, 30.0f, player);
    
    // Crosshair (center)
    if (m_showCrosshair) {
        DrawCrosshair(screenWidth * 0.5f, screenHeight * 0.5f, 20.0f);
    }
    
    // Minimap (top right)
    if (m_showMinimap) {
        DrawMinimap(font, screenWidth - 220.0f, 20.0f, 200.0f, player);
    }
    
    // Status indicators (top left)
    DrawStatusIndicators(font, 20.0f, 20.0f);
    
    UIRenderer::End();
}

void HUD::DrawHealthBar(Font& font, float x, float y, float width, float height, const Player& player) {
    const Stats& stats = player.GetStats();
    float healthPercent = (float)stats.health / (float)stats.maxHealth;
    
    uint32_t bgColor = 0x400000FF;
    uint32_t fillColor = 0xFF0000FF;
    if (healthPercent > 0.6f) {
        fillColor = 0x00FF00FF;
    } else if (healthPercent > 0.3f) {
        fillColor = 0xFFFF00FF;
    }
    uint32_t borderColor = 0xFFFFFFFF;
    
    UIRenderer::DrawProgressBar(x, y, width, height, healthPercent, bgColor, fillColor, borderColor);
    
    // Health text
    char healthText[32];
    snprintf(healthText, sizeof(healthText), "HP: %d/%d", stats.health, stats.maxHealth);
    UIRenderer::DrawText(font, healthText, x + 5, y + 5, 0xFFFFFFFF, 0.8f);
}

void HUD::DrawCrosshair(float x, float y, float size) {
    float halfSize = size * 0.5f;
    uint32_t color = 0xFFFFFFFF;
    
    // Horizontal line
    Renderer2D::DrawLine(x - halfSize, y, x + halfSize, y, color);
    // Vertical line
    Renderer2D::DrawLine(x, y - halfSize, x, y + halfSize, color);
}

void HUD::DrawMinimap(Font& font, float x, float y, float size, const Player& player) {
    // Draw minimap background
    UIRenderer::DrawPanel(x, y, size, size, 0x202020FF, 0xFFFFFFFF);
    
    // Draw player position (center of minimap)
    float playerX = x + size * 0.5f;
    float playerY = y + size * 0.5f;
    
    // Draw player dot
    Renderer2D::DrawCircle(playerX, playerY, 3.0f, 0x00FF00FF, true);
    
    // Draw player direction
    Vec2 dir = player.GetCamera().GetDirection();
    Renderer2D::DrawLine(playerX, playerY, playerX + dir.x * 10.0f, playerY + dir.y * 10.0f, 0x00FF00FF);
    
    // Minimap label
    UIRenderer::DrawText(font, "Map", x + 5, y + 5, 0xFFFFFFFF, 0.7f);
}

void HUD::DrawStatusIndicators(Font& font, float x, float y) {
    // Placeholder for status indicators (poison, buffs, etc.)
    // For now, just draw FPS or other debug info
}

} // namespace Arena
