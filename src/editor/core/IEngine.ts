/**
 * Engine Interface - Abstraction layer between editor and game engine
 * This allows the editor to work with the engine without tight coupling
 */

import * as THREE from 'three';
import { EntityManager } from '@/game/ecs/EntityManager';
import { EntityFactory } from '@/game/ecs/factories/EntityFactory';
import { PrefabManager } from '@/game/ecs/prefab/PrefabManager';
import { SceneStorage } from '@/game/ecs/storage/SceneStorage';

/**
 * Interface for engine operations needed by the editor
 * This abstracts the Game class so the editor doesn't need to know its internals
 */
export interface IEngine {
  /**
   * Get the Three.js scene
   */
  getScene(): THREE.Scene;

  /**
   * Get the EntityManager (ECS system)
   */
  getEntityManager(): EntityManager | null;

  /**
   * Get the EntityFactory (for creating entities)
   */
  getEntityFactory(): EntityFactory | null;

  /**
   * Get the PrefabManager (for prefab operations)
   */
  getPrefabManager(): PrefabManager | null;

  /**
   * Get the SceneStorage (for save/load operations)
   */
  getSceneStorage(): SceneStorage | null;

  /**
   * Add an object to the scene
   */
  addObjectToScene(type: 'box' | 'sphere' | 'plane' | 'light' | 'group' | 'trigger' | 'spawnPoint' | 'npc' | 'item'): THREE.Object3D | null;

  /**
   * Update physics body for a mesh (when editor modifies object transform)
   */
  updatePhysicsBodyForMesh(mesh: THREE.Mesh): void;

  /**
   * Save current scene
   */
  saveScene(sceneName: string, author?: string): Promise<string | null>;

  /**
   * Load scene from storage
   */
  loadScene(sceneId: string): Promise<boolean>;

  /**
   * Pause the game (pause physics simulation)
   */
  pause(): void;

  /**
   * Resume the game (resume physics simulation)
   */
  resume(): void;

  /**
   * Check if game is running
   */
  isRunning(): boolean;

  /**
   * Get ScriptLoader (for script operations)
   */
  getScriptLoader?: () => any;

  /**
   * Get MaterialLibrary (for material operations)
   */
  getMaterialLibrary?: () => any;

  /**
   * Get RetroRenderer (for brush creation)
   */
  getRenderer?: () => any;

  /**
   * Get PhysicsWorld (for brush creation)
   */
  getPhysicsWorld?: () => any;
}

