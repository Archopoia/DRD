'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import SceneHierarchy from './panels/SceneHierarchy';
import Inspector from './panels/Inspector';
import Assets from './panels/Assets';
import GameViewport from './panels/GameViewport';
import Console from '@/components/ui/Console';
import * as THREE from 'three';

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

  // Get scene from game instance
  useEffect(() => {
    if (gameInstance && gameInstance.getScene) {
      try {
        const gameScene = gameInstance.getScene();
        if (gameScene) {
          setScene(gameScene);
          setHierarchyKey(prev => prev + 1); // Trigger re-render
        }
      } catch (error) {
        console.error('Failed to get scene from game instance:', error);
      }
    }
  }, [gameInstance, isOpen]);

  // Handle object changes (when Inspector modifies an object)
  const handleObjectChange = useCallback((object: THREE.Object3D) => {
    // Force hierarchy refresh
    setHierarchyKey(prev => prev + 1);
  }, []);

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
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 flex-shrink-0">
        <div className="text-white font-mono text-sm font-semibold">Game Editor</div>
        
        {/* Toolbar buttons */}
        <div className="flex gap-2 border-l border-gray-700 pl-4">
          <button
            onClick={() => handleAddObject('box')}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
            title="Add Box (Mesh)"
          >
            +Box
          </button>
          <button
            onClick={() => handleAddObject('sphere')}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
            title="Add Sphere (Mesh)"
          >
            +Sphere
          </button>
          <button
            onClick={() => handleAddObject('plane')}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
            title="Add Plane (Mesh)"
          >
            +Plane
          </button>
          <button
            onClick={() => handleAddObject('light')}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono"
            title="Add Light"
          >
            +Light
          </button>
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
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 hover:bg-gray-700 rounded"
        >
          Close (Tab)
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
          <div className="flex-1 overflow-auto">
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
              <Assets manager={manager} />
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
          className="bg-gray-800 border-l border-gray-700 overflow-auto relative"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="px-4 py-2 border-b border-gray-700">
            <div className="text-white font-mono text-sm font-semibold">Inspector</div>
          </div>
          <Inspector 
            object={selectedObject}
            manager={manager}
            onObjectChange={handleObjectChange}
          />
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
    </div>
  );
}

