---
name: Arena Framework Game Features Implementation
overview: "Implement six major game features: wall textures, sprite billboarding for NPCs/items, door interactions, enemy AI integration, quest/dialogue systems, and chunk streaming for larger worlds."
todos:
  - id: texture-system
    content: Create Texture class (Texture.h/cpp) for loading and managing OpenGL textures with caching
    status: completed
  - id: wall-textures
    content: Modify Raycaster to render textured walls instead of solid colors, using wallX for texture coordinates
    status: completed
  - id: sprite-billboard
    content: Create SpriteRenderer for billboard sprite rendering with distance-based sorting
    status: completed
  - id: sprite-integration
    content: Integrate sprite rendering into Raycaster render pass for NPCs and items
    status: completed
  - id: door-map-integration
    content: Add door storage to GridMap and create doors at specific map coordinates
    status: completed
  - id: door-interaction
    content: Connect Player::Interact() to detect and open/close doors with key checking
    status: completed
  - id: door-rendering
    content: Render doors in raycaster with open/close animation based on door state
    status: completed
  - id: enemy-spawning
    content: Spawn enemy actors at valid map positions and assign sprites
    status: completed
  - id: enemy-ai-update
    content: Update enemy AI each frame with player position and handle collision
    status: completed
  - id: enemy-rendering
    content: Render enemies as billboard sprites with health bars
    status: completed
  - id: combat-system
    content: Implement player-enemy combat (click to attack, enemy attacks player)
    status: completed
  - id: quest-initialization
    content: Create quest definitions and add to QuestSystem at startup
    status: completed
  - id: quest-tracking
    content: Track quest objectives (enemy kills, item pickups, location reached)
    status: completed
  - id: dialogue-integration
    content: Connect dialogue system to NPC interaction and quest starting
    status: completed
  - id: quest-ui
    content: Render active quests in HUD with progress indicators
    status: completed
  - id: chunk-generation
    content: Implement ChunkManager::GenerateChunk() with procedural dungeon generation
    status: completed
  - id: chunk-streaming
    content: Replace single GridMap with ChunkManager and implement streaming updates
    status: completed
  - id: raycaster-chunks
    content: Modify Raycaster::CastRay() to work with ChunkManager and handle chunk boundaries
    status: completed
---

# Arena Framework Game Features Implementation Plan

This plan covers implementing six major features to transform the framework demo into a playable game prototype.

## Architecture Overview

The implementation will extend existing systems:

- **Texture System**: Add texture loading and caching for wall textures
- **Sprite Rendering**: Integrate billboard sprites into raycaster for NPCs/items
- **Interaction System**: Connect doors to map tiles and player interaction
- **Actor Management**: Spawn, update, and render enemies with AI
- **Quest/Dialogue Integration**: Connect existing systems to gameplay events
- **World Streaming**: Use ChunkManager for larger, streamable worlds

## 1. Wall Textures

### Files to Create/Modify

- `src/framework/renderer/Texture.h` / `Texture.cpp` - Texture loading and management
- `src/framework/renderer/Raycaster.h` / `Raycaster.cpp` - Add texture mapping
- `src/game/main.cpp` - Load and assign textures

### Implementation Steps

1. **Create Texture System** (`Texture.h`/`Texture.cpp`):

   - `Texture::Load(const char* path)` - Load image via AssetLoader, create OpenGL texture
   - `Texture::CreateFromData(uint8_t* data, int w, int h)` - Create texture from RGBA data
   - `Texture::Bind(uint32_t textureId)` - Bind texture for rendering
   - `Texture::GetId()` - Return OpenGL texture ID
   - Static texture cache map to avoid reloading
   - Use `GL_NEAREST` filtering for retro pixelated look

2. **Modify Raycaster** (`Raycaster.cpp`):

   - Add `s_wallTextures[4]` static array (one per wall type)
   - In `RenderFrame()`, replace `DrawLine()` with texture-mapped quad
   - Use `hit.wallX` to calculate texture U coordinate (0-1)
   - Calculate V coordinate based on wall height and draw position
   - Apply distance-based brightness to texture color
   - Draw textured vertical strip using `glBegin(GL_QUADS)` with texture coordinates

3. **Update GridMap** (`GridMap.h`):

   - Add `textureId` field to `Tile` struct (optional, defaults to wallType)

4. **Integration** (`main.cpp`):

   - Load wall textures at startup: `Texture::Load("assets/textures/wall0.png")`
   - Assign textures to `Raycaster::SetWallTexture(wallType, textureId)`

### Key Code Snippet (Raycaster texture mapping):

```cpp
// In RenderFrame(), replace DrawLine() with:
glEnable(GL_TEXTURE_2D);
glBindTexture(GL_TEXTURE_2D, s_wallTextures[hit.wallType]);
float texU = hit.wallX; // Where on wall (0-1)
float brightness = 1.0f / (1.0f + hit.distance * 0.15f);
glColor4f(brightness, brightness, brightness, 1.0f);
glBegin(GL_QUADS);
glTexCoord2f(texU, 0.0f); glVertex2i(x, drawStart);
glTexCoord2f(texU, 1.0f); glVertex2i(x, drawEnd);
glTexCoord2f(texU + 0.01f, 1.0f); glVertex2i(x + 1, drawEnd);
glTexCoord2f(texU + 0.01f, 0.0f); glVertex2i(x + 1, drawStart);
glEnd();
```

## 2. Sprite Billboarding for NPCs/Items

### Files to Create/Modify

- `src/framework/renderer/SpriteRenderer.h` / `SpriteRenderer.cpp` - Billboard sprite renderer
- `src/framework/renderer/Raycaster.h` / `Raycaster.cpp` - Add sprite rendering pass
- `src/game/main.cpp` - Spawn and manage sprites

### Implementation Steps

1. **Create SpriteRenderer** (`SpriteRenderer.h`/`SpriteRenderer.cpp`):

   - `SpriteRenderer::RenderBillboard()` - Render sprite facing camera
   - Takes sprite, world position, camera position/rotation
   - Calculate sprite screen position using perspective projection
   - Transform sprite to face camera (billboard effect)
   - Sort sprites by distance (painter's algorithm) before rendering

2. **Add Sprite Data Structure**:

   - `SpriteEntity` struct: position, sprite ID, scale, visible
   - Store in array/vector in game state

3. **Modify Raycaster** (`Raycaster.cpp`):

   - Add `RenderSprites()` method called after walls
   - For each sprite:
     - Calculate distance from camera
     - Project 3D position to 2D screen coordinates
     - Calculate sprite size based on distance
     - Render using `SpriteBatch::DrawSprite()` with proper transform

4. **Integration** (`main.cpp`):

   - Create sprite entities for NPCs/items
   - Update sprite positions (for animated NPCs)
   - Call `Raycaster::RenderSprites()` after wall rendering

### Key Code Snippet (Sprite projection):

```cpp
Vec2 spriteScreenPos;
float spriteDistance = (spritePos - cameraPos).Length();
Vec2 spriteDir = (spritePos - cameraPos).Normalized();
float spriteAngle = atan2f(spriteDir.y, spriteDir.x) - cameraRot;
float spriteScreenX = screenWidth/2 + tanf(spriteAngle) * screenWidth/2;
float spriteSize = (1.0f / spriteDistance) * spriteScale * screenHeight;
```

## 3. Door Interactions

### Files to Modify

- `src/game/world/GridMap.h` / `GridMap.cpp` - Add door storage
- `src/game/actors/Player.cpp` - Connect E key to door interaction
- `src/game/main.cpp` - Create doors, update door states, render doors

### Implementation Steps

1. **Extend GridMap** (`GridMap.h`):

   - Add `Door* GetDoorAt(int x, int y)` method
   - Add `Door m_doors[MAX_DOORS]` array
   - Add `int m_doorCount` counter

2. **Door Placement** (`main.cpp`):

   - Create doors at specific map coordinates
   - Store door references in GridMap
   - Set door positions and lock states

3. **Player Interaction** (`Player.cpp`):

   - In `Interact()`, cast ray forward from camera
   - Check if ray hits a door tile
   - Call `DoorSystem::TryOpen()` if door found
   - Check player inventory for keys if door is locked

4. **Door Rendering**:

   - In raycaster, check if hit tile has a door
   - If door is open, render opening based on `door.openProgress`
   - Adjust collision: door tile is non-solid when open

5. **Door Updates** (`main.cpp`):

   - Call `DoorSystem::Update()` for each door each frame
   - Update map collision based on door state

### Key Code Snippet (Door interaction):

```cpp
// In Player::Interact()
RaycastHit hit = Raycaster::CastRay(m_camera.GetPosition(), 
    m_camera.GetDirection(), map, 2.0f);
if (hit.hit) {
    Door* door = map.GetDoorAt(hit.mapX, hit.mapY);
    if (door && DoorSystem::CanOpen(*door)) {
        DoorSystem::TryOpen(*door, GetKeyId()); // Check inventory
    }
}
```

## 4. Enemy AI Integration

### Files to Modify

- `src/game/main.cpp` - Spawn enemies, update AI, render as sprites
- `src/game/actors/Actor.cpp` - Improve line-of-sight with raycast

### Implementation Steps

1. **Enemy Spawning** (`main.cpp`):

   - Create array of `Actor` enemies
   - Spawn enemies at valid positions (non-solid tiles)
   - Assign sprites to enemies
   - Set patrol centers and radii

2. **AI Updates** (`main.cpp`):

   - In game loop, call `ActorSystem::UpdateAI()` for each enemy
   - Pass player position for chase/attack logic
   - Handle collision: enemies can't walk through walls
   - Update enemy positions using `Collision::MoveWithSliding()`

3. **Enemy Rendering**:

   - Add enemies to sprite renderer as billboard sprites
   - Use different sprites for different enemy states (idle, attack)
   - Render health bars above enemies

4. **Combat Integration**:

   - When enemy attacks player, call `ActorSystem::Attack()`
   - Update player health
   - When player attacks enemy (click/shoot), damage enemy
   - Remove dead enemies from rendering

5. **Line of Sight** (`Actor.cpp`):

   - Improve `CanSeeTarget()` to use `Raycaster::CastRay()`
   - Check if ray hits wall before reaching target

### Key Code Snippet (Enemy update):

```cpp
// In main.cpp game loop
for (int i = 0; i < enemyCount; i++) {
    ActorSystem::UpdateAI(enemies[i], playerPos, deltaTime);
    // Collision with map
    Vec2 newPos = Collision::MoveWithSliding(
        enemies[i].position, 
        enemies[i].position + moveDelta, 
        *g_testMap);
    enemies[i].position = newPos;
}
```

## 5. Quest and Dialogue Integration

### Files to Modify

- `src/game/main.cpp` - Initialize quests, handle dialogue input, update objectives
- `src/game/ui/Dialogue.cpp` - Connect to input system
- `src/game/systems/QuestSystem.cpp` - Connect to gameplay events

### Implementation Steps

1. **Quest Initialization** (`main.cpp`):

   - Create quest definitions at startup
   - Add quests to `QuestSystem`
   - Example: "Kill 5 enemies", "Find the key", "Reach the exit"

2. **Quest Tracking**:

   - When enemy dies: `QuestSystem::UpdateObjective(questId, 0, enemyId, 1)`
   - When item picked up: `QuestSystem::UpdateObjective(questId, 1, itemId, 1)`
   - When player reaches location: `QuestSystem::UpdateObjective(questId, 2, locationId, 1)`
   - Check completion each update: `QuestSystem::CheckQuestCompletion(questId)`

3. **Dialogue System**:

   - Create dialogue trees for NPCs
   - When player interacts with NPC (E key), start dialogue
   - Render dialogue UI using `Dialogue::Render()`
   - Handle input: arrow keys to select, Enter to confirm
   - Dialogue can start quests: `QuestSystem::StartQuest(questId)`

4. **Quest UI**:

   - Render active quests in HUD
   - Show quest name, description, progress
   - Display quest completion notifications

5. **NPC Interaction**:

   - Add NPCs as sprite entities
   - Check distance to player for interaction
   - Show "Press E to talk" prompt when near NPC

### Key Code Snippet (Quest tracking):

```cpp
// When enemy dies
void OnEnemyKilled(int enemyId) {
    QuestSystem::UpdateObjective(0, 0, enemyId, 1); // Quest 0, type 0 (kill)
    if (QuestSystem::CheckQuestCompletion(0)) {
        QuestSystem::CompleteQuest(0);
        // Show completion message
    }
}
```

## 6. Chunk Streaming for Larger Worlds

### Files to Modify

- `src/game/main.cpp` - Use ChunkManager instead of single GridMap
- `src/game/world/ChunkManager.cpp` - Implement chunk generation
- `src/framework/renderer/Raycaster.cpp` - Support ChunkManager in raycast

### Implementation Steps

1. **Replace GridMap with ChunkManager** (`main.cpp`):

   - Remove `g_testMap` (single GridMap)
   - Use `g_world` (ChunkManager) for all operations
   - Update player to use `ChunkManager` overloads

2. **Chunk Generation** (`ChunkManager.cpp`):

   - Implement `GenerateChunk()` to create dungeon/city per chunk
   - Use chunk coordinates as seed for procedural generation
   - Connect chunks: ensure corridors align at chunk boundaries

3. **Streaming Updates** (`main.cpp`):

   - Call `ChunkManager::UpdateStreaming()` each frame
   - Pass player position and load/unload radii
   - Load chunks within radius, unload distant chunks

4. **Raycaster Support** (`Raycaster.cpp`):

   - Modify `CastRay()` to work with `ChunkManager`
   - Convert world coordinates to chunk coordinates
   - Handle ray crossing chunk boundaries
   - Check multiple chunks if ray spans boundaries

5. **World Coordinates**:

   - All positions use world coordinates (not chunk-relative)
   - `ChunkManager::GetTileAtWorldPos()` converts automatically
   - Player position can be anywhere in world space

### Key Code Snippet (Chunk streaming):

```cpp
// In main.cpp game loop
g_world->UpdateStreaming(g_player->GetPosition(), 3.0f, 5.0f);
// Load chunks within 3 units, unload beyond 5 units

// Raycaster needs to handle chunk boundaries
// In CastRay(), when ray crosses chunk boundary:
int chunkX = (int)floorf(worldX / chunkSize);
int chunkY = (int)floorf(worldY / chunkSize);
Chunk* chunk = chunkManager->GetChunk(chunkX, chunkY);
if (!chunk || !chunk->loaded) continue; // Skip unloaded chunks
```

## Implementation Order

1. **Phase 1: Textures** - Foundation for visual improvements
2. **Phase 2: Sprites** - Enables NPCs and items
3. **Phase 3: Doors** - Simple interaction system
4. **Phase 4: Enemies** - Uses sprites, adds gameplay
5. **Phase 5: Quests/Dialogue** - Gameplay systems
6. **Phase 6: Chunk Streaming** - Scale to larger worlds

## Testing Strategy

- Test each feature independently before integrating
- Create test maps for each feature (textured walls, doors, enemies)
- Verify performance with multiple sprites and chunks
- Test edge cases: chunk boundaries, door states, quest completion

## Dependencies

- Existing systems: Raycaster, GridMap, Actor, Door, Quest, Dialogue, ChunkManager
- AssetLoader for texture loading
- Renderer2D for sprite rendering
- Input system for interactions

## Notes

- Keep retro aesthetic: use pixelated textures, nearest-neighbor filtering
- Use immediate mode OpenGL for simplicity
- Optimize later if needed (sprite batching, chunk caching)
- All features should work with both GridMap and ChunkManager for flexibility