/**
 * EditorCore - Central manager for editor state and operations
 * Acts as the bridge between UI components and engine systems
 */

import * as THREE from 'three';
import { IEngine } from './IEngine';
import { HistoryManager } from '../history/HistoryManager';
import {
  createCreateObjectAction,
  createDeleteObjectAction,
} from '../history/actions/EditorActions';
import { TransformMode } from '../gizmos/TransformGizmo';
import { logEditor, logScene, logHistory } from '../utils/debugLogger';

/**
 * Editor Core - Manages editor state, selection, and operations
 */
export class EditorCore {
  private engine: IEngine | null = null;
  private historyManager: HistoryManager;
  private selectedObjects: Set<THREE.Object3D> = new Set();
  private selectedObject: THREE.Object3D | null = null;
  private transformMode: TransformMode = 'translate';

  // Selection listeners
  private selectionListeners: Set<(objects: Set<THREE.Object3D>, primary: THREE.Object3D | null) => void> = new Set();
  
  // Transform mode listeners
  private transformModeListeners: Set<(mode: TransformMode) => void> = new Set();

  constructor(maxHistorySize: number = 100) {
    this.historyManager = new HistoryManager(maxHistorySize);
  }

  /**
   * Initialize editor with engine instance
   */
  setEngine(engine: IEngine | null): void {
    this.engine = engine;
  }

  /**
   * Get engine instance
   */
  getEngine(): IEngine | null {
    return this.engine;
  }

  /**
   * Get history manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Get current selection
   */
  getSelection(): { objects: Set<THREE.Object3D>; primary: THREE.Object3D | null } {
    return {
      objects: new Set(this.selectedObjects),
      primary: this.selectedObject,
    };
  }

  /**
   * Select an object (single selection)
   */
  selectObject(object: THREE.Object3D | null, multiSelect: boolean = false): void {
    if (multiSelect && object) {
      // Multi-select mode - toggle in selection set
      if (this.selectedObjects.has(object)) {
        this.selectedObjects.delete(object);
        if (this.selectedObject === object) {
          // If primary selection was deselected, pick another one
          const remaining = Array.from(this.selectedObjects);
          this.selectedObject = remaining.length > 0 ? remaining[0] : null;
        }
      } else {
        this.selectedObjects.add(object);
        this.selectedObject = object; // Set as primary selection
      }
    } else {
      // Single select mode
      if (object) {
        this.selectedObjects = new Set([object]);
        this.selectedObject = object;
      } else {
        this.selectedObjects = new Set();
        this.selectedObject = null;
      }
    }

    this.notifySelectionListeners();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    // Release editor control from previously selected objects
    this.selectedObjects.forEach((obj) => {
      if (obj instanceof THREE.Mesh) {
        delete obj.userData._editorControlled;
      }
    });

    this.selectedObjects = new Set();
    this.selectedObject = null;
    this.notifySelectionListeners();
  }

  /**
   * Get transform mode
   */
  getTransformMode(): TransformMode {
    return this.transformMode;
  }

  /**
   * Set transform mode
   */
  setTransformMode(mode: TransformMode): void {
    if (this.transformMode !== mode) {
      this.transformMode = mode;
      this.notifyTransformModeListeners();
    }
  }

  /**
   * Add object to scene
   */
  addObject(type: 'box' | 'sphere' | 'plane' | 'light' | 'group' | 'trigger' | 'spawnPoint' | 'npc' | 'item'): THREE.Object3D | null {
    if (!this.engine) {
      logEditor('addObject: Engine not available');
      return null;
    }

    logEditor(`addObject: Creating ${type}`, { type });
    const newObject = this.engine.addObjectToScene(type);
    if (newObject) {
      const scene = this.engine.getScene();
      logEditor('addObject: Object created', {
        type,
        name: newObject.name,
        uuid: newObject.uuid,
        position: newObject.position.toArray(),
        sceneChildrenCount: scene.children.length,
      });
      
      const action = createCreateObjectAction(newObject, scene, `Create ${type}`);
      this.historyManager.addAction(action);
      this.selectObject(newObject);
      logEditor('addObject: History action added and object selected');
    } else {
      logEditor('addObject: Failed to create object', { type });
    }

    return newObject;
  }

  /**
   * Delete selected object(s)
   */
  deleteObject(object: THREE.Object3D): void {
    if (!this.engine) {
      logEditor('deleteObject: Engine not available');
      return;
    }

    logEditor('deleteObject: Deleting object', {
      name: object.name,
      uuid: object.uuid,
      type: object.type,
      position: object.position.toArray(),
      hasChildren: object.children.length,
    });

    const scene = this.engine.getScene();

    // Create history action
    const action = createDeleteObjectAction(object, scene);
    this.historyManager.addAction(action);
    logHistory('deleteObject: History action created', { objectName: object.name });

    // Remove from selections
    this.selectedObjects.delete(object);
    if (this.selectedObject === object) {
      const remaining = Array.from(this.selectedObjects);
      this.selectedObject = remaining.length > 0 ? remaining[0] : null;
      logEditor('deleteObject: Selection updated', {
        remainingSelected: remaining.length,
        newPrimary: this.selectedObject?.name || null,
      });
    }

    // Remove from scene
    const wasInScene = scene.children.includes(object);
    scene.remove(object);
    logEditor('deleteObject: Object removed from scene', {
      wasInScene,
      sceneChildrenCount: scene.children.length,
    });

    // Dispose geometry and material if it's a mesh
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose());
      } else if (object.material) {
        object.material.dispose();
      }
      logEditor('deleteObject: Mesh geometry and materials disposed');
    }

    this.notifySelectionListeners();
    logEditor('deleteObject: Complete');
  }

  /**
   * Duplicate object
   */
  duplicateObject(object: THREE.Object3D): THREE.Object3D | null {
    if (!this.engine) {
      logEditor('duplicateObject: Engine not available');
      return null;
    }

    logEditor('duplicateObject: Duplicating object', {
      name: object.name,
      uuid: object.uuid,
      type: object.type,
      position: object.position.toArray(),
    });

    const scene = this.engine.getScene();
    const cloned = object.clone();
    cloned.name = cloned.name + ' (Copy)';
    cloned.position.x += 1; // Offset slightly
    scene.add(cloned);

    logEditor('duplicateObject: Object cloned and added to scene', {
      originalName: object.name,
      clonedName: cloned.name,
      clonedUuid: cloned.uuid,
      clonedPosition: cloned.position.toArray(),
      sceneChildrenCount: scene.children.length,
    });

    // Create history action
    const action = createCreateObjectAction(cloned, scene, `Duplicate ${object.name || object.type}`);
    this.historyManager.addAction(action);
    logHistory('duplicateObject: History action created', { objectName: object.name, clonedName: cloned.name });

    this.selectObject(cloned);
    logEditor('duplicateObject: Cloned object selected');
    return cloned;
  }

  /**
   * Update physics body for a mesh (called by viewport/inspector after transform changes)
   * Also syncs the TransformComponent FROM the mesh position/rotation/scale
   */
  updatePhysicsBody(mesh: THREE.Mesh): void {
    if (!this.engine) return;
    mesh.userData._editorControlled = true;
    
    // Sync TransformComponent FROM mesh (if this is an ECS entity)
    const entityManager = this.engine.getEntityManager();
    if (entityManager && mesh.userData.entityId) {
      const entity = entityManager.getEntity(mesh.userData.entityId);
      if (entity) {
        const transform = entityManager.getComponent(entity, 'TransformComponent');
        if (transform) {
          transform.position.copy(mesh.position);
          transform.rotation.copy(mesh.rotation);
          transform.scale.copy(mesh.scale);
        }
      }
    }
    
    // Update physics body
    this.engine.updatePhysicsBodyForMesh(mesh);
  }

  /**
   * Save scene
   */
  async saveScene(sceneName: string, author?: string): Promise<string | null> {
    if (!this.engine) {
      console.error('[EditorCore] saveScene: Engine not available');
      return null;
    }

    console.log('[EditorCore] saveScene: Starting save', {
      sceneName,
      author,
      hasEngine: !!this.engine,
    });

    try {
      const sceneId = await this.engine.saveScene(sceneName, author);
      if (sceneId) {
        console.log('[EditorCore] saveScene: Scene saved successfully', {
          sceneName,
          sceneId,
          author,
        });
      } else {
        console.error('[EditorCore] saveScene: Save returned null sceneId');
      }
      return sceneId;
    } catch (error) {
      console.error('[EditorCore] saveScene: Error saving scene', {
        sceneName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Load scene
   */
  async loadScene(sceneId: string): Promise<boolean> {
    if (!this.engine) {
      logScene('loadScene: Engine not available');
      return false;
    }

    logScene('loadScene: Starting load', {
      sceneId,
      hasEngine: !!this.engine,
    });

    try {
      const success = await this.engine.loadScene(sceneId);
      if (success) {
        logScene('loadScene: Scene loaded successfully', {
          sceneId,
          entityManager: this.engine.getEntityManager()?.getAllEntities().length || 0,
        });
      } else {
        logScene('loadScene: Load returned false', {
          sceneId,
        });
      }
      return success;
    } catch (error) {
      logScene('loadScene: Error loading scene', {
        sceneId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Subscribe to selection changes
   */
  subscribeToSelection(listener: (objects: Set<THREE.Object3D>, primary: THREE.Object3D | null) => void): () => void {
    this.selectionListeners.add(listener);
    return () => {
      this.selectionListeners.delete(listener);
    };
  }

  /**
   * Subscribe to transform mode changes
   */
  subscribeToTransformMode(listener: (mode: TransformMode) => void): () => void {
    this.transformModeListeners.add(listener);
    return () => {
      this.transformModeListeners.delete(listener);
    };
  }

  /**
   * Notify selection listeners
   */
  private notifySelectionListeners(): void {
    const selection = this.getSelection();
    this.selectionListeners.forEach((listener) => {
      listener(selection.objects, selection.primary);
    });
  }

  /**
   * Notify transform mode listeners
   */
  private notifyTransformModeListeners(): void {
    this.transformModeListeners.forEach((listener) => {
      listener(this.transformMode);
    });
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.clearSelection();
    this.selectionListeners.clear();
    this.transformModeListeners.clear();
    this.engine = null;
  }
}

