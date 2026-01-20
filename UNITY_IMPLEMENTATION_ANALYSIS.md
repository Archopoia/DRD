# Unity Implementation Analysis: Character Sheet System

## Current Architecture Overview

### Current Stack
- **Frontend**: React (Next.js) with TypeScript
- **UI Framework**: React components with Tailwind CSS
- **Game Engine**: Three.js (custom game loop)
- **State Management**: CharacterSheetManager class (pure TypeScript, no React dependencies)

### Key Components

#### 1. **CharacterSheetManager** (Core Logic - `src/game/character/CharacterSheetManager.ts`)
- **Pure TypeScript class** - No React dependencies
- Manages all character sheet state and calculations
- Contains business logic for:
  - Attributes (8 attributes)
  - Aptitudes (8, calculated from attributes)
  - Competences (72 action competences)
  - Souffrances (8, with resistance competences)
  - Marks system (100 marks per competence/souffrance)
  - Mastery system
  - Experience/free marks

**This is the core that can be directly ported to Unity as C#**

#### 2. **CharacterSheet Component** (UI - `src/components/CharacterSheet.tsx`)
- **React component** - 991 lines
- Handles all UI rendering and interactions
- Uses React hooks (useState, useEffect, useRef)
- Depends on:
  - React DOM rendering
  - CSS/Tailwind for styling
  - React portals for dropdowns
  - Browser DOM events

**Cannot be directly reused in Unity** - Must be reimplemented

#### 3. **UI Components** (`src/components/ui/`)
- `DegreeInput.tsx` - Input with +/- buttons
- `ProgressBar.tsx` - Animated progress bars with text overlay
- `ExpandableSection.tsx` - Collapsible sections
- `Tooltip.tsx` - Hover tooltips
- All are React components with Tailwind CSS

**Cannot be directly reused** - Must be reimplemented in Unity UI Toolkit or UGUI

#### 4. **Data Files** (`src/game/character/data/`)
- `AttributeData.ts` - Attribute enums and helpers
- `AptitudeData.ts` - Aptitude definitions
- `CompetenceData.ts` - Competence definitions
- `ActionData.ts` - Action definitions
- `SouffranceData.ts` - Souffrance definitions
- `MasteryRegistry.ts` - Mastery data

**Can be ported to C#** - These are mostly enums and static data

---

## Unity Implementation Strategy

### Option 1: Unity UI Toolkit (Recommended for Web-like UI)

#### Architecture
```
Unity Project/
├── Scripts/
│   ├── CharacterSheet/
│   │   ├── CharacterSheetManager.cs          (Port from TypeScript)
│   │   ├── CharacterSheetController.cs       (New - UI controller)
│   │   └── Data/
│   │       ├── AttributeData.cs              (Port from TypeScript)
│   │       ├── AptitudeData.cs
│   │       ├── CompetenceData.cs
│   │       ├── ActionData.cs
│   │       ├── SouffranceData.cs
│   │       └── MasteryRegistry.cs
│   └── UI/
│       └── CharacterSheet/
│           ├── CharacterSheetView.uxml       (UI Markup - like HTML)
│           ├── CharacterSheetView.uss        (Styles - like CSS)
│           └── Components/
│               ├── DegreeInput.cs            (UI Element)
│               ├── ProgressBar.cs
│               ├── ExpandableSection.cs
│               └── Tooltip.cs
```

#### Advantages
- **UI Toolkit uses XML (UXML) and CSS (USS)** - Very similar to HTML/CSS
- **Can potentially reuse CSS logic** - USS is similar to CSS
- **Component-based** - Similar to React components
- **Modern Unity UI system** - Better performance than UGUI for complex layouts
- **Flexible styling** - Supports classes, pseudo-selectors, etc.

#### Disadvantages
- **Learning curve** - Different from React
- **No JSX** - Must use XML/UXML instead
- **Event system is different** - Uses C# callbacks instead of React events

#### Porting Process

1. **CharacterSheetManager.cs** (Direct Port)
   - Convert TypeScript class to C# class
   - Interfaces → C# interfaces/structs
   - Record types → Dictionaries or classes
   - Methods remain largely the same
   - Can reuse 90% of the logic

2. **UI Components** (Reimplement)
   - `DegreeInput` → Custom UI Toolkit VisualElement
   - `ProgressBar` → Custom VisualElement with custom drawing
   - `ExpandableSection` → VisualElement with animation
   - `Tooltip` → Custom VisualElement that follows mouse

3. **CharacterSheet View** (Reimplement)
   - React component → UI Toolkit VisualElement class
   - React hooks → C# properties and events
   - State updates → C# events/callbacks
   - JSX → UXML markup

#### Code Example - CharacterSheetManager Port

**TypeScript (Current):**
```typescript
export class CharacterSheetManager {
  private state: CharacterSheetState;
  
  setAttribute(attribute: Attribute, value: number): void {
    this.state.attributes[attribute] = Math.max(-50, Math.min(50, value));
    this.recalculateAptitudes();
  }
}
```

**C# (Unity):**
```csharp
public class CharacterSheetManager
{
    private CharacterSheetState state;
    
    public void SetAttribute(Attribute attribute, int value)
    {
        state.attributes[attribute] = Mathf.Clamp(value, -50, 50);
        RecalculateAptitudes();
    }
}
```

#### Code Example - UI Component

**React (Current):**
```tsx
<DegreeInput
  value={state.attributes[atb1]}
  onChange={(value) => handleAttributeChange(atb1, value)}
  min={-50}
  max={50}
  size="md"
/>
```

**Unity UI Toolkit (Port):**
```csharp
var degreeInput = new DegreeInput();
degreeInput.Value = state.attributes[atb1];
degreeInput.MinValue = -50;
degreeInput.MaxValue = 50;
degreeInput.Size = InputSize.Medium;
degreeInput.OnValueChanged += (value) => HandleAttributeChange(atb1, value);
```

---

### Option 2: Unity UGUI (Traditional Unity UI)

#### Architecture
```
Unity Project/
├── Scripts/
│   └── CharacterSheet/
│       ├── CharacterSheetManager.cs
│       └── CharacterSheetUI.cs (MonoBehaviour)
└── Prefabs/
    └── CharacterSheet/
        ├── CharacterSheetPanel.prefab
        └── Components/
            ├── DegreeInput.prefab
            ├── ProgressBar.prefab
            └── ...
```

#### Advantages
- **Mature system** - Well-documented, many tutorials
- **Visual editor** - Can design UI visually in Unity Editor
- **Component-based** - MonoBehaviour components
- **Rich ecosystem** - Many third-party assets

#### Disadvantages
- **More manual work** - No CSS-like styling
- **Less flexible layouts** - Compared to UI Toolkit
- **Different paradigm** - GameObject-based, not data-driven
- **Harder to maintain complex layouts** - More code for styling

---

### Option 3: React Native for Unity / WebView (NOT RECOMMENDED)

This would allow reusing React components, but:
- **Performance issues** - WebView is slow
- **Integration complexity** - Communication between Unity and WebView
- **Not native feel** - Doesn't match Unity UI style
- **Maintenance burden** - Two UI systems to maintain

**Verdict: Not worth it**

---

## Recommended Approach: Unity UI Toolkit

### Step-by-Step Migration Plan

#### Phase 1: Core Logic Port (Reusable)
1. ✅ Port `CharacterSheetManager.ts` → `CharacterSheetManager.cs`
2. ✅ Port all data files (`AttributeData.ts`, etc.) → C#
3. ✅ Port interfaces and types
4. ✅ Write unit tests to verify logic correctness

**Effort**: Medium (1-2 weeks)
**Reusability**: 90%+ of code can be directly translated

#### Phase 2: UI Foundation
1. ✅ Create UI Toolkit project structure
2. ✅ Set up USS stylesheets (convert Tailwind classes)
3. ✅ Create base VisualElement classes
4. ✅ Implement basic layout system

**Effort**: Medium (1 week)

#### Phase 3: UI Components
1. ✅ Implement `DegreeInput` VisualElement
2. ✅ Implement `ProgressBar` VisualElement
3. ✅ Implement `ExpandableSection` VisualElement
4. ✅ Implement `Tooltip` VisualElement

**Effort**: High (2-3 weeks)

#### Phase 4: Character Sheet View
1. ✅ Create `CharacterSheetView` VisualElement
2. ✅ Implement UXML markup
3. ✅ Connect to CharacterSheetManager
4. ✅ Implement all interactions (expand/collapse, realize, etc.)
5. ✅ Port animations and effects

**Effort**: Very High (3-4 weeks)

#### Phase 5: Integration
1. ✅ Integrate with Unity game systems
2. ✅ Add input handling (keyboard shortcuts)
3. ✅ Performance optimization
4. ✅ Polish and bug fixes

**Effort**: Medium (1-2 weeks)

**Total Estimated Time**: 8-12 weeks

---

## Code Reusability Summary

| Component | Can Reuse? | Porting Effort | Notes |
|-----------|-----------|----------------|-------|
| CharacterSheetManager | ✅ Yes (90%) | Medium | Direct TypeScript → C# translation |
| Data Files (enums, static data) | ✅ Yes (95%) | Low | Mostly copy-paste with syntax changes |
| CharacterSheet React Component | ❌ No | Very High | Must reimplement in UI Toolkit |
| UI Components (DegreeInput, etc.) | ❌ No | High | Must reimplement as VisualElements |
| CSS/Tailwind Styles | ⚠️ Partial | Medium | Can convert to USS, but syntax differs |
| Business Logic | ✅ Yes (90%) | Medium | Core calculations are reusable |
| State Management Pattern | ⚠️ Partial | Medium | Unity uses events/callbacks, not hooks |

---

## Key Differences: React vs Unity UI Toolkit

| Aspect | React (Current) | Unity UI Toolkit |
|--------|----------------|------------------|
| **Component Model** | Functional components with hooks | VisualElement classes with properties |
| **State Management** | useState, useEffect | C# properties, events, callbacks |
| **Rendering** | JSX → Virtual DOM → DOM | UXML → VisualElement tree |
| **Styling** | CSS/Tailwind classes | USS (similar to CSS) |
| **Events** | onClick, onChange handlers | RegisterCallback<ClickEvent> |
| **Animations** | CSS transitions/animations | USS transitions, C# animations |
| **Data Binding** | Props, state updates | Properties, events |
| **Lifecycle** | useEffect, componentDidMount | OnEnable, OnDisable (MonoBehaviour) or constructor (VisualElement) |

---

## Recommendations

### ✅ DO:
1. **Port CharacterSheetManager first** - It's the most valuable, reusable code
2. **Use Unity UI Toolkit** - Best match for web-like UI
3. **Keep the same architecture** - Separate data/logic from UI
4. **Convert CSS to USS** - Many styles can be translated
5. **Maintain data file structure** - Keep enums and static data organized the same way

### ❌ DON'T:
1. **Don't try to embed React** - Performance and integration issues
2. **Don't use UGUI for complex layouts** - UI Toolkit is better suited
3. **Don't mix paradigms** - Stick to Unity patterns in Unity code
4. **Don't skip unit tests** - Verify logic porting correctness

### 💡 CONSIDER:
1. **Code generation tools** - Could generate C# from TypeScript interfaces (advanced)
2. **Shared data format** - JSON/YAML for game data (enables data reuse)
3. **UI Toolkit's experimental features** - Some features might help (check Unity version)
4. **Third-party UI Toolkit libraries** - May provide React-like patterns

---

## Example: Converting CSS to USS

**Current Tailwind/CSS:**
```css
.bg-parchment-aged {
  background-color: #d4c5a0;
}
.border-border-dark {
  border-color: #643030;
  border-width: 2px;
}
.font-medieval {
  font-family: 'Medieval', serif;
}
```

**Unity USS (UI Toolkit Stylesheet):**
```css
.bg-parchment-aged {
  background-color: #d4c5a0;
}
.border-border-dark {
  border-color: #643030;
  border-width: 2px;
}
.font-medieval {
  -unity-font: url('project://database/Assets/Fonts/Medieval.ttf');
}
```

**Note**: USS syntax is very similar to CSS, but with Unity-specific properties (prefixed with `-unity-`).

---

## Conclusion

**Can you reuse UI files directly?** ❌ **No** - React/TSX components cannot run in Unity.

**Can you reuse the logic and architecture?** ✅ **Yes** - CharacterSheetManager and data files can be ported with ~90% code reuse.

**Best approach:** Port the core logic (CharacterSheetManager) to C#, then reimplement the UI in Unity UI Toolkit, which is the closest Unity equivalent to React/CSS web development.

**Estimated effort:** 8-12 weeks for a complete port, with most time spent on UI reimplementation rather than logic porting.

---

## Visual Parity Considerations

**Important:** CSS → USS conversion will **NOT achieve 100% visual parity** due to USS limitations.

See `VISUAL_PARITY_ANALYSIS.md` for detailed information on:
- CSS features that cannot be replicated in USS
- Visual similarity estimates (70-100% depending on approach)
- Options for achieving true visual parity (WebView embedding)
- Recommendations for practical approaches

**Quick Summary:**
- **Direct CSS → USS:** ~70-80% visual similarity
- **USS + Workarounds:** ~85-90% visual similarity (RECOMMENDED)
- **WebView Embedding:** 100% visual similarity (with performance/UX trade-offs)


