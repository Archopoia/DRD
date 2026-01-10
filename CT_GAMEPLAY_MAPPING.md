# CT (Competence) to Gameplay Action Mapping

This document maps currently implemented in-game actions to their corresponding CTs (Competences) for XP tracking.

## Currently Implemented Actions

### 1. **Walking/Running** → `Competence.PAS` (Pas)
- **Location**: `src/game/camera/FPSCamera.ts` (keyboard input), `src/game/physics/CharacterController.ts` (movement)
- **Input**: WASD keys (moveForward, moveBackward, moveLeft, moveRight)
- **Sprint modifier**: Shift key (`run` boolean)
- **CT**: `Competence.PAS` (Pas - walking/running)
- **When to mark active**:
  - When any movement key is pressed (W, A, S, D)
  - While the character is moving (direction.length() > 0)
  - Both walking and sprinting use the same CT `PAS`
- **Implementation note**: Already partially implemented in `Scene.ts` for environmental damage, but not yet in the main movement loop

### 2. **Jumping** → `Competence.SAUT` (Saut)
- **Location**: `src/game/camera/FPSCamera.ts` (keyboard input), `src/game/physics/CharacterController.ts` (jump mechanics)
- **Input**: Space key (`jump()` method)
- **CT**: `Competence.SAUT` (Saut - jumping)
- **When to mark active**:
  - When Space key is pressed and character is grounded
  - At the moment `jump()` is called (not continuously, just the action itself)
- **Implementation note**: Not yet implemented

### 3. **Pushing Blocks** → `Competence.POID` (Poid)
- **Location**: `src/game/physics/CharacterController.ts` (collision handling)
- **Mechanic**: When character collides with dynamic physics bodies, they can be pushed
- **CT**: `Competence.POID` (Poid - lifting/carrying/strength)
- **When to mark active**:
  - When character successfully pushes a dynamic body (when `applyImpulseAtPoint` is called on a dynamic body)
  - Only mark when pushing, not when just touching/standing on blocks
- **Implementation note**: Not yet implemented - this is a physical interaction that happens during movement

### 4. **Environmental Damage (Walking on Souffrance Platforms)** → `Competence.PAS` (Pas)
- **Location**: `src/game/world/Scene.ts` (platform detection)
- **Mechanic**: When walking on harmful platforms that cause suffering
- **CT**: `Competence.PAS` (Pas - walking, since this is environmental damage from movement)
- **When to mark active**:
  - Already implemented! See `Scene.ts` line ~406: `activeTracker.markActive(Competence.PAS, currentTime);`
- **Status**: ✅ Already implemented

## Summary Table

| Action | CT | Input/Trigger | Status | File Location |
|--------|----|--------------|--------|---------------|
| Walking/Running | `PAS` | WASD keys (continuous) | ⚠️ Not yet implemented | `FPSCamera.ts`, `CharacterController.ts` |
| Sprinting | `PAS` | Shift + WASD | ⚠️ Not yet implemented | `FPSCamera.ts` |
| Jumping | `SAUT` | Space key | ⚠️ Not yet implemented | `FPSCamera.ts`, `CharacterController.ts` |
| Pushing Blocks | `POID` | Collision with dynamic bodies | ⚠️ Not yet implemented | `CharacterController.ts` |
| Environmental Damage | `PAS` | Walking on souffrance platforms | ✅ Implemented | `Scene.ts` |

## Implementation Priority

### High Priority (Core Movement - Most Common Actions)
1. **Walking/Running (`PAS`)** - Most frequent action, should be marked every frame while moving
2. **Jumping (`SAUT`)** - Common action, should be marked when jump is triggered

### Medium Priority (Interactions)
3. **Pushing Blocks (`POID`)** - Less frequent, but represents physical strength usage

### Low Priority (Future Actions)
- Climbing → `GRIMPE`
- Swimming → `NATATION`
- Attacking → `ARME`, `DESARME`, `IMPROVISE`
- Dodging → `ESQUIVE`
- Lockpicking → `HABILETE`
- Talking/Negotiation → `NEGOCIATION`, `SEDUCTION`, etc.

## Implementation Guidelines

### When to Mark CTs as Active

1. **Continuous actions** (walking, running):
   - Mark every frame while the action is active
   - Example: While `moveForward || moveBackward || moveLeft || moveRight`, mark `PAS`
   - The XP timeframe (2s) resets continuously as long as you're moving

2. **Discrete actions** (jumping, pushing):
   - Mark once when the action is triggered
   - Example: When Space is pressed, mark `SAUT` once
   - Example: When a block is pushed, mark `POID` once
   - The XP timeframe starts from that point and lasts 2 seconds

3. **Multiple CTs simultaneously**:
   - Multiple CTs can be active at the same time
   - Example: Running + Jumping = `PAS` + `SAUT` both active
   - Example: Running + Pushing = `PAS` + `POID` both active
   - Each has its own independent 2-second XP timeframe

### Code Example

```typescript
// In FPSCamera.ts - updatePosition() method
// Get active competences tracker from health system (via Game class)
const activeTracker = game.healthSystem.getActiveCompetencesTracker();

// Mark PAS as active while moving
if (this.direction.length() > 0) {
  activeTracker.markActive(Competence.PAS);
}

// Mark SAUT as active when jumping (already handled in onKeyDown)
// This should be done when Space is pressed, before calling characterController.jump()
```

## Notes

- The environmental damage system in `Scene.ts` already shows a good example of marking `PAS` as active
- The `ActiveCompetencesTracker` is accessible via `healthSystem.getActiveCompetencesTracker()`
- All CT marking should happen in the game loop/update methods, not in the constructor
- Remember: marking a CT as active resets its XP timeframe to another 2 seconds from that point

