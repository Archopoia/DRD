import * as THREE from 'three';

export type TransformMode = 'translate' | 'rotate' | 'scale';

/**
 * Transform Gizmo Helper - Creates visual handles for manipulating objects
 */
export class TransformGizmo {
  private gizmoGroup: THREE.Group | null = null;
  private scene: THREE.Scene | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private mode: TransformMode = 'translate';
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Set the selected object and update gizmo
   */
  setSelectedObject(object: THREE.Object3D | null): void {
    this.selectedObject = object;
    this.updateGizmo();
  }

  /**
   * Set transform mode
   */
  setMode(mode: TransformMode): void {
    this.mode = mode;
    this.updateGizmo();
  }

  /**
   * Set camera reference
   */
  setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * Update gizmo visual representation
   */
  private updateGizmo(): void {
    if (!this.scene) return;

    // Remove old gizmo
    if (this.gizmoGroup) {
      this.scene.remove(this.gizmoGroup);
      this.disposeGizmo(this.gizmoGroup);
      this.gizmoGroup = null;
    }

    if (!this.selectedObject) return;

    this.gizmoGroup = new THREE.Group();
    this.gizmoGroup.name = 'TransformGizmo';
    this.gizmoGroup.userData.isGizmo = true;
    
    // Mark all children as gizmo parts for proper exclusion from selection
    const markAsGizmo = (obj: THREE.Object3D) => {
      obj.userData.isGizmo = true;
      obj.children.forEach(child => markAsGizmo(child));
    };

    // Calculate gizmo size
    const box = new THREE.Box3().setFromObject(this.selectedObject);
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const gizmoSize = Math.max(0.5, Math.min(2.0, maxSize * 0.3));

    if (this.mode === 'translate') {
      this.createTranslateGizmo(gizmoSize);
    } else if (this.mode === 'rotate') {
      this.createRotateGizmo(gizmoSize);
    } else if (this.mode === 'scale') {
      this.createScaleGizmo(gizmoSize);
    }

    // Mark all gizmo children as gizmo parts
    if (this.gizmoGroup) {
      markAsGizmo(this.gizmoGroup);
      
      // Position gizmo at selected object
      if (this.selectedObject) {
        this.gizmoGroup.position.copy(this.selectedObject.position);
        this.gizmoGroup.quaternion.copy(this.selectedObject.quaternion);
        this.scene.add(this.gizmoGroup);
      }
    }
  }

  /**
   * Create translation gizmo (arrows)
   */
  private createTranslateGizmo(size: number): void {
    if (!this.gizmoGroup) return;

    const arrowLength = size;
    const arrowRadius = size * 0.05;
    const coneHeight = size * 0.2;
    const coneRadius = size * 0.1;

    // X axis - Red
    const xArrow = this.createArrow(new THREE.Color(0xff0000), arrowLength, arrowRadius, coneHeight, coneRadius);
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.userData.axis = 'x';
    xArrow.userData.type = 'translate';
    xArrow.userData.color = 0xff0000;
    this.gizmoGroup.add(xArrow);

    // Y axis - Green
    const yArrow = this.createArrow(new THREE.Color(0x00ff00), arrowLength, arrowRadius, coneHeight, coneRadius);
    yArrow.userData.axis = 'y';
    yArrow.userData.type = 'translate';
    yArrow.userData.color = 0x00ff00;
    this.gizmoGroup.add(yArrow);

    // Z axis - Blue
    const zArrow = this.createArrow(new THREE.Color(0x0000ff), arrowLength, arrowRadius, coneHeight, coneRadius);
    zArrow.rotation.x = Math.PI / 2;
    zArrow.userData.axis = 'z';
    zArrow.userData.type = 'translate';
    zArrow.userData.color = 0x0000ff;
    this.gizmoGroup.add(zArrow);
  }

  /**
   * Create rotation gizmo (circles)
   */
  private createRotateGizmo(size: number): void {
    if (!this.gizmoGroup) return;

    const radius = size * 0.8;
    const tubeRadius = size * 0.02;
    const segments = 64;

    // X axis - Red
    const xCircle = this.createCircle(new THREE.Color(0xff0000), radius, tubeRadius, segments);
    xCircle.rotation.z = Math.PI / 2;
    xCircle.userData.axis = 'x';
    xCircle.userData.type = 'rotate';
    xCircle.userData.color = 0xff0000;
    this.gizmoGroup.add(xCircle);

    // Y axis - Green
    const yCircle = this.createCircle(new THREE.Color(0x00ff00), radius, tubeRadius, segments);
    yCircle.userData.axis = 'y';
    yCircle.userData.type = 'rotate';
    yCircle.userData.color = 0x00ff00;
    this.gizmoGroup.add(yCircle);

    // Z axis - Blue
    const zCircle = this.createCircle(new THREE.Color(0x0000ff), radius, tubeRadius, segments);
    zCircle.rotation.x = Math.PI / 2;
    zCircle.userData.axis = 'z';
    zCircle.userData.type = 'rotate';
    zCircle.userData.color = 0x0000ff;
    this.gizmoGroup.add(zCircle);
  }

  /**
   * Create scale gizmo (boxes at end of axes)
   */
  private createScaleGizmo(size: number): void {
    if (!this.gizmoGroup) return;

    const axisLength = size * 0.8;
    const axisRadius = size * 0.03;
    const boxSize = size * 0.15;

    // X axis - Red
    const xScale = this.createScaleHandle(new THREE.Color(0xff0000), axisLength, axisRadius, boxSize);
    xScale.userData.axis = 'x';
    xScale.userData.type = 'scale';
    xScale.userData.color = 0xff0000;
    this.gizmoGroup.add(xScale);

    // Y axis - Green
    const yScale = this.createScaleHandle(new THREE.Color(0x00ff00), axisLength, axisRadius, boxSize);
    yScale.userData.axis = 'y';
    yScale.userData.type = 'scale';
    yScale.userData.color = 0x00ff00;
    this.gizmoGroup.add(yScale);

    // Z axis - Blue
    const zScale = this.createScaleHandle(new THREE.Color(0x0000ff), axisLength, axisRadius, boxSize);
    zScale.rotation.z = -Math.PI / 2;
    zScale.userData.axis = 'z';
    zScale.userData.type = 'scale';
    zScale.userData.color = 0x0000ff;
    this.gizmoGroup.add(zScale);
  }

  /**
   * Create arrow for translation
   */
  private createArrow(color: THREE.Color, length: number, radius: number, coneHeight: number, coneRadius: number): THREE.Group {
    const group = new THREE.Group();
    
    const shaftGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    const shaftMaterial = new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.4
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = length / 2;
    group.add(shaft);
    
    const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = length + coneHeight / 2;
    group.add(cone);
    
    return group;
  }

  /**
   * Create circle for rotation
   */
  private createCircle(color: THREE.Color, radius: number, tubeRadius: number, segments: number): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 8, segments);
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.5
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create scale handle
   */
  private createScaleHandle(color: THREE.Color, length: number, radius: number, boxSize: number): THREE.Group {
    const group = new THREE.Group();
    
    const shaftGeometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    const shaftMaterial = new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.4
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = length / 2;
    group.add(shaft);
    
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMaterial = new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = length + boxSize / 2;
    group.add(box);
    
    return group;
  }

  /**
   * Get gizmo group for raycasting
   */
  getGizmoGroup(): THREE.Group | null {
    return this.gizmoGroup;
  }

  /**
   * Update gizmo position/rotation to match selected object
   */
  updatePosition(): void {
    if (!this.gizmoGroup || !this.selectedObject) return;

    this.gizmoGroup.position.copy(this.selectedObject.position);
    if (this.mode !== 'rotate') {
      this.gizmoGroup.quaternion.copy(this.selectedObject.quaternion);
    }
  }

  /**
   * Highlight axis on hover
   */
  highlightAxis(axis: string | null): void {
    if (!this.gizmoGroup) return;

    this.gizmoGroup.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
        if (child.userData.axis === axis) {
          // Highlight
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissiveIntensity = 0.8;
            child.material.opacity = 1.0;
          }
        } else {
          // Dim
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissiveIntensity = 0.3;
            child.material.opacity = 0.7;
          }
        }
      }
    });
  }

  /**
   * Dispose of gizmo resources
   */
  dispose(): void {
    if (this.gizmoGroup && this.scene) {
      this.scene.remove(this.gizmoGroup);
      this.disposeGizmo(this.gizmoGroup);
      this.gizmoGroup = null;
    }
  }

  private disposeGizmo(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}

