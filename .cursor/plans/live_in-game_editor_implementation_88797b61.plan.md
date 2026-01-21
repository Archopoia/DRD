---
name: Live In-Game Editor Implementation
overview: Transform the game into a unified gameplay/editing experience where playing IS editing. Add fly mode, tile editing, entity manipulation, visual feedback, and undo/redo - all accessible at runtime with no separation between editor and gameplay.
todos:
  - id: edit-mode-system
    content: Create EditMode class to manage edit mode state and toggle (F2 key)
    status: completed
  - id: fly-mode-camera
    content: Extend RaycastCamera to support 3D position (height) and add fly mode movement to Player
    status: completed
  - id: fly-mode-input
    content: "Implement fly mode controls: WASD horizontal, Space up, Ctrl down, mouse pitch/yaw"
    status: completed
  - id: tile-editor
    content: Create TileEditor class for placing/removing walls and changing wall types
    status: completed
  - id: tile-selection
    content: Implement raycast-based tile selection under cursor in edit mode
    status: completed
  - id: entity-editor
    content: Create EntityEditor class for spawning, selecting, moving, and deleting entities
    status: completed
  - id: entity-selection
    content: Implement entity selection by clicking (raycast to sprite positions)
    status: completed
  - id: visual-feedback
    content: Create EditorRenderer for tile highlights, entity gizmos, and grid overlay
    status: completed
  - id: property-editor
    content: Create PropertyEditor for runtime editing of entity properties (position, stats, etc.)
    status: completed
  - id: undo-redo
    content: Implement UndoSystem with command pattern for undo/redo (Ctrl+Z/Ctrl+Y)
    status: completed
  - id: save-load
    content: Add save/load world state functionality (F5 save, F9 load) with entity data
    status: completed
  - id: edit-mode-integration
    content: Integrate all editing systems into main game loop with proper input handling
    status: completed
---

# Live In-Game Editor Implementation Plan

Transform the game into a unified gameplay/editing system where playing the game IS editing the world. No separation between editor and gameplay - everything is editable at runtime.

## Architecture Overview

The system will add:

- **Edit Mode Toggle**: Switch between play/edit modes (F2 key)
- **Fly Mode**: Free camera movement with vertical control (Space/Ctrl)
- **Tile Editing**: Place/remove walls, change wall types in real-time
- **Entity Editing**: Spawn, move, delete, and modify enemies, doors, items
- **Visual Feedback**: Highlight selected tiles/entities, show gizmos
- **Property Editing**: Change stats, positions, properties on the fly
- **Undo/Redo**: Safe editing with undo/redo (Ctrl+Z/Ctrl+Y)
- **Save/Load**: Save edited world state to disk

## Core Systems

### 1. Edit Mode System

**Files to Create/Modify:**

- `src/game/editor/EditMode.h` / `EditMode.cpp` - Edit mode state and management
- `src/game/actors/Player.h` / `Player.cpp` - Add edit mode support
- `src/game/main.cpp` - Integrate edit mode toggle

**Implementation:**

- `EditMode` class manages edit state (enabled/disabled)
- Toggle with F2 key
- When enabled: fly mode active, editing tools available
- When disabled: normal gameplay (collision, combat, etc.)
- Store edit mode state globally or in Player

**Key Code Structure:**

```cpp
class EditMode {
public:
    static bool IsActive() { return s_active; }
    static void Toggle() { s_active = !s_active; }
    static void SetActive(bool active) { s_active = active; }
private:
    static bool s_active;
};
```

### 2. Fly Mode Camera

**Files to Modify:**

- `src/framework/renderer/RaycastCamera.h` / `RaycastCamera.cpp` - Add Z-axis support
- `src/game/actors/Player.h` / `Player.cpp` - Add fly mode movement

**Implementation:**

- Extend `RaycastCamera` to support 3D position (Vec3 instead of Vec2)
- Add `m_height` or use Vec3 for position
- In fly mode:
  - WASD: Move horizontally (no collision)
  - Space: Move up
  - Ctrl: Move down
  - Mouse: Look around (pitch + yaw)
- Speed multiplier (Shift for faster, Alt for slower)
- No collision checks in fly mode

**Key Changes:**

```cpp
// RaycastCamera.h - Add height support
Vec3 GetPosition3D() const { return Vec3(m_position.x, m_position.y, m_height); }
void SetHeight(float height) { m_height = height; }
float GetHeight() const { return m_height; }

// Player.cpp - Fly mode movement
if (EditMode::IsActive()) {
    // Fly mode: no collision, vertical movement
    Vec3 moveDir(0, 0, 0);
    if (Input::IsKeyDown(SDLK_w)) moveDir += forward;
    if (Input::IsKeyDown(SDLK_s)) moveDir -= forward;
    if (Input::IsKeyDown(SDLK_a)) moveDir -= right;
    if (Input::IsKeyDown(SDLK_d)) moveDir += right;
    if (Input::IsKeyDown(SDLK_SPACE)) moveDir.z += 1.0f;
    if (Input::IsKeyDown(SDLK_LCTRL)) moveDir.z -= 1.0f;
    // Apply movement directly (no collision)
}
```

### 3. Tile Editing System

**Files to Create/Modify:**

- `src/game/editor/TileEditor.h` / `TileEditor.cpp` - Tile manipulation
- `src/game/world/GridMap.h` / `GridMap.cpp` - Add editing methods
- `src/game/main.cpp` - Handle tile editing input

**Implementation:**

- Cast ray from camera to find tile under cursor
- Left click: Place wall (or toggle solid)
- Right click: Remove wall (set non-solid)
- Middle click / Scroll: Cycle wall types
- Show highlighted tile outline in edit mode
- Store tile changes for undo/redo

**Key Methods:**

```cpp
class TileEditor {
public:
    static void EditTileAt(GridMap& map, int x, int y, EditAction action);
    static void PlaceWall(GridMap& map, int x, int y, uint8_t wallType);
    static void RemoveWall(GridMap& map, int x, int y);
    static void CycleWallType(GridMap& map, int x, int y);
    static void GetTileUnderCursor(const RaycastCamera& camera, const GridMap& map, 
                                   int screenX, int screenY, int screenWidth, 
                                   int& outX, int& outY);
};
```

### 4. Entity Editing System

**Files to Create/Modify:**

- `src/game/editor/EntityEditor.h` / `EntityEditor.cpp` - Entity manipulation
- `src/game/main.cpp` - Handle entity editing

**Implementation:**

- Select entities by clicking (raycast to sprite positions)
- Selected entity highlighted
- Gizmos for moving entities (drag to reposition)
- Delete selected entity (Delete key)
- Duplicate entity (Ctrl+D))
- Spawn new entity at cursor (keyboard shortcuts: 1=enemy, 2=door, 3=item)
- Property panel (show selected entity stats, editable)

**Key Methods:**

```cpp
class EntityEditor {
public:
    static Actor* SelectEnemyAt(const Vec2& worldPos, Actor* enemies, int count);
    static void MoveEntity(Actor& entity, const Vec2& newPos);
    static void DeleteEntity(Actor& entity);
    static Actor* SpawnEnemyAt(GridMap& map, const Vec2& pos);
    static Door* SpawnDoorAt(GridMap& map, const Vec2& pos);
};
```

### 5. Visual Feedback System

**Files to Create/Modify:**

- `src/game/editor/EditorRenderer.h` / `EditorRenderer.cpp` - Visual editing aids
- `src/game/main.cpp` - Render editor visuals

**Implementation:**

- Highlight tile under cursor (wireframe box or colored overlay)
- Show selected entity (outline, gizmo handles)
- Grid overlay (optional, toggle with G key)
- Show entity bounds (boxes around enemies/items)
- Distance indicators
- Property text overlays (health, position, etc.)

**Key Features:**

```cpp
class EditorRenderer {
public:
    static void RenderTileHighlight(int x, int y, const GridMap& map, 
                                    const RaycastCamera& camera, int screenWidth, int screenHeight);
    static void RenderEntityGizmo(const Vec2& pos, uint32_t color);
    static void RenderGrid(const GridMap& map, const RaycastCamera& camera);
    static void RenderEntityInfo(const Actor& entity, const Vec2& screenPos);
};
```

### 6. Undo/Redo System

**Files to Create:**

- `src/game/editor/UndoSystem.h` / `UndoSystem.cpp` - Command pattern for undo/redo

**Implementation:**

- Command pattern: each edit creates a command
- Commands stored in undo stack
- Undo (Ctrl+Z): Pop from undo stack, execute reverse, push to redo
- Redo (Ctrl+Y): Pop from redo stack, execute, push to undo
- Limit stack size (e.g., 50 commands)

**Command Types:**

- `TileEditCommand`: Tile placement/removal
- `EntitySpawnCommand`: Entity creation
- `EntityDeleteCommand`: Entity removal
- `EntityMoveCommand`: Entity position change
- `PropertyEditCommand`: Entity property change

**Key Structure:**

```cpp
class EditCommand {
public:
    virtual ~EditCommand() {}
    virtual void Execute() = 0;
    virtual void Undo() = 0;
};

class UndoSystem {
public:
    static void ExecuteCommand(std::unique_ptr<EditCommand> cmd);
    static void Undo();
    static void Redo();
    static bool CanUndo() { return !s_undoStack.empty(); }
    static bool CanRedo() { return !s_redoStack.empty(); }
};
```

### 7. Property Editor

**Files to Create:**

- `src/game/editor/PropertyEditor.h` / `PropertyEditor.cpp` - Runtime property editing
- `src/game/main.cpp` - Property editor UI

**Implementation:**

- When entity selected, show property panel
- Editable fields: position (X, Y), health, attack, defense, speed
- For doors: locked state, lock ID
- For tiles: wall type, floor type, ceiling type
- Use keyboard input for values (Tab to cycle fields, Enter to confirm)
- Or use mouse wheel to adjust values

**Key Methods:**

```cpp
class PropertyEditor {
public:
    static void EditActorProperty(Actor& actor, const char* property, float value);
    static void EditDoorProperty(Door& door, const char* property, int value);
    static void RenderPropertyPanel(const Actor* selectedActor, int screenX, int screenY);
};
```

### 8. Save/Load Edited World

**Files to Modify:**

- `src/game/world/GridMap.cpp` - Enhanced save format
- `src/game/main.cpp` - Save/load hotkeys

**Implementation:**

- Save world state (F5): Save current map + entities to file
- Load world state (F9): Load map + entities from file
- Save format: Binary or JSON (JSON for human-readable editing)
- Include: map tiles, doors, enemy positions/stats, items
- Auto-save option (periodic saves)

**Key Methods:**

```cpp
// GridMap.cpp - Enhanced save
bool SaveWorldState(const char* path, const GridMap& map, 
                   const Actor* enemies, int enemyCount,
                   const Door* doors, int doorCount);

bool LoadWorldState(const char* path, GridMap& map,
                   Actor* enemies, int& enemyCount,
                   Door* doors, int& doorCount);
```

## Input Mapping

**Edit Mode Controls:**

- **F2**: Toggle edit mode
- **WASD**: Move horizontally (fly mode)
- **Space**: Move up (fly mode)
- **Ctrl**: Move down (fly mode)
- **Shift**: Faster movement
- **Alt**: Slower movement
- **Mouse**: Look around (pitch + yaw in fly mode)

**Editing Controls:**

- **Left Click**: Place/edit tile or select entity
- **Right Click**: Remove tile or delete entity
- **Middle Click / Scroll**: Cycle wall type or adjust property
- **Delete**: Delete selected entity
- **1-9**: Spawn entity types (1=enemy, 2=door, 3=item, etc.)
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **F5**: Save world
- **F9**: Load world
- **G**: Toggle grid overlay

**Property Editing:**

- **Tab**: Cycle through property fields
- **Enter**: Confirm property change
- **Mouse Wheel**: Adjust numeric values
- **Arrow Keys**: Fine-tune values

## Implementation Order

1. **Edit Mode Toggle** - Foundation for all editing features
2. **Fly Mode** - Essential for free movement and editing
3. **Tile Editing** - Core world editing functionality
4. **Visual Feedback** - Makes editing intuitive
5. **Entity Editing** - Spawn, select, move entities
6. **Property Editor** - Modify entity properties
7. **Undo/Redo** - Safety net for editing
8. **Save/Load** - Persist edited worlds

## Integration Points

**Player System:**

- Add `m_editMode` flag or check `EditMode::IsActive()`
- Conditional movement: fly mode vs. ground movement
- Conditional interaction: editing vs. gameplay

**Main Game Loop:**

- Check edit mode state
- Handle edit mode input
- Render editor visuals when in edit mode
- Update selected entity/property editor

**Raycaster:**

- No changes needed (already supports 3D via height)
- Editor visuals rendered as overlay

**GridMap:**

- Add editing methods (already has GetTile/SetTile via GetTile reference)
- Track dirty state for save prompts

## Visual Design

**Edit Mode Indicators:**

- "EDIT MODE" text in top-left corner
- Different cursor (crosshair becomes selection cursor)
- Grid overlay (optional, toggle with G)
- Highlighted tiles/entities

**Property Panel:**

- Bottom-right corner overlay
- Shows selected entity properties
- Editable text fields
- Color-coded by property type

**Gizmos:**

- Selected entity: colored outline
- Movement gizmo: arrows or handles
- Tile highlight: wireframe box or colored quad

## Testing Strategy

- Test fly mode movement (all directions, speeds)
- Test tile placement/removal
- Test entity spawning/selection/movement
- Test undo/redo with various operations
- Test save/load with edited worlds
- Verify edit mode doesn't break gameplay mode
- Test property editing (all entity types)

## Notes

- Keep edit mode simple and intuitive
- All editing should feel immediate and responsive
- Visual feedback is crucial for good editing experience
- Undo/redo prevents frustration from mistakes
- Save/load allows iterative world building
- Consider adding copy/paste for entities (Ctrl+C/Ctrl+V)
- Hotkeys should be customizable (future enhancement)