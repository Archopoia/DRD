#pragma once
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Font.h"
#include "game/actors/Player.h"
#include <cstdint>

namespace Arena {

class HUD {
public:
    HUD();
    
    void Render(Font& font, const Player& player, int screenWidth, int screenHeight);
    
    // Elements
    void DrawHealthBar(Font& font, float x, float y, float width, float height, const Player& player);
    void DrawCrosshair(float x, float y, float size);
    void DrawMinimap(Font& font, float x, float y, float size, const Player& player);
    void DrawStatusIndicators(Font& font, float x, float y);

private:
    bool m_showMinimap;
    bool m_showCrosshair;
};

} // namespace Arena
