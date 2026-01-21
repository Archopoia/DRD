#include "Item.h"
#include <cmath>

namespace Arena {

void ItemSystem::Update(Item& item, float deltaTime) {
    // Items don't need much updating
    // Could add floating animation, rotation, etc.
}

bool ItemSystem::CanPickup(const Item& item, const Vec2& playerPos, float pickupRange) {
    if (item.pickedUp) {
        return false;
    }
    
    float dist = (item.position - playerPos).Length();
    return dist <= pickupRange;
}

void ItemSystem::Pickup(Item& item) {
    item.pickedUp = true;
}

void ItemSystem::SpawnItem(Item& item, const Vec2& position, ItemType type, const char* name) {
    item.position = position;
    item.type = type;
    item.name = name;
    item.pickedUp = false;
    item.spriteId = (uint32_t)type; // Simple sprite mapping
}

} // namespace Arena
