'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import SceneHierarchy from './panels/SceneHierarchy';
import Inspector from './panels/Inspector';
import InspectorEnhanced from './panels/InspectorEnhanced';
import Assets from './panels/Assets';
import GameViewport from './panels/GameViewport';
import Console from '@/components/ui/Console';
import * as THREE from 'three';
import { TransformMode } from './gizmos/TransformGizmo';
import { EntityManager } from '@/game/ecs/EntityManager';

interface GameEditorProps {
  isOpen: boolean;
  onClose: () => void;
  manager?: CharacterSheetManager;
  godMode: boolean;
  setGodMode: (enabled: boolean) => void;
  gameInstance?: any; // Game instance to access scene and other data
}

type PanelTab = 'hierarchy' | 'inspector' | 'assets' | 'console';

/**
 * Game Editor Component - Similar to Creator Engine
 * Shows when Tab is pressed, includes scene hierarchy, inspector, assets, and console
 */
export default function GameEditor({ 
  isOpen, 
  onClose, 
  manager, 
  godMode, 
  setGodMode,
  gameInstance 
}: GameEditorProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('hierarchy');
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<Set<THREE.Object3D>>(new Set()); // Multi-select support
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [hierarchyKey, setHierarchyKey] = useState(0); // Force re-render when scene changes
  const previousSelectionRef = useRef<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [entityManager, setEntityManager] = useState<EntityManager | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [sceneName, setSceneName] = useState('Scene 1');
  const [availableScenes, setAvailableScenes] = useState<Array<{ id: string; name: string; createdAt: number; updatedAt: number }>>([]);

  // Apply visual selection highlighting for multi-select
  useEffect(() => {
    if (!scene) return;

    // Remove highlight from all objects first
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.editorOriginalMaterial) {
        object.material = object.userData.editorOriginalMaterial;
        delete object.userData.editorOriginalMaterial;
        object.userData.selected = false;
      }
    });

    // Apply highlight to all selected objects
    selectedObjects.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        // Store original material if not already stored
        if (!object.userData.editorOriginalMaterial) {
          object.userData.editorOriginalMaterial = object.material;
        }
        
        // Apply highlight
        if (object.material instanceof THREE.MeshStandardMaterial || 
            (object.userData.editorOriginalMaterial instanceof THREE.MeshStandardMaterial)) {
          const originalMaterial = object.userData.editorOriginalMaterial as THREE.MeshStandardMaterial;
          const highlightedMaterial = originalMaterial.clone();
          highlightedMaterial.emissive = new THREE.Color(0x00aaff);
          highlightedMaterial.emissiveIntensity = 0.3;
          object.material = highlightedMaterial;
        }
        
        object.userData.selected = true;
      }
    });
  }, [selectedObjects, scene]);

  // Get scene and entity manager from game instance
  useEffect(() => {
    if (gameInstance && gameInstance.getScene) {
      try {
        const gameScene = gameInstance.getScene();
        if (gameScene) {
          setScene(gameScene);
          setHierarchyKey(prev => prev + 1); // Trigger re-render
        }

        // Get entity manager if available
        if (gameInstance.getEntityManager) {
          const em = gameInstance.getEntityManager();
          setEntityManager(em);
        }
      } catch (error) {
        console.error('Failed to get scene from game instance:', error);
      }
    }
  }, [gameInstance, isOpen]);

  // Handle save scene button click
  const handleSaveClick = () => {
    setSceneName('Scene 1');
    setShowSaveDialog(true);
  };

  // Handle save scene (after dialog confirmation)
  const handleSaveScene = async () => {
    if (!gameInstance || !gameInstance.saveScene) return;
    if (!sceneName.trim()) return;

    setSaving(true);
    setShowSaveDialog(false);
    try {
      const id = await gameInstance.saveScene(sceneName.trim());
      if (id) {
        console.log(`Scene saved successfully! (ID: ${id})`);
      } else {
        console.error('Failed to save scene');
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle load scene button click
  const handleLoadClick = async () => {
    if (!gameInstance || !gameInstance.getSceneStorage) return;

    try {
      const storage = gameInstance.getSceneStorage();
      if (!storage) {
        console.error('Scene storage not available');
        return;
      }

      const scenes = await storage.listScenes();
      setAvailableScenes(scenes);
      setShowLoadDialog(true);
    } catch (error) {
      console.error('Failed to load scene list:', error);
    }
  };

  // Handle load scene (after dialog selection)
  const handleLoadScene = async (sceneId: string) => {
    if (!gameInstance || !gameInstance.loadScene) return;

    setLoading(true);
    setShowLoadDialog(false);
    try {
      const success = await gameInstance.loadScene(sceneId);
      if (success) {
        console.log('Scene loaded successfully');
        setHierarchyKey(prev => prev + 1); // Refresh hierarchy
      } else {
        console.error('Failed to load scene');
      }
    } catch (error) {
      console.error('Failed to load scene:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear editor-controlled flags when editor closes or objects are deselected
  useEffect(() => {
    if (!isOpen) {
      // Editor closed - clear all editor-controlled flags
      if (scene) {
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh && object.userData._editorControlled) {
            delete object.userData._editorControlled;
          }
        });
      }
      // Clear selections
      setSelectedObjects(new Set());
      setSelectedObject(null);
    }
  }, [isOpen, scene]);

  // Handle object changes (when Inspector modifies an object)
  const handleObjectChange = useCallback((object: THREE.Object3D) => {
    // Update physics body if object has one (for editor-created objects modified via Inspector)
    if (gameInstance && object instanceof THREE.Mesh && gameInstance.updatePhysicsBodyForMesh) {
      object.userData._editorControlled = true;
      gameInstance.updatePhysicsBodyForMesh(object);
    }
    
    // Force hierarchy refresh
    setHierarchyKey(prev => prev + 1);
  }, [gameInstance]);

  // Handle object deletion
  const handleDeleteObject = useCallback((object: THREE.Object3D) => {
    if (!scene) return;
    
    // Remove from selections
    setSelectedObjects(prev => {
      const next = new Set(prev);
      next.delete(object);
      return next;
    });
    
    if (selectedObject === object) {
      setSelectedObject(null);
    }
    
    // Remove from scene
    scene.remove(object);
    
    // Dispose geometry and material if it's a mesh
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else if (object.material) {
        object.material.dispose();
      }
    }
    
    // Force hierarchy refresh
    setHierarchyKey(prev => prev + 1);
  }, [scene, selectedObject]);

  // Handle object duplication
  const handleDuplicateObject = useCallback((object: THREE.Object3D) => {
    if (!scene) return;
    
    const cloned = object.clone();
    cloned.name = cloned.name + ' (Copy)';
    cloned.position.x += 1; // Offset slightly
    scene.add(cloned);
    setSelectedObject(cloned);
    setHierarchyKey(prev => prev + 1);
  }, [scene]);

  // Handle adding new objects
  const handleAddObject = useCallback((type: 'box' | 'sphere' | 'plane' | 'light' | 'group') => {
    if (!gameInstance) return;
    
    if (gameInstance.addObjectToScene) {
      const newObject = gameInstance.addObjectToScene(type);
      if (newObject) {
        setSelectedObject(newObject);
        setHierarchyKey(prev => prev + 1);
      }
    }
  }, [gameInstance]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInput) return; // Don't interfere with input fields

      // Tab to close editor
      if (event.code === 'Tab' && !event.repeat) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      // Delete key to delete selected object
      else if (event.code === 'Delete' && selectedObject && scene) {
        event.preventDefault();
        handleDeleteObject(selectedObject);
      }
      // Ctrl+D to duplicate
      else if ((event.ctrlKey || event.metaKey) && event.code === 'KeyD' && selectedObject) {
        event.preventDefault();
        handleDuplicateObject(selectedObject);
      }
      // Ctrl+S to save
      else if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
        event.preventDefault();
        handleSaveClick();
      }
      // Transform mode shortcuts
      else if (event.code === 'KeyW' && selectedObject) {
        event.preventDefault();
        setTransformMode('translate');
      }
      else if (event.code === 'KeyE' && selectedObject) {
        event.preventDefault();
        setTransformMode('rotate');
      }
      else if (event.code === 'KeyR' && selectedObject) {
        event.preventDefault();
        setTransformMode('scale');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, selectedObject, scene, handleDeleteObject, handleDuplicateObject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col pointer-events-auto">
      {/* Top Toolbar */}
      <div className="h-9 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-3 flex-shrink-0">
        <div className="text-white font-mono text-sm font-semibold flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
          </svg>
          <span>Editor</span>
        </div>
        
        

        {/* Object actions */}
        {selectedObject && (
          <div className="flex gap-2 border-l border-gray-700 pl-4">
            <button
              onClick={() => handleDuplicateObject(selectedObject)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
              title="Duplicate Object (Ctrl+D)"
            >
              Duplicate
            </button>
            <button
              onClick={() => handleDeleteObject(selectedObject)}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
              title="Delete Object (Delete)"
            >
              Delete
            </button>
          </div>
        )}

        <div className="flex-1" />
        
        {/* Save/Load buttons */}
        <div className="flex gap-2 border-l border-gray-700 pl-4">
          <button
            onClick={handleSaveClick}
            disabled={saving || !gameInstance}
            className="text-gray-400 hover:text-white text-xs px-3 py-1 hover:bg-gray-700 rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Save Scene (Ctrl+S)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={handleLoadClick}
            disabled={loading || !gameInstance}
            className="text-gray-400 hover:text-white text-xs px-3 py-1 hover:bg-gray-700 rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Load Scene"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>{loading ? 'Loading...' : 'Load'}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 hover:bg-gray-700 rounded flex items-center gap-1.5"
          title="Close Editor (Tab)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <span>Close</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scene Hierarchy / Assets */}
        <div 
          className="bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden"
          style={{ width: `${leftPanelWidth}px` }}
        >
          {/* Left Panel Tabs */}
          <div className="flex border-b border-gray-700 flex-shrink-0">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-4 py-2 text-sm font-mono flex-1 ${
                activeTab === 'hierarchy'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 text-sm font-mono flex-1 ${
                activeTab === 'assets'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Assets
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeTab === 'hierarchy' && (
              <SceneHierarchy 
                key={hierarchyKey}
                scene={scene} 
                selectedObject={selectedObject}
                selectedObjects={selectedObjects}
                onSelectObject={(object, multiSelect) => {
                  if (multiSelect) {
                    // Multi-select mode - toggle in selection set
                    setSelectedObjects(prev => {
                      const next = new Set(prev);
                      if (object) {
                        if (next.has(object)) {
                          next.delete(object);
                          if (selectedObject === object) {
                            const remaining = Array.from(next);
                            setSelectedObject(remaining.length > 0 ? remaining[0] : null);
                          }
                        } else {
                          next.add(object);
                          setSelectedObject(object);
                        }
                      }
                      return next;
                    });
                  } else {
                    // Single select
                    if (object) {
                      setSelectedObjects(new Set([object]));
                      setSelectedObject(object);
                    } else {
                      // Clear selection - release editor control from previously selected objects
                      selectedObjects.forEach((obj) => {
                        if (obj instanceof THREE.Mesh) {
                          delete obj.userData._editorControlled;
                        }
                      });
                      setSelectedObjects(new Set());
                      setSelectedObject(null);
                    }
                  }
                }}
                onDeleteObject={handleDeleteObject}
                onDuplicateObject={handleDuplicateObject}
              />
            )}
            {activeTab === 'assets' && (
              <Assets 
                manager={manager}
                prefabManager={gameInstance?.getPrefabManager?.() || null}
                entityManager={entityManager}
                entityFactory={gameInstance?.getEntityFactory?.() || null}
                onPrefabInstantiated={(entity) => {
                  // Refresh hierarchy after prefab instantiation
                  setHierarchyKey(prev => prev + 1);
                  // Select the newly instantiated entity's object
                  if (entityManager) {
                    const obj3d = entityManager.getObject3D(entity);
                    if (obj3d) {
                      setSelectedObject(obj3d);
                      setSelectedObjects(new Set([obj3d]));
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Resize handle for left panel */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startWidth = leftPanelWidth;

            const onMouseMove = (e: MouseEvent) => {
              const delta = e.clientX - startX;
              const newWidth = Math.max(200, Math.min(600, startWidth + delta));
              setLeftPanelWidth(newWidth);
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        {/* Center Area - Game Viewport */}
        <div className="flex-1 bg-gray-900 relative overflow-hidden min-w-0">
          <GameViewport
            scene={scene}
            selectedObject={selectedObject}
            selectedObjects={selectedObjects}
            transformMode={transformMode}
            gameInstance={gameInstance}
            onTransformModeChange={setTransformMode}
            onSelectObject={(object, multiSelect) => {
              if (multiSelect) {
                // Multi-select mode - toggle object in selection set
                setSelectedObjects(prev => {
                  const next = new Set(prev);
                  if (object) {
                    if (next.has(object)) {
                      next.delete(object);
                      if (selectedObject === object) {
                        // If primary selection was deselected, pick another one
                        const remaining = Array.from(next);
                        setSelectedObject(remaining.length > 0 ? remaining[0] : null);
                      }
                    } else {
                      next.add(object);
                      setSelectedObject(object); // Set as primary selection
                    }
                  }
                  return next;
                });
              } else {
                // Single select mode - clear all and select only this object
                if (object) {
                  setSelectedObjects(new Set([object]));
                  setSelectedObject(object);
                } else {
                  setSelectedObjects(new Set());
                  setSelectedObject(null);
                }
              }
            }}
            onObjectChange={handleObjectChange}
          />
        </div>

        {/* Resize handle for right panel */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startWidth = rightPanelWidth;

            const onMouseMove = (e: MouseEvent) => {
              const delta = startX - e.clientX;
              const newWidth = Math.max(200, Math.min(600, startWidth + delta));
              setRightPanelWidth(newWidth);
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        {/* Right Panel - Inspector */}
        <div 
          className="bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden relative"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="px-4 py-2 border-b border-gray-700 flex-shrink-0">
            <div className="text-white font-mono text-sm font-semibold">Inspector</div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {entityManager ? (
              <InspectorEnhanced 
                object={selectedObject}
                entityManager={entityManager}
                manager={manager}
                onObjectChange={handleObjectChange}
              />
            ) : (
              <Inspector 
                object={selectedObject}
                manager={manager}
                onObjectChange={handleObjectChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel - Console */}
      <div className="flex flex-col" style={{ height: `${bottomPanelHeight}px` }}>
        {/* Resize handle for bottom panel */}
        <div
          className="h-1 bg-gray-700 hover:bg-blue-500 cursor-row-resize transition-colors flex-shrink-0 z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startY = e.clientY;
            const startHeight = bottomPanelHeight;

            const onMouseMove = (e: MouseEvent) => {
              const delta = startY - e.clientY;
              const newHeight = Math.max(150, Math.min(600, startHeight + delta));
              setBottomPanelHeight(newHeight);
            };

            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />
        
        <div 
          className="bg-gray-800 border-t border-gray-700 overflow-hidden relative flex-1"
        >
        <div className="h-full">
          <Console
            isOpen={true}
            onClose={onClose}
            manager={manager}
            godMode={godMode}
            setGodMode={setGodMode}
            embedded={true}
          />
        </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[400px]">
            <div className="text-white font-mono text-sm font-semibold mb-3">Save Scene</div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 font-mono block mb-1">Scene Name</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveScene();
                  } else if (e.key === 'Escape') {
                    setShowSaveDialog(false);
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="Enter scene name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-mono rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScene}
                disabled={!sceneName.trim() || saving}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-w-[500px] max-w-[600px] max-h-[600px] flex flex-col">
            <div className="text-white font-mono text-sm font-semibold mb-3">Load Scene</div>
            <div className="flex-1 overflow-auto mb-4">
              {availableScenes.length === 0 ? (
                <div className="text-gray-400 text-xs font-mono text-center py-8">
                  No saved scenes found
                </div>
              ) : (
                <div className="space-y-2">
                  {availableScenes.map((scene) => (
                    <div
                      key={scene.id}
                      onClick={() => handleLoadScene(scene.id)}
                      className="p-3 bg-gray-700 hover:bg-gray-650 border border-gray-600 rounded cursor-pointer transition-colors"
                    >
                      <div className="text-white font-semibold text-xs font-mono">{scene.name}</div>
                      <div className="text-gray-400 text-xs font-mono mt-1">
                        Updated: {new Date(scene.updatedAt).toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs font-mono mt-1">
                        ID: {scene.id.substring(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-mono rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

