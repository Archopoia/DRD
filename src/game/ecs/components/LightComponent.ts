import * as THREE from 'three';
import { Component } from '../Component';
import { Entity } from '../Entity';

export type LightType = 'ambient' | 'directional' | 'point' | 'spot';

export interface LightProperties {
  type: LightType;
  color: number;
  intensity: number;
  // For point/spot lights
  distance?: number;
  decay?: number;
  // For spot lights
  angle?: number;
  penumbra?: number;
  // For directional lights
  castShadow?: boolean;
}

/**
 * Light Component - Handles lighting
 */
export class LightComponent extends Component {
  public properties: LightProperties;
  public light: THREE.Light | null = null;

  constructor(entity: Entity, properties: LightProperties) {
    super(entity);
    this.properties = { ...properties };
    this.createLight();
  }

  /**
   * Create Three.js light from properties
   */
  private createLight(): void {
    switch (this.properties.type) {
      case 'ambient':
        this.light = new THREE.AmbientLight(this.properties.color, this.properties.intensity);
        break;
      case 'directional':
        const dirLight = new THREE.DirectionalLight(this.properties.color, this.properties.intensity);
        dirLight.castShadow = this.properties.castShadow || false;
        this.light = dirLight;
        break;
      case 'point':
        const pointLight = new THREE.PointLight(
          this.properties.color,
          this.properties.intensity,
          this.properties.distance || 0,
          this.properties.decay || 2
        );
        this.light = pointLight;
        break;
      case 'spot':
        const spotLight = new THREE.SpotLight(
          this.properties.color,
          this.properties.intensity,
          this.properties.distance || 0,
          this.properties.angle || Math.PI / 3,
          this.properties.penumbra || 0,
          this.properties.decay || 2
        );
        spotLight.castShadow = this.properties.castShadow || false;
        this.light = spotLight;
        break;
      default:
        this.light = new THREE.PointLight(this.properties.color, this.properties.intensity);
    }

    this.light.name = `${this.entity.name}_light`;
    this.light.userData.entityId = this.entity.id;
    this.light.visible = this.enabled;
  }

  /**
   * Get Three.js light
   */
  getLight(): THREE.Light | null {
    if (this.light) {
      this.light.visible = this.enabled;
    }
    return this.light;
  }

  /**
   * Update light color
   */
  setColor(color: number): void {
    this.properties.color = color;
    if (this.light) {
      this.light.color.setHex(color);
    }
  }

  /**
   * Update light intensity
   */
  setIntensity(intensity: number): void {
    this.properties.intensity = intensity;
    if (this.light) {
      this.light.intensity = intensity;
    }
  }

  /**
   * Update transform from entity's transform component
   */
  updateTransform(position: THREE.Vector3, rotation?: THREE.Euler, target?: THREE.Vector3): void {
    if (!this.light) return;
    
    this.light.position.copy(position);
    
    if (rotation) {
      // For directional and spot lights, rotation affects direction
      if (this.light instanceof THREE.DirectionalLight || this.light instanceof THREE.SpotLight) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(rotation);
        if (this.light instanceof THREE.DirectionalLight) {
          this.light.target.position.copy(position).add(direction);
        } else if (this.light instanceof THREE.SpotLight) {
          this.light.target.position.copy(position).add(direction);
        }
      }
    }
    
    if (target && (this.light instanceof THREE.DirectionalLight || this.light instanceof THREE.SpotLight)) {
      this.light.target.position.copy(target);
    }
  }

  onRemove(): void {
    if (this.light) {
      // Dispose light if needed (lights don't have dispose in Three.js, but we can clear references)
      this.light = null;
    }
  }

  serialize(): any {
    return {
      type: 'LightComponent',
      properties: this.properties,
      enabled: this.enabled,
    };
  }

  deserialize(data: any): void {
    if (data.properties) {
      this.properties = { ...data.properties };
      // Recreate light
      this.onRemove();
      this.createLight();
    }
    if (data.enabled !== undefined) this.enabled = data.enabled;
  }

  clone(entity: Entity): LightComponent {
    const cloned = new LightComponent(entity, { ...this.properties });
    cloned.enabled = this.enabled;
    return cloned;
  }
}




