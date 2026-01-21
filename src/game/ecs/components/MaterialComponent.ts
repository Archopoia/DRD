import { Component } from '../Component';
import { Entity } from '../Entity';
import * as THREE from 'three';
import { MeshRendererComponent } from './MeshRendererComponent';

export interface MaterialProperties {
  materialId: string; // Reference to material in MaterialLibrary
}

/**
 * Material Component - Assigns materials from MaterialLibrary to entities
 * This component stores a material ID reference and applies it to the MeshRenderer
 */
export class MaterialComponent extends Component {
  public properties: MaterialProperties;
  private materialInstance: THREE.Material | null = null;
  private materialLibrary: any = null; // MaterialLibrary instance

  constructor(entity: Entity, properties: MaterialProperties, materialLibrary?: any) {
    super(entity);
    this.properties = { ...properties };
    this.materialLibrary = materialLibrary || null;
    
    if (materialLibrary && this.properties.materialId) {
      this.loadMaterial();
    }
  }

  /**
   * Load material from MaterialLibrary
   */
  private loadMaterial(): void {
    if (!this.materialLibrary || !this.properties.materialId) {
      return;
    }

    try {
      this.materialInstance = this.materialLibrary.getMaterial(this.properties.materialId);
      if (this.materialInstance) {
        this.applyMaterialToMesh();
      }
    } catch (error) {
      console.error(`[MaterialComponent] Failed to load material: ${this.properties.materialId}`, error);
    }
  }

  /**
   * Apply material to mesh renderer
   */
  private applyMaterialToMesh(): void {
    if (!this.materialInstance) return;

    // Get mesh renderer component
    const entityManager = this.entity.manager;
    if (!entityManager) return;

    const meshRenderer = entityManager.getComponent<MeshRendererComponent>(
      this.entity,
      'MeshRendererComponent'
    );

    if (meshRenderer) {
      const mesh = meshRenderer.getMesh();
      if (mesh && mesh instanceof THREE.Mesh) {
        // Clone material to avoid sharing instances between entities
        const clonedMaterial = this.materialInstance.clone();
        mesh.material = clonedMaterial;
        meshRenderer.updateMaterial(clonedMaterial);
      }
    }
  }

  /**
   * Set material ID and reload material
   */
  setMaterialId(materialId: string): void {
    if (this.properties.materialId === materialId) return;

    this.properties.materialId = materialId;
    this.loadMaterial();
  }

  /**
   * Get current material instance
   */
  getMaterial(): THREE.Material | null {
    return this.materialInstance;
  }

  /**
   * Set material library (for initialization after creation)
   */
  setMaterialLibrary(materialLibrary: any): void {
    this.materialLibrary = materialLibrary;
    if (this.properties.materialId) {
      this.loadMaterial();
    }
  }

  /**
   * Update material component
   */
  update(deltaTime: number): void {
    // Material components don't need per-frame updates
    // Material changes are applied immediately via setMaterialId
  }

  /**
   * Serialize material component
   */
  serialize(): any {
    return {
      type: 'MaterialComponent',
      properties: {
        ...this.properties,
      },
    };
  }

  /**
   * Deserialize material component
   */
  deserialize(data: any): void {
    this.properties = {
      ...this.properties,
      ...data.properties,
    };
    
    // Reload material if material library is available
    if (this.materialLibrary && this.properties.materialId) {
      this.loadMaterial();
    }
  }

  /**
   * Clone material component
   */
  clone(entity: Entity): MaterialComponent {
    const cloned = new MaterialComponent(entity, { ...this.properties }, this.materialLibrary);
    cloned.enabled = this.enabled;
    return cloned;
  }

  /**
   * Cleanup material (materials are managed by MaterialLibrary, so we don't dispose here)
   */
  onRemove(): void {
    // Don't dispose materials here - they're cached in MaterialLibrary
    this.materialInstance = null;
  }
}
