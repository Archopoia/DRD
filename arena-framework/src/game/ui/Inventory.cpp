#include "Inventory.h"
#include "framework/renderer/UIRenderer.h"
#include <algorithm>

namespace Arena {

Inventory::Inventory()
    : m_selectedSlot(0)
    , m_visible(false)
{
}

bool Inventory::AddItem(const Item& item) {
    // Find empty slot
    for (int i = 0; i < MAX_SLOTS; i++) {
        if (m_slots[i].empty) {
            m_slots[i].item = item;
            m_slots[i].empty = false;
            m_slots[i].count = 1;
            return true;
        }
    }
    
    return false; // Inventory full
}

bool Inventory::RemoveItem(int slotIndex) {
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
        return false;
    }
    
    if (m_slots[slotIndex].empty) {
        return false;
    }
    
    m_slots[slotIndex].empty = true;
    m_slots[slotIndex].count = 0;
    return true;
}

bool Inventory::HasItem(int itemId) const {
    return FindItemSlot(itemId) >= 0;
}

int Inventory::FindItemSlot(int itemId) const {
    for (int i = 0; i < MAX_SLOTS; i++) {
        if (!m_slots[i].empty && m_slots[i].item.id == itemId) {
            return i;
        }
    }
    return -1;
}

InventorySlot& Inventory::GetSlot(int index) {
    static InventorySlot invalidSlot;
    if (index < 0 || index >= MAX_SLOTS) {
        return invalidSlot;
    }
    return m_slots[index];
}

const InventorySlot& Inventory::GetSlot(int index) const {
    static InventorySlot invalidSlot;
    if (index < 0 || index >= MAX_SLOTS) {
        return invalidSlot;
    }
    return m_slots[index];
}

void Inventory::Render(Font& font, float x, float y, float slotSize, bool visible) {
    m_visible = visible;
    if (!visible) return;
    
    const int slotsPerRow = 8;
    const float padding = 4.0f;
    const float panelWidth = slotsPerRow * slotSize + (slotsPerRow + 1) * padding;
    const float panelHeight = (MAX_SLOTS / slotsPerRow) * slotSize + ((MAX_SLOTS / slotsPerRow) + 1) * padding;
    
    // Draw panel
    UIRenderer::DrawPanel(x, y, panelWidth, panelHeight, 0x404040FF, 0xFFFFFFFF);
    
    // Draw slots
    for (int i = 0; i < MAX_SLOTS; i++) {
        int row = i / slotsPerRow;
        int col = i % slotsPerRow;
        
        float slotX = x + padding + col * (slotSize + padding);
        float slotY = y + padding + row * (slotSize + padding);
        
        // Slot background
        uint32_t slotColor = (i == m_selectedSlot) ? 0x808080FF : 0x202020FF;
        UIRenderer::DrawPanel(slotX, slotY, slotSize, slotSize, slotColor, 0xFFFFFFFF);
        
        // Item
        if (!m_slots[i].empty) {
            // Draw item sprite (placeholder - would use actual sprite rendering)
            // For now, just draw item name
            UIRenderer::DrawText(font, m_slots[i].item.name, slotX + 2, slotY + 2, 0xFFFFFFFF, 0.5f);
            
            // Draw count if > 1
            if (m_slots[i].count > 1) {
                char countStr[16];
                snprintf(countStr, sizeof(countStr), "%d", m_slots[i].count);
                UIRenderer::DrawText(font, countStr, slotX + slotSize - 10, slotY + slotSize - 10, 0xFFFFFFFF, 0.5f);
            }
        }
    }
}

void Inventory::HandleInput(float mouseX, float mouseY, bool mouseDown) {
    if (!m_visible) return;
    
    // Calculate which slot was clicked
    // This is a simplified version - would need actual panel position
    // For now, just handle keyboard selection
}

int Inventory::GetSlotAtPosition(float x, float y, float startX, float startY, float slotSize) const {
    const int slotsPerRow = 8;
    const float padding = 4.0f;
    
    int col = (int)((x - startX - padding) / (slotSize + padding));
    int row = (int)((y - startY - padding) / (slotSize + padding));
    
    if (col < 0 || col >= slotsPerRow || row < 0) {
        return -1;
    }
    
    int slot = row * slotsPerRow + col;
    if (slot >= MAX_SLOTS) {
        return -1;
    }
    
    return slot;
}

} // namespace Arena
