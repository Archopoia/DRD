'use client';

import { useState, useEffect } from 'react';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import Prefabs from './Prefabs';
import { PrefabManager } from '@/game/ecs/prefab/PrefabManager';

// Dynamically import BrushEditor to avoid SSR issues
const BrushEditor = dynamic(() => import('@/editor/brushes/BrushEditor'), {
  ssr: false,
});
import { EntityManager } from '@/game/ecs/EntityManager';
import { EntityFactory } from '@/game/ecs/factories/EntityFactory';
import { Entity } from '@/game/ecs/Entity';

interface AssetsProps {
  prefabManager?: PrefabManager | null;
  entityManager?: EntityManager | null;
  entityFactory?: EntityFactory | null;
  selectedObject?: THREE.Object3D | null;
  onPrefabInstantiated?: (entity: Entity) => void;
  onPrefabCreated?: () => void;
  materialLibrary?: any; // MaterialLibrary instance
  scriptLoader?: any; // ScriptLoader instance (optional)
}

type AssetTab = 'prefabs' | 'materials' | 'scripts' | 'brushes';

/**
 * Assets Panel - Game asset browser (Unity/Creation Engine style)
 * Organized for level editing and asset management
 * 
 * Tabs:
 * - Prefabs: Reusable entity templates (NPCs, Items, Props, Environments)
 * - Materials: Materials and textures (placeholder for future)
 * - Scripts: Behavior scripts (placeholder for future)
 */
export default function Assets({ prefabManager, entityManager, entityFactory, selectedObject, onPrefabInstantiated, onPrefabCreated, materialLibrary, scriptLoader, renderer, physicsWorld }: AssetsProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('prefabs');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<Array<{ id: string; name: string; diffuse: string }>>([]);
  
  // Known scripts - these are the scripts that exist in src/game/scripts/
  // Users can create more in Cursor.ai following the same pattern
  const [availableScripts] = useState([
    { 
      path: 'scripts/triggers/door', 
      name: 'Door Script',
      description: 'Opens/closes door when triggered',
      category: 'triggers'
    },
    { 
      path: 'scripts/triggers/spawn', 
      name: 'Spawn Script',
      description: 'Spawns entities when triggered',
      category: 'triggers'
    },
    { 
      path: 'scripts/triggers/levelTransition', 
      name: 'Level Transition',
      description: 'Transitions to another level',
      category: 'triggers'
    },
  ]);

  // Load materials from MaterialLibrary
  useEffect(() => {
    if (materialLibrary && activeTab === 'materials') {
      const materialDefs = materialLibrary.getAllMaterialDefinitions();
      setMaterials(materialDefs.map(m => ({
        id: m.id,
        name: m.name,
        diffuse: m.diffuse,
      })));
    }
  }, [materialLibrary, activeTab]);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Toolbar with Tabs */}
      <div className="flex-shrink-0 border-b border-gray-700">
        {/* Tabs - Scrollable */}
        <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('prefabs')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'prefabs'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <span>Prefabs</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            <span>Materials</span>
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Scripts</span>
          </button>
          <button
            onClick={() => setActiveTab('brushes')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'brushes'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            <span>Brushes</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-gray-700 flex-shrink-0">
          <input
            type="text"
            placeholder={activeTab === 'prefabs' ? 'Search prefabs...' : activeTab === 'materials' ? 'Search materials...' : activeTab === 'scripts' ? 'Search scripts...' : activeTab === 'brushes' ? 'Search brushes...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
        {/* Prefabs Tab - Primary asset browser */}
        {activeTab === 'prefabs' && (
          <Prefabs
            prefabManager={prefabManager}
            entityManager={entityManager}
            entityFactory={entityFactory}
            selectedObject={selectedObject}
            onPrefabInstantiated={onPrefabInstantiated}
            onPrefabCreated={onPrefabCreated}
          />
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="h-full overflow-y-auto">
            {!materialLibrary ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
                  Material Library not available
                </div>
              </div>
            ) : materials.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
                  No materials loaded
                  <br />
                  <span className="text-gray-600 text-xs mt-1 block">
                    Materials are loaded from public/game/assets/materials/
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                {materials
                  .filter(mat => 
                    searchQuery === '' || 
                    mat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mat.id.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((material) => {
                    // Parse color from hex string
                    let backgroundColor = '#808080'; // Default gray
                    
                    if (material.diffuse) {
                      if (material.diffuse.startsWith('#')) {
                        backgroundColor = material.diffuse;
                      } else {
                        // Try to parse as hex without #
                        backgroundColor = `#${material.diffuse}`;
                      }
                    }
                    
                    // Validate hex color format
                    if (!backgroundColor.match(/^#[0-9A-Fa-f]{6}$/)) {
                      backgroundColor = '#808080'; // Fallback to gray
                    }
                    
                    return (
                      <div
                        key={material.id}
                        className="bg-gray-700 rounded border border-gray-600 p-2 hover:border-blue-500 cursor-pointer transition-colors flex flex-col"
                        title={`${material.name} (${material.id})`}
                      >
                        {/* Material Preview - Color Swatch */}
                        <div 
                          className="w-full rounded mb-2 border-2 border-gray-500 flex-shrink-0"
                          style={{
                            backgroundColor: backgroundColor,
                            height: '80px',
                            width: '100%',
                            minHeight: '80px',
                          }}
                        >
                          {/* Empty content - just color background */}
                        </div>
                        {/* Material Info */}
                        <div className="text-xs font-mono text-white truncate font-semibold" title={material.name}>
                          {material.name}
                        </div>
                        <div className="text-xs font-mono text-gray-400 truncate mt-0.5" title={material.id}>
                          {material.id}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Brushes Tab */}
        {activeTab === 'brushes' && (
          <BrushEditor
            entityManager={entityManager || null}
            renderer={renderer || null}
            physicsWorld={physicsWorld || null}
            onBrushCreated={(entity) => {
              if (entityManager) {
                const obj3d = entityManager.getObject3D(entity);
                if (obj3d && onPrefabInstantiated) {
                  // Select the newly created brush
                  onPrefabInstantiated(entity);
                }
              }
            }}
          />
        )}

        {/* Scripts Tab - Cursor.ai Integration */}
        {activeTab === 'scripts' && (
          <div className="h-full overflow-y-auto p-2">
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded">
              <div className="text-xs font-mono text-blue-300 mb-1 font-semibold">
                🤖 Cursor.ai Integration
              </div>
              <div className="text-xs font-mono text-blue-200/80">
                Scripts are edited directly in Cursor.ai. This panel helps you navigate and manage scripts.
                Create new scripts in <code className="bg-gray-800 px-1 rounded">src/game/scripts/</code>
              </div>
            </div>

            {/* Script Template Section */}
            <div className="mb-4">
              <div className="text-xs font-mono font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <span>Create New Script</span>
              </div>
              <button
                onClick={() => {
                  // Provide template for creating new script
                  const template = `import { IScript, ScriptContext } from '@/game/scripts/types';

/**
 * Your Script Name
 * Description of what this script does
 */
const myScript: IScript = {
  onEnter: (context: ScriptContext) => {
    console.log('[MyScript] Entity entered trigger', context.entity.id);
    // Your code here
  },
  
  onExit: (context: ScriptContext) => {
    console.log('[MyScript] Entity exited trigger', context.entity.id);
    // Your code here
  },
  
  onUpdate: (context: ScriptContext, deltaTime: number) => {
    // Called every frame while entity is in trigger
    // Your code here
  }
};

export default myScript;`;
                  
                  // Copy template to clipboard
                  navigator.clipboard.writeText(template).then(() => {
                    alert('Script template copied to clipboard!\n\n1. Create a new file in Cursor: src/game/scripts/triggers/yourScript.ts\n2. Paste the template\n3. Customize it\n4. Use the script path in triggers: "scripts/triggers/yourScript"');
                  }).catch(() => {
                    console.log('Template:', template);
                  });
                }}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-white text-xs font-mono text-left flex items-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy Script Template
              </button>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                Copy the template, create a new file in Cursor, then paste and customize
              </div>
            </div>

            {/* Existing Scripts List */}
            <div className="mb-4">
              <div className="text-xs font-mono font-semibold text-gray-400 mb-2">
                Available Scripts
              </div>
              <div className="space-y-2">
                {availableScripts
                  .filter(script => 
                    searchQuery === '' || 
                    script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    script.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    script.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((script) => (
                    <div
                      key={script.path}
                      className="bg-gray-700 rounded border border-gray-600 p-3 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono text-white font-semibold truncate" title={script.name}>
                            {script.name}
                          </div>
                          <div className="text-xs font-mono text-gray-400 truncate mt-0.5" title={script.path}>
                            {script.path}
                          </div>
                          <div className="text-xs font-mono text-gray-500 mt-1">
                            {script.description}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Show file path for opening in Cursor
                            const filePath = `src/game/${script.path}.ts`;
                            alert(`Open in Cursor.ai:\n\n${filePath}\n\n1. Press Ctrl+P (Cmd+P on Mac) in Cursor\n2. Type: ${filePath}\n3. Or navigate to: src/game/scripts/triggers/\n\nScripts are loaded automatically from file paths.`);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono rounded flex-shrink-0 transition-colors"
                          title={`Open ${script.path}.ts in Cursor`}
                        >
                          📁 Open
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="text-xs text-gray-500 font-mono">
                          Usage: Set script path in Trigger Component Inspector as: <code className="bg-gray-800 px-1 rounded">{script.path}</code>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Script Documentation */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
              <div className="text-xs font-mono font-semibold text-gray-400 mb-2">
                Script Integration Guide
              </div>
              <div className="text-xs font-mono text-gray-500 space-y-1">
                <div>1. Create scripts in <code className="bg-gray-900 px-1 rounded">src/game/scripts/</code></div>
                <div>2. Export scripts as default IScript objects</div>
                <div>3. Reference scripts by path (without .ts extension)</div>
                <div>4. Use in Trigger Components via the Inspector</div>
                <div>5. Scripts auto-reload when saved in Cursor (hot reload)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
