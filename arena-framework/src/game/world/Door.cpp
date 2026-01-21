#include "Door.h"
#include <algorithm>

namespace Arena {

void DoorSystem::Update(Door& door, float deltaTime) {
    const float openSpeed = 2.0f; // Units per second
    
    switch (door.state) {
        case DoorState::Opening:
            door.openProgress += openSpeed * deltaTime;
            if (door.openProgress >= 1.0f) {
                door.openProgress = 1.0f;
                door.state = DoorState::Open;
            }
            break;
            
        case DoorState::Closing:
            door.openProgress -= openSpeed * deltaTime;
            if (door.openProgress <= 0.0f) {
                door.openProgress = 0.0f;
                door.state = DoorState::Closed;
            }
            break;
            
        default:
            break;
    }
}

bool DoorSystem::CanOpen(const Door& door) {
    return door.state == DoorState::Closed && !door.locked;
}

bool DoorSystem::TryOpen(Door& door, int keyId) {
    if (door.locked) {
        if (TryUnlock(door, keyId)) {
            door.state = DoorState::Opening;
            return true;
        }
        return false; // Still locked
    }
    
    if (door.state == DoorState::Closed) {
        door.state = DoorState::Opening;
        return true;
    }
    
    return false;
}

void DoorSystem::Close(Door& door) {
    if (door.state == DoorState::Open) {
        door.state = DoorState::Closing;
    }
}

bool DoorSystem::TryUnlock(Door& door, int keyId) {
    if (!door.locked) {
        return true; // Already unlocked
    }
    
    if (keyId == door.lockId || door.lockId == 0) {
        door.locked = false;
        return true;
    }
    
    return false; // Wrong key
}

bool DoorSystem::IsOpen(const Door& door) {
    return door.state == DoorState::Open;
}

bool DoorSystem::IsClosed(const Door& door) {
    return door.state == DoorState::Closed;
}

bool DoorSystem::IsLocked(const Door& door) {
    return door.locked;
}

} // namespace Arena
