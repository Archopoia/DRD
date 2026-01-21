#pragma once
#include "framework/math/Vec2.h"
#include <cstdint>

namespace Arena {

enum class DoorState {
    Closed,
    Opening,
    Open,
    Closing,
    Locked
};

struct Door {
    Vec2 position;
    DoorState state;
    float openProgress; // 0.0 = closed, 1.0 = open
    bool locked;
    int lockId; // Key ID needed to unlock (0 = no key needed)
    
    Door() 
        : position(0.0f, 0.0f)
        , state(DoorState::Closed)
        , openProgress(0.0f)
        , locked(false)
        , lockId(0)
    {
    }
};

class DoorSystem {
public:
    static void Update(Door& door, float deltaTime);
    
    // Interaction
    static bool CanOpen(const Door& door);
    static bool TryOpen(Door& door, int keyId = 0);
    static void Close(Door& door);
    static bool TryUnlock(Door& door, int keyId);
    
    // State queries
    static bool IsOpen(const Door& door);
    static bool IsClosed(const Door& door);
    static bool IsLocked(const Door& door);
};

} // namespace Arena
