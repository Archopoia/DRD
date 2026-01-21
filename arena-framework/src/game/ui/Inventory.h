#pragma once
#include "game/items/Item.h"
#include "framework/renderer/UIRenderer.h"
#include "framework/renderer/Font.h"
#include <cstdint>

namespace Arena {

struct InventorySlot {
    Item item;
    bool empty;
    int count; // For stackable items
    
    InventorySlot() : empty(true), count(0) {}
};

class Inventory {
public:
    static const int MAX_SLOTS = 32;
    
    Inventory();
    
    // Item management
    bool AddItem(const Item& item);
    bool RemoveItem(int slotIndex);
    bool HasItem(int itemId) const;
    int FindItemSlot(int itemId) const;
    
    // Slot access
    InventorySlot& GetSlot(int index);
    const InventorySlot& GetSlot(int index) const;
    int GetSlotCount() const { return MAX_SLOTS; }
    
    // Rendering
    void Render(Font& font, float x, float y, float slotSize, bool visible);
    
    // Selection
    void SetSelectedSlot(int slot) { m_selectedSlot = slot; }
    int GetSelectedSlot() const { return m_selectedSlot; }
    
    // UI interaction
    void HandleInput(float mouseX, float mouseY, bool mouseDown);

private:
    InventorySlot m_slots[MAX_SLOTS];
    int m_selectedSlot;
    bool m_visible;
    
    int GetSlotAtPosition(float x, float y, float startX, float startY, float slotSize) const;
};

} // namespace Arena
