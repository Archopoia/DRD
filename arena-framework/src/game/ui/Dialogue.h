#pragma once
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Font.h"
#include <cstdint>

namespace Arena {

struct DialogueNode {
    const char* text;
    int numChoices;
    const char* choices[4];
    int nextNodeIds[4]; // -1 = end dialogue
    
    DialogueNode() 
        : text(nullptr)
        , numChoices(0)
    {
        for (int i = 0; i < 4; i++) {
            choices[i] = nullptr;
            nextNodeIds[i] = -1;
        }
    }
};

class Dialogue {
public:
    Dialogue();
    
    void Start(int startNodeId);
    void End();
    bool IsActive() const { return m_active; }
    
    void Update(float deltaTime);
    void Render(Font& font, int screenWidth, int screenHeight);
    
    // Input handling
    void HandleInput(float mouseX, float mouseY, bool mouseDown);
    void HandleKeyInput(int key);
    
    // Dialogue tree
    void AddNode(int nodeId, const DialogueNode& node);
    const DialogueNode* GetCurrentNode() const;

private:
    bool m_active;
    int m_currentNodeId;
    DialogueNode m_nodes[64];
    int m_selectedChoice;
    
    void SelectChoice(int choiceIndex);
};

} // namespace Arena
