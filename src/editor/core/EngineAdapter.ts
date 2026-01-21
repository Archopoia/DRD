/**
 * EngineAdapter - Adapts Game instance to IEngine interface
 * This allows the editor to work with the Game class through a clean interface
 */

import { IEngine } from './IEngine';
import * as THREE from 'three';

/**
 * Adapter that wraps a Game instance to implement IEngine
 * This allows the editor to work with Game without knowing its internals
 */
export class EngineAdapter implements IEngine {
  private game: any; // Game instance - using any to avoid circular dependencies

  constructor(game: any) {
    this.game = game;
  }

  getScene(): THREE.Scene {
    return this.game.getScene();
  }

  getEntityManager() {
    return this.game.getEntityManager?.() || null;
  }

  getEntityFactory() {
    return this.game.getEntityFactory?.() || null;
  }

  getPrefabManager() {
    return this.game.getPrefabManager?.() || null;
  }

  getSceneStorage() {
    return this.game.getSceneStorage?.() || null;
  }

  addObjectToScene(type: 'box' | 'sphere' | 'plane' | 'light' | 'group' | 'trigger'): THREE.Object3D | null {
    return this.game.addObjectToScene?.(type) || null;
  }

  updatePhysicsBodyForMesh(mesh: THREE.Mesh): void {
    if (this.game.updatePhysicsBodyForMesh) {
      this.game.updatePhysicsBodyForMesh(mesh);
    }
  }

  async saveScene(sceneName: string, author?: string): Promise<string | null> {
    if (this.game.saveScene) {
      return await this.game.saveScene(sceneName, author);
    }
    return null;
  }

  async loadScene(sceneId: string): Promise<boolean> {
    if (this.game.loadScene) {
      return await this.game.loadScene(sceneId);
    }
    return false;
  }

  pause(): void {
    if (this.game.pause) {
      this.game.pause();
    }
  }

  resume(): void {
    if (this.game.resume) {
      this.game.resume();
    }
  }

  isRunning(): boolean {
    return this.game.isRunning ? this.game.isRunning() : false;
  }

  getScriptLoader() {
    return this.game.getScriptLoader?.() || null;
  }

  getMaterialLibrary() {
    return this.game.getMaterialLibrary?.() || null;
  }

  getRenderer() {
    return this.game.getRenderer?.() || null;
  }

  getPhysicsWorld() {
    return this.game.getPhysicsWorld?.() || null;
  }
}

