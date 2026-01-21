---
name: Editor/Engine Comparison Analysis
overview: Comprehensive comparison between current editor/engine and Doom/Arena-style editor requirements, identifying features to remove and missing capabilities.
todos:
  - id: analyze-current
    content: Analyze current editor/engine architecture and features
    status: completed
  - id: research-requirements
    content: Research Doom/Arena editor requirements and features
    status: completed
  - id: identify-removals
    content: Identify features that should be removed from editor (TTRPG runtime data)
    status: completed
  - id: identify-missing
    content: Identify missing critical features (brush editing, grid, triggers, scripts)
    status: completed
  - id: create-comparison
    content: Create comprehensive comparison document with priorities
    status: completed
    dependencies:
      - analyze-current
      - research-requirements
      - identify-removals
      - identify-missing
---

# Editor/Engine Comparison: Current vs Doom/Arena Requirements

## Executive Summary

Your current editor/engine is a **modern 3D entity editor** with ECS architecture, similar to Unity/Unreal. To become a full Doom/Arena-style editor/engine, it needs **level/map editing tools** and **gameplay scripting capabilities**, while removing some TTRPG-specific runtime data from the editor.

---

## Current Architecture

### ✅ What You Have

1. **ECS Foundation** (`src/game/ecs/`)

- Entity/Component/System architecture
- EntityManager, EntityFactory
- Components: Transform, MeshRenderer, Physics, Light
- Prefab system
- Scene serialization (JSON)

2. **Editor UI** (`src/editor/`)

- React-based panel system
- Scene Hierarchy
- Inspector (Transform, Component properties)
- Assets panel (Prefabs)
- 3D Viewport with orbit camera
- Transform gizmos (translate/rotate/scale)
- History system (undo/redo)
- Console

3. **Engine Core** (`src/game/`)

- Three.js renderer with retro shaders
- Rapier physics engine
- Character controller
- First-person camera
- Game loop

4. **Storage**

- Scene save/load (IndexedDB)
- Prefab storage (localStorage)

---

## Doom/Arena Editor Requirements

### Core Level Editing Features

#### 1. **Map/Level Editing**

- **Brush-based geometry** (Doom Builder style)
- **Grid/snap system** for precise placement
- **Sector/room system** (Doom) or **portal-based** (Arena)
- **Vertex editing** for fine control
- **2D orthographic views** (top, side, front) + 3D perspective
- **BSP tree generation** for visibility optimization

#### 2. **Texture/Material System**

- **Material library browser** with thumbnails
- **Texture assignment to faces/surfaces** (not just objects)
- **UV mapping tools**
- **Texture coordinates editing**
- **Material property editor** (diffuse, normal, specular, etc.)

#### 3. **Lighting System**

- **Light placement tools**
- **Light properties editor** (type, color, intensity, range, shadows)
- **Dynamic vs static lighting**
- **Lightmap baking** (for performance)
- **Time-of-day lighting** (Arena)

#### 4. **Entity/Thing Placement**

- **Spawn point placement** (player start)
- **NPC placement** with properties
- **Item/weapon placement**
- **Trigger zone placement** (invisible volumes)
- **Interactive object placement** (doors, switches, containers)

#### 5. **Scripting & Triggers**

- **Script editor** (ACS-style or JavaScript)
- **Trigger zones** with event assignment
- **Entity scripts** (behaviors, AI, quests)
- **Level scripts** (ambient effects, music triggers)
- **Dialog system editor** (Arena)

#### 6. **Audio System**

- **Sound source placement**
- **Ambient audio zones**
- **Music triggers**
- **3D spatial audio** setup

#### 7. **Level Management**

- **Multiple level support**
- **Level transitions/portals**
- **Level list/manager**
- **World state management** (persistent variables across levels)

#### 8. **Procedural Generation** (Arena-specific)

- **Dungeon generator tools**
- **City generator**
- **Room templates** (prefabs)
- **Procedural rule editor**

#### 9. **Navigation**

- **Nav mesh generation**
- **Pathfinding setup**
- **Region assignment** (Arena)

#### 10. **Optimization Tools**

- **Visibility culling** (sectors/portals)
- **LOD system**
- **Occlusion culling**

---

## What Should Be Removed/Ditched

### ❌ Features That Don't Belong in Editor

1. **Character Sheet Data in Assets Panel**

- Location: `src/editor/panels/Assets.tsx` - "Game Data" tab
- Issue: Competences, Attributes, Aptitudes are **runtime data**, not editor assets
- Action: Remove or move to runtime-only debug panel
- Keep: Prefabs, Materials, Scripts tabs (but implement them properly)

2. **TTRPG-Specific Editor Features**

- The editor shouldn't know about TTRPG mechanics
- Character sheet is a **runtime UI**, not an editor tool
- Keep editor generic for any game type

---

## What's Missing - Priority Breakdown

### 🔴 Critical Missing Features

1. **Brush/Geometry Editing**

- No way to create custom geometry in editor
- Only primitive shapes (box, sphere, etc.)
- Missing: Vertex editing, face editing, boolean operations
- Required for: Doom-style level building

2. **Grid/Snap System**

- No grid overlay in viewport
- No snap-to-grid option
- Required for: Precise level building

3. **Texture/Material Assignment to Faces**

- Materials are per-object only
- No UV editing
- No texture coordinate manipulation
- Required for: Proper level texturing

4. **Trigger Zone System**

- No trigger volume placement
- No event system
- Required for: Gameplay scripting

5. **Script Editor**

- Placeholder only (`src/editor/panels/Assets.tsx`)
- Required for: Level scripts, entity behaviors

### 🟡 Important Missing Features

6. **2D Orthographic Views**

- Only 3D perspective viewport
- Missing: Top, side, front views
- Required for: Precise level editing

7. **Lighting Tools**

- Basic light placement exists, but:
- No light properties editor in inspector
- No lighting preview/bake
- Required for: Atmospheric level design

8. **Entity/Thing Placement**

- Basic object placement exists
- Missing: Spawn points, NPCs, items, interactive objects
- Missing: Entity templates/library
- Required for: Populating levels

9. **Level Management**

- Single scene only
- No level list/manager
- No level transitions
- Required for: Multi-level games

10. **Portal System** (Arena-specific)

- No portal rendering
- No portal-based culling
- Required for: Large open worlds

### 🟢 Nice-to-Have Features

11. **Procedural Generation Tools**

- No dungeon generator UI
- No procedural rule editor
- Required for: Arena-style world generation

12. **Navigation Mesh**

- No nav mesh generation
- No pathfinding setup
- Required for: NPC AI

13. **Audio Placement**

- No sound source placement
- Required for: Ambient audio

14. **BSP/Visibility Optimization**

- No BSP tree generation
- No visibility culling
- Required for: Performance optimization

---

## Architecture Recommendations

### Keep Your Current Foundation ✅

1. **ECS System** - Perfect for entity-based editing
2. **Prefab System** - Essential for reusable assets
3. **Scene Save/Load** - Foundation for level management
4. **Transform Gizmos** - Great for object manipulation
5. **History System** - Critical for undo/redo
6. **Component Inspector** - Expand for more component types

### Enhance Existing Systems 🔧

1. **Inspector Panel**

- Add: Material/texture editor
- Add: Light properties editor
- Add: Trigger zone properties
- Add: Script assignment

2. **Assets Panel**

- Implement: Material library browser
- Implement: Entity template browser
- Implement: Script editor (code editor)
- Remove: Game Data tab (TTRPG runtime data)

3. **Viewport**

- Add: Grid overlay
- Add: Snap-to-grid option
- Add: 2D orthographic views (top/side/front)
- Add: Camera tools (focus on selection, frame all)

4. **Scene Hierarchy**

- Add: Layer management
- Add: Grouping/ungrouping
- Add: Entity filtering/search

### New Systems Needed 🆕

1. **Brush System** (`src/editor/brushes/`)

- Brush creation tools
- Vertex/face editing
- Boolean operations
- Geometry optimization

2. **Material Editor** (`src/editor/material/`)

- Material library
- Texture import/assignment
- UV editor
- Material property editor

3. **Trigger System** (`src/editor/triggers/`)

- Trigger zone component
- Event system
- Script assignment UI

4. **Level Manager** (`src/editor/levels/`)

- Level list/manager
- Level transition setup
- World state management

5. **Script Editor** (`src/editor/scripts/`)

- Code editor (Monaco or CodeMirror)
- Script template system
- Script debugging

---

## Implementation Priority

### Phase 1: Foundation (Most Critical)

1. Grid/snap system in viewport
2. Material/texture assignment to faces
3. Trigger zone system
4. Remove TTRPG runtime data from editor

### Phase 2: Core Level Editing

5. Brush-based geometry editing
6. 2D orthographic views
7. Entity/thing placement templates
8. Script editor implementation

### Phase 3: Advanced Features

9. Lighting tools and preview
10. Portal system (if Arena-style)
11. Level manager
12. Audio placement

### Phase 4: Optimization

13. BSP/visibility culling
14. Nav mesh generation
15. Procedural generation tools

---

## Files to Modify/Create

### Files to Modify

- `src/editor/panels/Assets.tsx` - Remove Game Data tab, implement Materials/Scripts
- `src/editor/panels/GameViewport.tsx` - Add grid overlay, snap system, 2D views
- `src/editor/panels/InspectorEnhanced.tsx` - Add material/light/trigger editors

### Files to Create

- `src/editor/brushes/BrushTool.ts` - Brush geometry creation
- `src/editor/material/MaterialEditor.tsx` - Material editing panel
- `src/editor/triggers/TriggerZone.ts` - Trigger component
- `src/editor/scripts/ScriptEditor.tsx` - Code editor panel
- `src/editor/levels/LevelManager.tsx` - Level management panel
- `src/game/ecs/components/TriggerComponent.ts` - Trigger zone component
- `src/game/ecs/components/MaterialComponent.ts` - Material properties component

---

## Conclusion

Your editor/engine has a **solid foundation** with ECS architecture and modern tooling. To become a full Doom/Arena editor, you need to add **level/map editing tools** (brushes, grid, textures) and **gameplay scripting** (triggers, scripts, entity placement), while removing TTRPG-specific runtime data from the editor UI.

The good news: Your ECS system can support all these features as components. You're building on a solid architecture.