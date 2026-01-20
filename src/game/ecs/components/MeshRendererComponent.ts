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
 * MeshRenderer Component - Handles 3D mesh rendering
 */
export class MeshRendererComponent extends Component {
  public mesh: THREE.Mesh | null = null;
  public geometry: MeshGeometry;
  public materialColor: number;
  public visible: boolean = true;
  private renderer: RetroRenderer | null = null;

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
    };
  }

  deserialize(data: any): void {
    if (data.geometry) this.geometry = data.geometry;
    if (data.materialColor !== undefined) this.setColor(data.materialColor);
    if (data.visible !== undefined) this.setVisible(data.visible);
    if (data.enabled !== undefined) this.enabled = data.enabled;
  }

  clone(entity: Entity): MeshRendererComponent {
    const cloned = new MeshRendererComponent(entity, { ...this.geometry }, this.materialColor, this.renderer);
    cloned.visible = this.visible;
    cloned.enabled = this.enabled;
    return cloned;
  }
}




