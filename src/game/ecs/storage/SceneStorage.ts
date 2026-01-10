import { SceneSerializer, SerializedScene } from '../serialization/SceneSerializer';
import { EntityManager } from '../EntityManager';

const DB_NAME = 'DRD_SceneDB';
const DB_VERSION = 1;
const STORE_NAME = 'scenes';

/**
 * SceneStorage - Handles saving/loading scenes to/from IndexedDB
 */
export class SceneStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save scene to IndexedDB
   */
  async saveScene(sceneData: SerializedScene, id?: string): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }

    const sceneWithId = {
      ...sceneData,
      id: id || `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(sceneWithId);

      request.onsuccess = () => {
        resolve(sceneWithId.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to save scene'));
      };
    });
  }

  /**
   * Load scene from IndexedDB
   */
  async loadScene(id: string): Promise<SerializedScene | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to load scene'));
      };
    });
  }

  /**
   * List all saved scenes
   */
  async listScenes(): Promise<Array<{ id: string; name: string; createdAt: number; updatedAt: number }>> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const scenes = request.result.map((scene: any) => ({
          id: scene.id,
          name: scene.metadata?.name || 'Unnamed Scene',
          createdAt: scene.metadata?.createdAt || 0,
          updatedAt: scene.updatedAt || 0,
        }));
        resolve(scenes);
      };

      request.onerror = () => {
        reject(new Error('Failed to list scenes'));
      };
    });
  }

  /**
   * Delete scene from IndexedDB
   */
  async deleteScene(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete scene'));
      };
    });
  }

  /**
   * Export scene to JSON file (download)
   */
  exportToFile(sceneData: SerializedScene, filename?: string): void {
    const json = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${sceneData.metadata.name || 'scene'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import scene from JSON file (upload)
   */
  async importFromFile(file: File): Promise<SerializedScene> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const sceneData: SerializedScene = JSON.parse(json);
          resolve(sceneData);
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }
}

