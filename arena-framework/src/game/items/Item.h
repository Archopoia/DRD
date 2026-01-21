#pragma once
#include "framework/math/Vec2.h"
#include <cstdint>

namespace Arena {

enum class ItemType {
    Weapon,
    Armor,
    Consumable,
    Key,
    Misc
};

struct Item {
    ItemType type;
    uint32_t spriteId;
    Vec2 position;
    bool pickedUp;
    int id; // Unique identifier
    
    // Properties
    const char* name;
    int value;
    
    Item() 
        : type(ItemType::Misc)
        , spriteId(0)
        , position(0.0f, 0.0f)
        , pickedUp(false)
        , id(0)
        , name("Item")
        , value(0)
    {
    }
};

class ItemSystem {
public:
    static void Update(Item& item, float deltaTime);
    static bool CanPickup(const Item& item, const Vec2& playerPos, float pickupRange = 1.0f);
    static void Pickup(Item& item);
    
    // Spawning
    static void SpawnItem(Item& item, const Vec2& position, ItemType type, const char* name);
};

} // namespace Arena
