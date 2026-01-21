import * as THREE from 'three';
import { Component } from '../Component';
import { Entity } from '../Entity';
import { RetroRenderer } from '../../renderer/RetroRenderer';

export type MeshType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'custom';
export type MeshGeometry = {
  type: MeshType;
  // For box
  width?: number;
  height?: number;
  depth?: number;
  // For sphere
  radius?: number;
  segments?: number;
  // For plane
  planeWidth?: number;
  planeHeight?: number;
  // For cylinder
  cylinderRadius?: number;
  cylinderHeight?: number;
  // For custom (gltf/glb path)
  path?: string;
};

/**
 * Per-face material mapping - allows assigning different materials to different faces
 * For a box: [0: right, 1: left, 2: top, 3: bottom, 4: front, 5: back]
 * For a plane: [0: front, 1: back]
 * For a cylinder/cone: indexed by ring (top to bottom)
 */
export type FaceMaterialMap = {
  [faceIndex: number]: string; // faceIndex -> materialId (from MaterialLibrary)
};

/**
 * MeshRenderer Component - Handles 3D mesh rendering
 */
export class MeshRendererComponent extends Component {
  public mesh: THREE.Mesh | null = null;
  public geometry: MeshGeometry;
  public materialColor: number;
  public visible: boolean = true;
  private renderer: RetroRenderer | null = null;
  private faceMaterialMap: FaceMaterialMap | null = null; // Per-face material assignments
  private materialLibrary: any = null; // MaterialLibrary instance for per-face materials

  constructor(
    entity: Entity,
    geometry: MeshGeometry,
    color: number = 0x808080,
    renderer?: RetroRenderer
  ) {
    super(entity);
    this.geometry = geometry;
    this.materialColor = color;
    this.renderer = renderer || null;
    this.createMesh();
  }

  /**
   * Create Three.js mesh from geometry definition
   */
  private createMesh(): void {
    if (!this.renderer) {
      console.warn('MeshRendererComponent: No renderer provided, mesh will not be created');
      return;
    }

    let threeGeometry: THREE.BufferGeometry;

    switch (this.geometry.type) {
      case 'box':
        threeGeometry = new THREE.BoxGeometry(
          this.geometry.width || 1,
          this.geometry.height || 1,
          this.geometry.depth || 1
        );
        break;
      case 'sphere':
        const segments = this.geometry.segments || 16;
        threeGeometry = new THREE.SphereGeometry(
          this.geometry.radius || 0.5,
          segments,
          segments
        );
        break;
      case 'plane':
        threeGeometry = new THREE.PlaneGeometry(
          this.geometry.planeWidth || 2,
          this.geometry.planeHeight || 2
        );
        break;
      case 'cylinder':
        const cylSegments = this.geometry.segments || 16;
        threeGeometry = new THREE.CylinderGeometry(
          this.geometry.cylinderRadius || 0.5,
          this.geometry.cylinderRadius || 0.5,
          this.geometry.cylinderHeight || 1,
          cylSegments
        );
        break;
      case 'cone':
        const coneSegments = this.geometry.segments || 16;
        threeGeometry = new THREE.ConeGeometry(
          this.geometry.radius || 0.5,
          this.geometry.cylinderHeight || 1,
          coneSegments
        );
        break;
      case 'custom':
        // TODO: Load from GLTF/GLB
        console.warn('MeshRendererComponent: Custom geometry loading not yet implemented');
        threeGeometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      default:
        threeGeometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = this.renderer.createRetroStandardMaterial(this.materialColor);
    this.mesh = new THREE.Mesh(threeGeometry, material);
    this.mesh.name = `${this.entity.name}_mesh`;
    this.mesh.visible = this.visible;
    this.mesh.userData.entityId = this.entity.id;
    
    // Apply per-face materials if specified
    if (this.faceMaterialMap && this.materialLibrary) {
      this.applyPerFaceMaterials();
    }
  }

  /**
   * Get Three.js mesh (creates if not exists)
   */
  getMesh(renderer?: RetroRenderer): THREE.Mesh | null {
    if (!this.mesh && renderer) {
      this.renderer = renderer;
      this.createMesh();
    }
    if (this.mesh) {
      this.mesh.visible = this.visible && this.enabled;
    }
    return this.mesh;
  }

  /**
   * Set material color
   */
  setColor(color: number): void {
    this.materialColor = color;
    if (this.mesh && this.mesh.material instanceof THREE.MeshStandardMaterial) {
      this.mesh.material.color.setHex(color);
    }
  }

  /**
   * Update material (allows MaterialComponent to set materials from MaterialLibrary)
   */
  updateMaterial(material: THREE.Material): void {
    if (!this.mesh) return;

    // Dispose old material if needed
    if (this.mesh.material) {
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        // Only dispose if it's not a shared material from MaterialLibrary
        // MaterialLibrary manages material lifecycle, so we don't dispose here
      }
    }

    // Set new material
    this.mesh.material = material;
    
    // Update material color property if it's a MeshStandardMaterial
    if (material instanceof THREE.MeshStandardMaterial && material.color) {
      this.materialColor = material.color.getHex();
    }
  }

  /**
   * Get current material instance
   */
  getMaterial(): THREE.Material | THREE.Material[] | null {
    return this.mesh?.material || null;
  }

  /**
   * Set per-face material mapping
   * @param faceMaterialMap Map of face indices to material IDs
   */
  setPerFaceMaterials(faceMaterialMap: FaceMaterialMap | null): void {
    this.faceMaterialMap = faceMaterialMap;
    if (this.mesh && this.faceMaterialMap && this.materialLibrary) {
      this.applyPerFaceMaterials();
    }
  }

  /**
   * Get per-face material mapping
   */
  getPerFaceMaterials(): FaceMaterialMap | null {
    return this.faceMaterialMap;
  }

  /**
   * Set material library (needed for per-face materials)
   */
  setMaterialLibrary(materialLibrary: any): void {
    this.materialLibrary = materialLibrary;
    if (this.mesh && this.faceMaterialMap) {
      this.applyPerFaceMaterials();
    }
  }

  /**
   * Apply per-face materials to mesh
   */
  private applyPerFaceMaterials(): void {
    if (!this.mesh || !this.faceMaterialMap || !this.materialLibrary) return;

    const geometry = this.mesh.geometry;
    if (!geometry || !(geometry instanceof THREE.BufferGeometry)) return;

    // Count how many unique materials we need
    const uniqueMaterialIds = new Set(Object.values(this.faceMaterialMap!));
    if (uniqueMaterialIds.size === 0) return; // No face materials specified

    // Get material instances from MaterialLibrary
    const materials: THREE.Material[] = [];
    const materialIdToIndex = new Map<string, number>();

    uniqueMaterialIds.forEach(materialId => {
      const material = this.materialLibrary.getMaterial(materialId);
      if (material) {
        materialIdToIndex.set(materialId, materials.length);
        materials.push(material.clone()); // Clone to avoid sharing between faces
      }
    });

    if (materials.length === 0) return; // No valid materials found

    // For boxes, we need to create groups and assign materials to groups
    if (this.geometry.type === 'box' && geometry instanceof THREE.BoxGeometry) {
      // Box has 6 faces: front, back, top, bottom, left, right
      // Three.js BoxGeometry groups faces in pairs (2 triangles per face)
      // Face indices: 0-1: right, 2-3: left, 4-5: top, 6-7: bottom, 8-9: front, 10-11: back
      const faceMapping: { [key: string]: number } = {
        'right': 0,
        'left': 1,
        'top': 2,
        'bottom': 3,
        'front': 4,
        'back': 5,
      };

      // Clear existing groups
      geometry.clearGroups();

      // Assign materials to each face
      for (const [faceName, faceIndex] of Object.entries(faceMapping)) {
        const materialId = this.faceMaterialMap[faceIndex];
        if (materialId) {
          const materialIndex = materialIdToIndex.get(materialId);
          if (materialIndex !== undefined) {
            // Each face is 2 triangles (6 vertices), so each face uses indices [faceIndex*2, faceIndex*2+1]
            geometry.addGroup(faceIndex * 2, 6, materialIndex);
          }
        }
      }

      // If some faces don't have materials, use default
      let defaultMaterialIndex = 0;
      if (materials.length > 0) {
        defaultMaterialIndex = materialIdToIndex.get(Object.values(this.faceMaterialMap)[0]) || 0;
      }

      // Fill in groups for faces without materials
      for (let i = 0; i < 6; i++) {
        const existingGroup = geometry.groups.find(g => g.start === i * 2);
        if (!existingGroup) {
          geometry.addGroup(i * 2, 6, defaultMaterialIndex);
        }
      }

      // Set materials array on mesh
      this.mesh.material = materials.length === 1 ? materials[0] : materials;
    } else {
      // For other geometry types, per-face materials are more complex
      // For now, use the first material or fallback to single material
      console.warn('MeshRendererComponent: Per-face materials only fully supported for boxes');
      this.mesh.material = materials.length > 0 ? materials[0] : this.mesh.material;
    }

    // Update material color property
    if (materials.length > 0 && materials[0] instanceof THREE.MeshStandardMaterial) {
      this.materialColor = materials[0].color.getHex();
    }
  }

  /**
   * Update mesh visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.mesh) {
      this.mesh.visible = visible && this.enabled;
    }
  }

  /**
   * Update transform from entity's transform component
   */
  updateTransform(transform: { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }): void {
    if (!this.mesh) return;
    this.mesh.position.copy(transform.position);
    this.mesh.rotation.copy(transform.rotation);
    this.mesh.scale.copy(transform.scale);
  }

  onRemove(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }

  serialize(): any {
    return {
      type: 'MeshRendererComponent',
      geometry: this.geometry,
      materialColor: this.materialColor,
      visible: this.visible,
      enabled: this.enabled,
      faceMaterialMap: this.faceMaterialMap || undefined,
    };
  }

  deserialize(data: any): void {
    if (data.geometry) this.geometry = data.geometry;
    if (data.materialColor !== undefined) this.setColor(data.materialColor);
    if (data.visible !== undefined) this.setVisible(data.visible);
    if (data.enabled !== undefined) this.enabled = data.enabled;
    if (data.faceMaterialMap) {
      this.faceMaterialMap = data.faceMaterialMap;
      // Recreate mesh to apply per-face materials
      if (this.mesh) {
        this.createMesh();
      }
    }
  }

  clone(entity: Entity): MeshRendererComponent {
    const cloned = new MeshRendererComponent(entity, { ...this.geometry }, this.materialColor, this.renderer);
    cloned.visible = this.visible;
    cloned.enabled = this.enabled;
    cloned.faceMaterialMap = this.faceMaterialMap ? { ...this.faceMaterialMap } : null;
    cloned.materialLibrary = this.materialLibrary;
    // Apply per-face materials if needed
    if (cloned.faceMaterialMap && cloned.materialLibrary) {
      cloned.applyPerFaceMaterials();
    }
    return cloned;
  }
}




