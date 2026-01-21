#include "Dialogue.h"
#include "framework/renderer/UIRenderer.h"
#include <SDL2/SDL.h>
#include <cstring>

namespace Arena {

Dialogue::Dialogue()
    : m_active(false)
    , m_currentNodeId(-1)
    , m_selectedChoice(0)
{
    memset(m_nodes, 0, sizeof(m_nodes));
}

void Dialogue::Start(int startNodeId) {
    m_active = true;
    m_currentNodeId = startNodeId;
    m_selectedChoice = 0;
}

void Dialogue::End() {
    m_active = false;
    m_currentNodeId = -1;
    m_selectedChoice = 0;
}

void Dialogue::Update(float deltaTime) {
    // Dialogue doesn't need per-frame updates
}

void Dialogue::Render(Font& font, int screenWidth, int screenHeight) {
    if (!m_active) return;
    
    const DialogueNode* node = GetCurrentNode();
    if (!node || !node->text) return;
    
    UIRenderer::Begin();
    
    // Draw dialogue panel (bottom of screen)
    float panelHeight = 200.0f;
    float panelY = screenHeight - panelHeight;
    float padding = 20.0f;
    
    UIRenderer::DrawPanel(padding, panelY, screenWidth - padding * 2, panelHeight - padding, 0x404040FF, 0xFFFFFFFF);
    
    // Draw dialogue text
    float textY = panelY + 20.0f;
    UIRenderer::DrawText(font, node->text, padding + 10, textY, 0xFFFFFFFF, 1.0f);
    
    // Draw choices
    if (node->numChoices > 0) {
        float choiceY = textY + 60.0f;
        for (int i = 0; i < node->numChoices; i++) {
            if (node->choices[i]) {
                uint32_t color = (i == m_selectedChoice) ? 0xFFFF00FF : 0xFFFFFFFF;
                UIRenderer::DrawText(font, node->choices[i], padding + 30, choiceY, color, 0.9f);
                choiceY += 25.0f;
            }
        }
    }
    
    UIRenderer::End();
}

void Dialogue::HandleInput(float mouseX, float mouseY, bool mouseDown) {
    if (!m_active) return;
    
    const DialogueNode* node = GetCurrentNode();
    if (!node || node->numChoices == 0) return;
    
    // Simple mouse selection (would need proper hit testing)
    // For now, just handle keyboard
}

void Dialogue::HandleKeyInput(int key) {
    if (!m_active) return;
    
    const DialogueNode* node = GetCurrentNode();
    if (!node) return;
    
    // Arrow keys to select choice
    if (node->numChoices > 0) {
        if (key == SDLK_UP || key == SDLK_w) {
            m_selectedChoice = (m_selectedChoice - 1 + node->numChoices) % node->numChoices;
        } else if (key == SDLK_DOWN || key == SDLK_s) {
            m_selectedChoice = (m_selectedChoice + 1) % node->numChoices;
        } else if (key == SDLK_RETURN || key == SDLK_e) {
            SelectChoice(m_selectedChoice);
        }
    } else {
        // No choices, any key to advance
        if (key == SDLK_RETURN || key == SDLK_e || key == SDLK_SPACE) {
            End();
        }
    }
}

void Dialogue::SelectChoice(int choiceIndex) {
    const DialogueNode* node = GetCurrentNode();
    if (!node || choiceIndex < 0 || choiceIndex >= node->numChoices) {
        return;
    }
    
    int nextNodeId = node->nextNodeIds[choiceIndex];
    if (nextNodeId < 0) {
        End();
    } else {
        m_currentNodeId = nextNodeId;
        m_selectedChoice = 0;
    }
}

void Dialogue::AddNode(int nodeId, const DialogueNode& node) {
    if (nodeId >= 0 && nodeId < 64) {
        m_nodes[nodeId] = node;
    }
}

const DialogueNode* Dialogue::GetCurrentNode() const {
    if (m_currentNodeId < 0 || m_currentNodeId >= 64) {
        return nullptr;
    }
    return &m_nodes[m_currentNodeId];
}

} // namespace Arena
