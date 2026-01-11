'use client';

import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { PrefabManager, Prefab } from '@/game/ecs/prefab/PrefabManager';
import { EntityManager } from '@/game/ecs/EntityManager';
import { Entity } from '@/game/ecs/Entity';
import { EntityFactory } from '@/game/ecs/factories/EntityFactory';

interface PrefabsProps {
  prefabManager?: PrefabManager | null;
  entityManager?: EntityManager | null;
  entityFactory?: EntityFactory | null;
  selectedObject?: THREE.Object3D | null;
  onPrefabInstantiated?: (entity: Entity) => void;
  onPrefabCreated?: () => void;
}

/**
 * Prefabs Panel - Shows and manages prefab templates
 */
export default function Prefabs({ prefabManager, entityManager, entityFactory, selectedObject, onPrefabInstantiated, onPrefabCreated }: PrefabsProps) {
  const [prefabs, setPrefabs] = useState<Prefab[]>([]);
  const [selectedPrefab, setSelectedPrefab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [prefabName, setPrefabName] = useState('New Prefab');

  // Load prefabs
  useEffect(() => {
    if (prefabManager) {
      setPrefabs(prefabManager.getAllPrefabs());
    }
  }, [prefabManager]);

  // Filter prefabs by search
  const filteredPrefabs = prefabs.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle instantiate prefab
  const handleInstantiate = (prefabId: string) => {
    if (!prefabManager || !entityManager) {
      alert('Prefab system not available');
      return;
    }

    try {
      // Note: instantiatePrefab needs renderer and physicsWorld
      // These should be passed from the parent component
      // For now, we'll pass null and let the system handle it
      // TODO: Pass renderer and physicsWorld from GameEditor
      const entity = prefabManager.instantiatePrefab(
        prefabId,
        entityManager,
        null as any, // renderer - should be passed from parent
        null as any, // physicsWorld - should be passed from parent
        { x: 0, y: 1, z: 0 }
      );

      if (entity && onPrefabInstantiated) {
        onPrefabInstantiated(entity);
      }
      
      // Refresh prefabs list
      setPrefabs(prefabManager.getAllPrefabs());
    } catch (error) {
      console.error('Failed to instantiate prefab:', error);
      alert('Failed to instantiate prefab');
    }
  };

  // Handle delete prefab
  const handleDelete = (prefabId: string) => {
    if (!prefabManager) return;
    
    if (confirm('Delete this prefab? This cannot be undone.')) {
      prefabManager.deletePrefab(prefabId);
      setPrefabs(prefabManager.getAllPrefabs());
    }
  };

  // Handle create prefab from selected object
  const handleCreatePrefab = () => {
    if (!prefabManager || !entityManager || !selectedObject) {
      alert('Please select an entity to create a prefab');
      return;
    }

    // Check if selected object is an entity
    const entityId = selectedObject.userData?.entityId;
    if (!entityId) {
      alert('Selected object is not an entity. Please select an entity.');
      return;
    }

    const entity = entityManager.getEntity(entityId);
    if (!entity) {
      alert('Entity not found');
      return;
    }

    setPrefabName(entity.name || 'New Prefab');
    setShowCreateDialog(true);
  };

  const handleConfirmCreatePrefab = () => {
    if (!prefabManager || !entityManager || !selectedObject || !prefabName.trim()) {
      return;
    }

    const entityId = selectedObject.userData?.entityId;
    if (!entityId) return;

    const entity = entityManager.getEntity(entityId);
    if (!entity) return;

    try {
      prefabManager.createPrefab(prefabName.trim(), entity, entityManager);
      setPrefabs(prefabManager.getAllPrefabs());
      setShowCreateDialog(false);
      setPrefabName('New Prefab');
      if (onPrefabCreated) {
        onPrefabCreated();
      }
    } catch (error) {
      console.error('Failed to create prefab:', error);
      alert('Failed to create prefab');
    }
  };

  if (!prefabManager) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800">
        <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
          Prefab system not available
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Create Prefab Button */}
      <div className="p-2 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={handleCreatePrefab}
          disabled={!selectedObject || !entityManager}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-mono rounded transition-colors flex items-center justify-center gap-2"
          title={!selectedObject ? 'Select an entity first' : 'Create Prefab from Selected Entity'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Create Prefab</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-gray-700 flex-shrink-0">
        <input
          type="text"
          placeholder="Search prefabs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Prefab List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
        {filteredPrefabs.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono py-8 text-center">
            {searchQuery ? 'No prefabs found' : 'No prefabs saved\n\nSelect an entity and use "Save as Prefab" to create one'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPrefabs.map((prefab) => (
              <div
                key={prefab.id}
                className={`p-3 bg-gray-700 rounded hover:bg-gray-650 border ${
                  selectedPrefab === prefab.id ? 'border-blue-500' : 'border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-xs font-mono">{prefab.name}</div>
                    <div className="text-gray-400 text-xs font-mono mt-1">
                      ID: {prefab.id.substring(0, 12)}...
                    </div>
                    <div className="text-gray-500 text-xs font-mono mt-1">
                      {new Date(prefab.updatedAt).toLocaleString()}
                    </div>
                    {prefab.entity.components.length > 0 && (
                      <div className="text-gray-500 text-xs font-mono mt-1">
                        Components: {prefab.entity.components.map(c => c.type).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleInstantiate(prefab.id)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono rounded transition-colors"
                    title="Instantiate Prefab"
                  >
                    Instantiate
                  </button>
                  <button
                    onClick={() => handleDelete(prefab.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-mono rounded transition-colors"
                    title="Delete Prefab"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 font-mono">
        <div>Select entity → Right-click → "Save as Prefab"</div>
      </div>
    </div>
  );
}

