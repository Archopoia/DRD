import * as THREE from 'three';
import { GAME_CONFIG } from '@/lib/constants';
import type { CameraControls, MouseState } from '../utils/types';
import { Debug } from '../utils/debug';
import { CharacterController } from '../physics/CharacterController';
import { ActiveCompetencesTracker } from '../character/ActiveCompetencesTracker';
import { Competence } from '../character/data/CompetenceData';

/**
 * First-person camera controller with mouse look and WASD movement
 */
export class FPSCamera {
  public camera: THREE.PerspectiveCamera;
  private characterController: CharacterController;
  private activeCompetencesTracker?: ActiveCompetencesTracker;
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
  private direction: THREE.Vector3;
  private controlsEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement, characterController: CharacterController, activeCompetencesTracker?: ActiveCompetencesTracker) {
    Debug.log('FPSCamera', 'Initializing camera...');
    
    try {
      this.characterController = characterController;
      this.activeCompetencesTracker = activeCompetencesTracker;
      
      this.camera = new THREE.PerspectiveCamera(
        GAME_CONFIG.FOV,
        GAME_CONFIG.RENDER_WIDTH / GAME_CONFIG.RENDER_HEIGHT,
        GAME_CONFIG.NEAR,
        GAME_CONFIG.FAR
      );

      // Set initial camera position from character controller
      const initialPos = characterController.getPosition();
      this.camera.position.set(initialPos.x, initialPos.y, initialPos.z);
      this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
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
      if (!this.controlsEnabled) return;
      
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
        case 'Space':
          // Jump - mark SAUT as active
          this.characterController.jump();
          if (this.activeCompetencesTracker) {
            this.activeCompetencesTracker.markActive(Competence.SAUT);
          }
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
      if (!this.controlsEnabled) return;
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
      if (!this.controlsEnabled) return;
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
    if (!this.controlsEnabled) {
      // Clear all movement when controls are disabled
      this.controls.moveForward = false;
      this.controls.moveBackward = false;
      this.controls.moveLeft = false;
      this.controls.moveRight = false;
      this.controls.run = false;
      return;
    }
    
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
    const moveDirection = this.direction.clone();
    moveDirection.applyQuaternion(this.camera.quaternion);
    moveDirection.y = 0; // Keep movement on horizontal plane
    moveDirection.normalize();

    // Mark PAS as active when moving (walking/running)
    if (this.direction.length() > 0 && this.activeCompetencesTracker) {
      this.activeCompetencesTracker.markActive(Competence.PAS);
    }

    // Move character controller (pass run state)
    this.characterController.move(moveDirection, deltaTime, this.controls.run);

    // Sync camera position with character controller position
    const controllerPos = this.characterController.getPosition();
    this.camera.position.set(controllerPos.x, controllerPos.y, controllerPos.z);
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
   * Disable all controls (for UI overlays like console)
   */
  disableControls(): void {
    this.controlsEnabled = false;
    // Clear all active controls
    this.controls.moveForward = false;
    this.controls.moveBackward = false;
    this.controls.moveLeft = false;
    this.controls.moveRight = false;
    this.controls.run = false;
    // Exit pointer lock to free mouse cursor
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    Debug.log('FPSCamera', 'Controls disabled');
  }

  /**
   * Enable all controls
   */
  enableControls(): void {
    this.controlsEnabled = true;
    Debug.log('FPSCamera', 'Controls enabled');
  }

  /**
   * Check if controls are enabled
   */
  areControlsEnabled(): boolean {
    return this.controlsEnabled;
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



