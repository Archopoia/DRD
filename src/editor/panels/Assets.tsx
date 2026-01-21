'use client';

import { useState } from 'react';
import * as THREE from 'three';
import Prefabs from './Prefabs';
import { PrefabManager } from '@/game/ecs/prefab/PrefabManager';
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
}

type AssetTab = 'prefabs' | 'materials' | 'scripts';

/**
 * Assets Panel - Game asset browser (Unity/Creation Engine style)
 * Organized for level editing and asset management
 * 
 * Tabs:
 * - Prefabs: Reusable entity templates (NPCs, Items, Props, Environments)
 * - Materials: Materials and textures (placeholder for future)
 * - Scripts: Behavior scripts (placeholder for future)
 */
export default function Assets({ prefabManager, entityManager, entityFactory, selectedObject, onPrefabInstantiated, onPrefabCreated }: AssetsProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('prefabs');
  const [searchQuery, setSearchQuery] = useState('');

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
            title="Coming soon"
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
            title="Coming soon"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Scripts</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-gray-700 flex-shrink-0">
          <input
            type="text"
            placeholder={activeTab === 'prefabs' ? 'Search prefabs...' : 'Search...'}
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

        {/* Materials Tab - Placeholder */}
        {activeTab === 'materials' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
              Materials & Textures
              <br />
              <span className="text-gray-600 mt-2 block">Coming soon</span>
              <span className="text-gray-600 text-xs mt-1 block">
                Material editor for creating and managing materials, textures, and shaders
              </span>
            </div>
          </div>
        )}

        {/* Scripts Tab - Placeholder */}
        {activeTab === 'scripts' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
              Behavior Scripts
              <br />
              <span className="text-gray-600 mt-2 block">Coming soon</span>
              <span className="text-gray-600 text-xs mt-1 block">
                Script editor for creating entity behaviors, interactions, and game logic
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
