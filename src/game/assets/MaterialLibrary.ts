import * as THREE from 'three';
import { MaterialDefinition } from './types';
import { Debug } from '../utils/debug';

/**
 * Material Library - Loads and manages material definitions from JSON files
 * Materials can be referenced by ID throughout the game
 */
export class MaterialLibrary {
  private materials: Map<string, MaterialDefinition> = new Map();
  private materialInstances: Map<string, THREE.Material> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private loaded: boolean = false;

  /**
   * Initialize material library by loading all material JSON files
   * This is called once at game startup
   */
  async initialize(): Promise<void> {
    if (this.loaded) {
      Debug.log('MaterialLibrary', 'Already initialized');
      return;
    }

    Debug.log('MaterialLibrary', 'Initializing material library...');

    try {
      // List of material files to load
      // In a real implementation, we'd scan the directory or have a manifest
      const materialFiles = [
        'materials/stone.json',
        'materials/metal.json',
        'materials/wood.json',
      ];

      // Load all material definitions
      for (const file of materialFiles) {
        try {
          const response = await fetch(`/game/assets/${file}`);
          if (!response.ok) {
            Debug.warn('MaterialLibrary', `Failed to load material file: ${file}`);
            continue;
          }

          const materialDef: MaterialDefinition = await response.json();
          this.materials.set(materialDef.id, materialDef);
          Debug.log('MaterialLibrary', `Loaded material: ${materialDef.id} (${materialDef.name})`);
        } catch (error) {
          Debug.error('MaterialLibrary', `Error loading material file ${file}:`, error as Error);
        }
      }

      this.loaded = true;
      Debug.log('MaterialLibrary', `Material library initialized with ${this.materials.size} materials`);
    } catch (error) {
      Debug.error('MaterialLibrary', 'Failed to initialize material library', error as Error);
      throw error;
    }
  }

  /**
   * Get material definition by ID
   */
  getMaterialDefinition(id: string): MaterialDefinition | null {
    return this.materials.get(id) || null;
  }

  /**
   * Get all material definitions
   */
  getAllMaterialDefinitions(): MaterialDefinition[] {
    return Array.from(this.materials.values());
  }

  /**
   * Create a Three.js material from a material definition
   * Materials are cached for performance
   */
  createMaterial(id: string): THREE.Material | null {
    // Check cache first
    if (this.materialInstances.has(id)) {
      return this.materialInstances.get(id)!;
    }

    const materialDef = this.materials.get(id);
    if (!materialDef) {
      Debug.warn('MaterialLibrary', `Material not found: ${id}`);
      return null;
    }

    // Create material
    const material = new THREE.MeshStandardMaterial();

    // Set color from diffuse
    if (materialDef.diffuse.startsWith('#')) {
      material.color.setHex(parseInt(materialDef.diffuse.replace('#', '0x')));
    } else {
      // Assume it's a texture path
      material.color.setHex(0xffffff); // White for textured materials
    }

    // Set material properties
    material.roughness = materialDef.roughness ?? 0.5;
    material.metalness = materialDef.metalness ?? 0.0;

    if (materialDef.emissive) {
      material.emissive.setHex(parseInt(materialDef.emissive.replace('#', '0x')));
    }

    // Load textures if specified (async, non-blocking - material works with or without textures)
    if (materialDef.textures) {
      // Don't await - textures will load in background and apply when ready
      this.loadTexturesForMaterial(material, materialDef).catch(err => {
        Debug.warn('MaterialLibrary', `Some textures failed to load for material ${id}. Material will use colors only.`);
      });
    }

    // Cache the material
    this.materialInstances.set(id, material);

    Debug.log('MaterialLibrary', `Created material instance: ${id}`);
    return material;
  }

  /**
   * Load textures for a material
   * Textures are optional - if a texture fails to load, the material will still work with just colors
   */
  private async loadTexturesForMaterial(material: THREE.MeshStandardMaterial, materialDef: MaterialDefinition): Promise<void> {
    if (!materialDef.textures) return;

    // Load diffuse texture (optional)
    if (materialDef.textures.diffuse) {
      try {
        const texture = await this.loadTexture(materialDef.textures.diffuse);
        if (texture) {
          material.map = texture;
        }
      } catch (error) {
        // Texture failed to load - use color only
        Debug.warn('MaterialLibrary', `Failed to load diffuse texture for ${materialDef.id}: ${materialDef.textures.diffuse}. Using color only.`);
      }
    }

    // Load normal map (optional)
    if (materialDef.textures.normal) {
      try {
        const texture = await this.loadTexture(materialDef.textures.normal);
        if (texture) {
          material.normalMap = texture;
        }
      } catch (error) {
        // Normal map failed to load - continue without it
        Debug.warn('MaterialLibrary', `Failed to load normal map for ${materialDef.id}: ${materialDef.textures.normal}. Continuing without normal map.`);
      }
    }

    // Load roughness map (optional)
    if (materialDef.textures.roughness) {
      try {
        const texture = await this.loadTexture(materialDef.textures.roughness);
        if (texture) {
          material.roughnessMap = texture;
        }
      } catch (error) {
        // Roughness map failed to load - continue without it
        Debug.warn('MaterialLibrary', `Failed to load roughness map for ${materialDef.id}: ${materialDef.textures.roughness}. Continuing without roughness map.`);
      }
    }

    // Load metalness map (optional)
    if (materialDef.textures.metalness) {
      try {
        const texture = await this.loadTexture(materialDef.textures.metalness);
        if (texture) {
          material.metalnessMap = texture;
        }
      } catch (error) {
        // Metalness map failed to load - continue without it
        Debug.warn('MaterialLibrary', `Failed to load metalness map for ${materialDef.id}: ${materialDef.textures.metalness}. Continuing without metalness map.`);
      }
    }
  }

  /**
   * Load a texture from a path (with caching)
   * Returns null if texture fails to load (materials will work with colors only)
   */
  private async loadTexture(path: string): Promise<THREE.Texture | null> {
    // Check cache
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }

    try {
      const textureLoader = new THREE.TextureLoader();
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          `/${path}`,
          (texture) => {
            // Apply retro-style texture filtering
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
            resolve(texture);
          },
          undefined,
          (error) => {
            // Log warning but don't throw - allow material to work without texture
            Debug.warn('MaterialLibrary', `Texture not found: ${path}. Material will use color only.`);
            reject(error);
          }
        );
      });

      this.textureCache.set(path, texture);
      Debug.log('MaterialLibrary', `Loaded texture: ${path}`);
      return texture;
    } catch (error) {
      // Return null instead of throwing - material will work with color only
      // Error is already logged in the textureLoader.load error callback
      return null;
    }
  }

  /**
   * Get material by ID (returns cached instance or creates new one)
   */
  getMaterial(id: string): THREE.Material | null {
    return this.createMaterial(id);
  }

  /**
   * Check if material exists
   */
  hasMaterial(id: string): boolean {
    return this.materials.has(id);
  }

  /**
   * Clear material cache (useful for hot reload)
   */
  clearCache(): void {
    // Dispose cached materials
    this.materialInstances.forEach((material) => {
      material.dispose();
    });
    this.materialInstances.clear();

    // Dispose cached textures
    this.textureCache.forEach((texture) => {
      texture.dispose();
    });
    this.textureCache.clear();

    Debug.log('MaterialLibrary', 'Cleared material cache');
  }

  /**
   * Reload all materials (for hot reload)
   */
  async reload(): Promise<void> {
    this.materials.clear();
    this.clearCache();
    this.loaded = false;
    await this.initialize();
  }
}
