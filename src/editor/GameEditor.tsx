'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import SceneHierarchy from './panels/SceneHierarchy';
import Inspector from './panels/Inspector';
import InspectorEnhanced from './panels/InspectorEnhanced';
import Assets from './panels/Assets';
import GameViewport from './panels/GameViewport';
import History from './panels/History';
import Console from '@/components/ui/Console';
import * as THREE from 'three';
import { EditorCore, EngineAdapter } from './core';
import { TransformMode } from './gizmos/TransformGizmo';

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
 * Game Editor Component - Similar to Creation Engine
 * Refactored to use EditorCore for state management and EngineAdapter for engine access
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
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [hierarchyKey, setHierarchyKey] = useState(0); // Force re-render when scene changes
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'history'>('inspector');
  
  // Initialize EditorCore
  const editorCoreRef = useRef<EditorCore | null>(null);
  const editorCore = useMemo(() => {
    if (!editorCoreRef.current) {
      editorCoreRef.current = new EditorCore(100);
    }
    return editorCoreRef.current;
  }, []);

  // Selection state managed by EditorCore
  const [selectedObjects, setSelectedObjects] = useState<Set<THREE.Object3D>>(new Set());
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');

  // Dialog state
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [sceneName, setSceneName] = useState('Scene 1');
  const [availableScenes, setAvailableScenes] = useState<Array<{ id: string; name: string; createdAt: number; updatedAt: number }>>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Initialize engine adapter and set it on EditorCore
  useEffect(() => {
    if (gameInstance) {
      const engine = new EngineAdapter(gameInstance);
      editorCore.setEngine(engine);
      
      // Get scene from engine
      try {
        const gameScene = engine.getScene();
        if (gameScene) {
          setScene(gameScene);
          setHierarchyKey(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to get scene from engine:', error);
      }
    } else {
      editorCore.setEngine(null);
      setScene(null);
    }
  }, [gameInstance, editorCore]);

  // Subscribe to selection changes from EditorCore
  useEffect(() => {
    const unsubscribe = editorCore.subscribeToSelection((objects, primary) => {
      setSelectedObjects(new Set(objects));
      setSelectedObject(primary);
    });

    return unsubscribe;
  }, [editorCore]);

  // Subscribe to transform mode changes from EditorCore
  useEffect(() => {
    const unsubscribe = editorCore.subscribeToTransformMode((mode) => {
      setTransformMode(mode);
    });

    return unsubscribe;
  }, [editorCore]);

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

  // Clear editor-controlled flags when editor closes
  useEffect(() => {
    if (!isOpen && scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.userData._editorControlled) {
          delete object.userData._editorControlled;
        }
      });
      editorCore.clearSelection();
    }
  }, [isOpen, scene, editorCore]);

  // Handle save scene button click
  const handleSaveClick = () => {
    setSceneName('Scene 1');
    setShowSaveDialog(true);
  };

  // Handle save scene (after dialog confirmation)
  const handleSaveScene = async () => {
    if (!sceneName.trim()) return;

    setSaving(true);
    setShowSaveDialog(false);
    try {
      const id = await editorCore.saveScene(sceneName.trim());
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
    const engine = editorCore.getEngine();
    if (!engine) return;

    try {
      const storage = engine.getSceneStorage();
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
    setLoading(true);
    setShowLoadDialog(false);
    try {
      const success = await editorCore.loadScene(sceneId);
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

  // Handle object changes (when Inspector modifies an object)
  const handleObjectChange = useCallback((object: THREE.Object3D) => {
    // Update physics body if object has one
    if (object instanceof THREE.Mesh) {
      editorCore.updatePhysicsBody(object);
    }
    
    // Force hierarchy refresh
    setHierarchyKey(prev => prev + 1);
  }, [editorCore]);

  // Handle object deletion
  const handleDeleteObject = useCallback((object: THREE.Object3D) => {
    editorCore.deleteObject(object);
    setHierarchyKey(prev => prev + 1);
  }, [editorCore]);

  // Handle object duplication
  const handleDuplicateObject = useCallback((object: THREE.Object3D) => {
    editorCore.duplicateObject(object);
    setHierarchyKey(prev => prev + 1);
  }, [editorCore]);

  // Handle adding new objects
  const handleAddObject = useCallback((type: 'box' | 'sphere' | 'plane' | 'light' | 'group') => {
    editorCore.addObject(type);
    setHierarchyKey(prev => prev + 1);
  }, [editorCore]);

  // Handle selection change
  const handleSelectObject = useCallback((object: THREE.Object3D | null, multiSelect?: boolean) => {
    editorCore.selectObject(object, multiSelect);
  }, [editorCore]);

  // Get entity manager for components that need it
  const entityManager = editorCore.getEngine()?.getEntityManager() || null;
  const historyManager = editorCore.getHistoryManager();
  const engine = editorCore.getEngine();

  // Close add menu when clicking outside
  useEffect(() => {
    if (!showAddMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-add-menu]')) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

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
      else if (event.code === 'Delete' && selectedObject) {
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
      // Ctrl+Z to undo
      else if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        historyManager.undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z to redo
      else if (
        ((event.ctrlKey || event.metaKey) && event.code === 'KeyY' && !event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && event.shiftKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        historyManager.redo();
      }
      // Transform mode shortcuts
      else if (event.code === 'KeyW' && selectedObject) {
        event.preventDefault();
        editorCore.setTransformMode('translate');
      }
      else if (event.code === 'KeyE' && selectedObject) {
        event.preventDefault();
        editorCore.setTransformMode('rotate');
      }
      else if (event.code === 'KeyR' && selectedObject) {
        event.preventDefault();
        editorCore.setTransformMode('scale');
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose, selectedObject, handleDeleteObject, handleDuplicateObject, handleSaveClick, editorCore, historyManager]);

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

        {/* Add Object Menu */}
        <div className="flex gap-1 border-l border-gray-700 pl-3" data-add-menu>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 hover:bg-gray-700 rounded font-mono flex items-center gap-1"
              title="Add Object"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg py-1 min-w-[120px] z-50">
              <button
                onClick={() => {
                  handleAddObject('box');
                  setShowAddMenu(false);
                }}
                className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-600 text-xs px-3 py-1.5 font-mono flex items-center gap-2"
                title="Add Box"
              >
                <span className="w-3 h-3 bg-gray-500 rounded-sm"></span>
                <span>Box</span>
              </button>
              <button
                onClick={() => {
                  handleAddObject('sphere');
                  setShowAddMenu(false);
                }}
                className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-600 text-xs px-3 py-1.5 font-mono flex items-center gap-2"
                title="Add Sphere"
              >
                <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                <span>Sphere</span>
              </button>
              <button
                onClick={() => {
                  handleAddObject('plane');
                  setShowAddMenu(false);
                }}
                className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-600 text-xs px-3 py-1.5 font-mono flex items-center gap-2"
                title="Add Plane"
              >
                <span className="w-3 h-3 bg-gray-500"></span>
                <span>Plane</span>
              </button>
              <button
                onClick={() => {
                  handleAddObject('light');
                  setShowAddMenu(false);
                }}
                className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-600 text-xs px-3 py-1.5 font-mono flex items-center gap-2"
                title="Add Light"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>Light</span>
              </button>
              <button
                onClick={() => {
                  handleAddObject('group');
                  setShowAddMenu(false);
                }}
                className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-600 text-xs px-3 py-1.5 font-mono flex items-center gap-2"
                title="Add Group"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Group</span>
              </button>
            </div>
            )}
          </div>
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
            disabled={saving || !engine}
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
            disabled={loading || !engine}
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
                onSelectObject={handleSelectObject}
                onDeleteObject={handleDeleteObject}
                onDuplicateObject={handleDuplicateObject}
                historyManager={historyManager}
              />
            )}
            {activeTab === 'assets' && (
              <Assets 
                manager={manager}
                prefabManager={engine?.getPrefabManager() || null}
                entityManager={entityManager}
                entityFactory={engine?.getEntityFactory() || null}
                selectedObject={selectedObject}
                onPrefabInstantiated={(entity) => {
                  setHierarchyKey(prev => prev + 1);
                  if (entityManager) {
                    const obj3d = entityManager.getObject3D(entity);
                    if (obj3d) {
                      editorCore.selectObject(obj3d);
                    }
                  }
                }}
                onPrefabCreated={() => {
                  setHierarchyKey(prev => prev + 1);
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
            editorCore={editorCore}
            onTransformModeChange={(mode) => editorCore.setTransformMode(mode)}
            historyManager={historyManager}
            onSelectObject={handleSelectObject}
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

        {/* Right Panel - Inspector / History */}
        <div 
          className="bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden relative"
          style={{ width: `${rightPanelWidth}px` }}
        >
          {/* Right Panel Tabs */}
          <div className="flex border-b border-gray-700 flex-shrink-0">
            <button
              onClick={() => setRightPanelTab('inspector')}
              className={`px-4 py-2 text-sm font-mono flex-1 ${
                rightPanelTab === 'inspector'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Inspector
            </button>
            <button
              onClick={() => setRightPanelTab('history')}
              className={`px-4 py-2 text-sm font-mono flex-1 ${
                rightPanelTab === 'history'
                  ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              History
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {rightPanelTab === 'inspector' ? (
              entityManager ? (
                <InspectorEnhanced 
                  object={selectedObject}
                  entityManager={entityManager}
                  manager={manager}
                  historyManager={historyManager}
                  onObjectChange={handleObjectChange}
                />
              ) : (
                <Inspector 
                  object={selectedObject}
                  manager={manager}
                  onObjectChange={handleObjectChange}
                />
              )
            ) : (
              <History historyManager={historyManager} />
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
