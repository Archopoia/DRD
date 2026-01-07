import * as THREE from 'three';
import { GAME_CONFIG } from '@/lib/constants';
import type { CameraControls, MouseState } from '../utils/types';
import { Debug } from '../utils/debug';

/**
 * First-person camera controller with mouse look and WASD movement
 */
export class FPSCamera {
  public camera: THREE.PerspectiveCamera;
  private controls: CameraControls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    run: false,
  };
  private mouseState: MouseState = {
    deltaX: 0,
    deltaY: 0,
    locked: false,
  };
  private euler: THREE.Euler;
  private velocity: THREE.Vector3;
  private direction: THREE.Vector3;

  constructor(canvas: HTMLCanvasElement) {
    Debug.log('FPSCamera', 'Initializing camera...');
    
    try {
      this.camera = new THREE.PerspectiveCamera(
        GAME_CONFIG.FOV,
        GAME_CONFIG.RENDER_WIDTH / GAME_CONFIG.RENDER_HEIGHT,
        GAME_CONFIG.NEAR,
        GAME_CONFIG.FAR
      );

      this.camera.position.set(0, 1.6, 0); // Eye height ~1.6m
      this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
      this.velocity = new THREE.Vector3();
      this.direction = new THREE.Vector3();

      this.setupEventListeners(canvas);
      Debug.log('FPSCamera', 'Camera initialized');
    } catch (error) {
      Debug.error('FPSCamera', 'Failed to initialize camera', error as Error);
      throw error;
    }
  }

  private setupEventListeners(canvas: HTMLCanvasElement): void {
    // Keyboard controls
    const onKeyDown = (event: KeyboardEvent): void => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.moveRight = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.run = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.controls.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.controls.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.controls.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.controls.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.controls.run = false;
          break;
      }
    };

    // Mouse movement
    const onMouseMove = (event: MouseEvent): void => {
      if (this.mouseState.locked) {
        this.mouseState.deltaX = event.movementX;
        this.mouseState.deltaY = event.movementY;
      }
    };

    // Pointer lock
    const onPointerLockChange = (): void => {
      const wasLocked = this.mouseState.locked;
      this.mouseState.locked = document.pointerLockElement === canvas;
      
      if (!wasLocked && this.mouseState.locked) {
        Debug.log('FPSCamera', 'Pointer locked');
      } else if (wasLocked && !this.mouseState.locked) {
        Debug.log('FPSCamera', 'Pointer unlocked');
      }
    };

    const onPointerLockError = (): void => {
      Debug.error('FPSCamera', 'Pointer lock failed');
    };

    // Click to lock pointer
    const onClick = (): void => {
      if (!this.mouseState.locked) {
        Debug.log('FPSCamera', 'Requesting pointer lock...');
        canvas.requestPointerLock();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    canvas.addEventListener('click', onClick);

    // Store cleanup function
    this.cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      canvas.removeEventListener('click', onClick);
    };
  }

  private cleanup?: () => void;

  /**
   * Update camera rotation based on mouse movement
   */
  updateRotation(): void {
    if (!this.mouseState.locked) return;

    const sensitivity = GAME_CONFIG.MOUSE_SENSITIVITY;
    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= this.mouseState.deltaX * sensitivity;
    this.euler.x -= this.mouseState.deltaY * sensitivity;

    // Clamp pitch
    const maxPitch = Math.PI / 2 - 0.1;
    this.euler.x = Math.max(-maxPitch, Math.min(maxPitch, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);

    // Reset deltas
    this.mouseState.deltaX = 0;
    this.mouseState.deltaY = 0;
  }

  /**
   * Update camera position based on movement controls
   */
  updatePosition(deltaTime: number): void {
    this.velocity.set(0, 0, 0);
    this.direction.set(0, 0, 0);

    if (this.controls.moveForward) this.direction.z -= 1;
    if (this.controls.moveBackward) this.direction.z += 1;
    if (this.controls.moveLeft) this.direction.x -= 1;
    if (this.controls.moveRight) this.direction.x += 1;

    // Normalize direction
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply camera rotation to movement direction
    this.velocity.copy(this.direction);
    this.velocity.applyQuaternion(this.camera.quaternion);
    this.velocity.y = 0; // Keep movement on horizontal plane

    // Apply speed
    const speed = this.controls.run
      ? GAME_CONFIG.MOVE_SPEED * GAME_CONFIG.RUN_MULTIPLIER
      : GAME_CONFIG.MOVE_SPEED;

    this.velocity.multiplyScalar(speed * deltaTime);
    this.camera.position.add(this.velocity);
  }

  /**
   * Update camera (call each frame)
   */
  update(deltaTime: number): void {
    this.updateRotation();
    this.updatePosition(deltaTime);
  }

  /**
   * Resize camera aspect ratio
   */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      Debug.warn('FPSCamera', `Invalid resize dimensions: ${width}x${height}`);
      return;
    }
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    Debug.log('FPSCamera', `Camera resized to aspect ${this.camera.aspect.toFixed(2)}`);
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    if (this.cleanup) {
      this.cleanup();
    }
    document.exitPointerLock();
  }
}



