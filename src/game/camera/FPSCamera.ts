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
  private shiftPressed: boolean = false; // Track shift state for dodge combo
  private mouseState: MouseState = {
    deltaX: 0,
    deltaY: 0,
    locked: false,
  };
  private euler: THREE.Euler;
  private direction: THREE.Vector3;
  private controlsEnabled: boolean = true;
  
  // Aiming/zooming state (VISEE)
  private isAiming: boolean = false;
  private defaultFOV: number = GAME_CONFIG.FOV;
  

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
          this.shiftPressed = true;
          break;
        case 'Space':
          // Check for dodge combo (Shift + Space = dodge in WASD direction)
          if (this.shiftPressed) {
            // Dodge in movement direction (WASD)
            const dodgeDirection = new THREE.Vector3();
            if (this.controls.moveForward) dodgeDirection.z -= 1;
            if (this.controls.moveBackward) dodgeDirection.z += 1;
            if (this.controls.moveLeft) dodgeDirection.x -= 1;
            if (this.controls.moveRight) dodgeDirection.x += 1;
            
            // If no movement direction, dodge forward (relative to camera)
            if (dodgeDirection.length() < 0.01) {
              dodgeDirection.z -= 1;
            }
            
            // Apply camera rotation to dodge direction
            dodgeDirection.applyQuaternion(this.camera.quaternion);
            dodgeDirection.y = 0; // Keep horizontal
            dodgeDirection.normalize();
            
            // Trigger dodge (ESQUIVE is marked inside CharacterController.dodge())
            this.characterController.dodge(dodgeDirection);
          } else {
            // Normal jump - mark SAUT as active
            this.characterController.jump();
            if (this.activeCompetencesTracker) {
              this.activeCompetencesTracker.markActive(Competence.SAUT);
            }
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
          this.shiftPressed = false;
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
    
    // Mouse button events for aiming (right-click to zoom - VISEE)
    const onMouseDown = (event: MouseEvent): void => {
      if (!this.controlsEnabled) return;
      
      // Right-click (button 2) for aiming/zooming
      if (event.button === 2) {
        event.preventDefault(); // Prevent context menu
        this.isAiming = true;
        this.camera.fov = GAME_CONFIG.AIM_FOV;
        this.camera.updateProjectionMatrix();
        
        // Mark VISEE as active
        if (this.activeCompetencesTracker) {
          this.activeCompetencesTracker.markActive(Competence.VISEE);
        }
        
        Debug.log('FPSCamera', 'Started aiming (zoomed in)');
      }
    };
    
    const onMouseUp = (event: MouseEvent): void => {
      if (!this.controlsEnabled) return;
      
      // Right-click release (button 2) to stop aiming
      if (event.button === 2) {
        this.isAiming = false;
        this.camera.fov = this.defaultFOV;
        this.camera.updateProjectionMatrix();
        Debug.log('FPSCamera', 'Stopped aiming (zoomed out)');
      }
    };
    
    // Prevent context menu on right-click
    const onContextMenu = (event: MouseEvent): void => {
      if (!this.controlsEnabled) return;
      event.preventDefault();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    // Store cleanup function
    this.cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }

  private cleanup?: () => void;

  /**
   * Update camera rotation based on mouse movement
   */
  updateRotation(deltaTime: number = 0.016): void {
    if (!this.mouseState.locked) return;

    const sensitivity = GAME_CONFIG.MOUSE_SENSITIVITY;
    this.euler.setFromQuaternion(this.camera.quaternion);

    // Mark VISION as active when looking around (camera rotation)
    if ((this.mouseState.deltaX !== 0 || this.mouseState.deltaY !== 0) && this.activeCompetencesTracker) {
      this.activeCompetencesTracker.markActive(Competence.VISION);
      
      // Mark FLUIDITE as active for swift camera movements (max speed rotation)
      // Calculate rotation speed magnitude
      const rotationMagnitude = Math.sqrt(
        (this.mouseState.deltaX * this.mouseState.deltaX) + 
        (this.mouseState.deltaY * this.mouseState.deltaY)
      );
      
      // Convert to speed (pixels per frame), threshold: > 10 pixels per frame = swift movement
      // This corresponds to fast camera sweeps
      if (rotationMagnitude > 10 && deltaTime > 0 && this.activeCompetencesTracker) {
        this.activeCompetencesTracker.markActive(Competence.FLUIDITE);
      }
    }
    
    // Mark VISEE as active while aiming (zoomed in)
    if (this.isAiming && this.activeCompetencesTracker) {
      this.activeCompetencesTracker.markActive(Competence.VISEE);
    }

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

    // Mark movement-related CTs as active when moving
    if (this.direction.length() > 0 && this.activeCompetencesTracker) {
      // PAS - Walking/running (basic movement)
      this.activeCompetencesTracker.markActive(Competence.PAS);
      
      // EQUILIBRE - Balance (only when moving AND not grounded)
      const isGrounded = this.characterController.isGroundedCheck();
      if (!isGrounded) {
        this.activeCompetencesTracker.markActive(Competence.EQUILIBRE);
      }
      
      // FLUIDITE - Movement fluidity: only when swift camera movements OR 3+ movement actions at once
      // Count active movement inputs: direction keys (WASD)
      const movementKeysCount = 
        (this.controls.moveForward ? 1 : 0) +
        (this.controls.moveBackward ? 1 : 0) +
        (this.controls.moveLeft ? 1 : 0) +
        (this.controls.moveRight ? 1 : 0);
      
      // Check if 3+ movement actions are active simultaneously:
      // - 3+ direction keys (WASD combinations like W+A+D or S+W+D)
      // - OR 2 direction keys + running (W+A+Shift or similar)
      // - OR 2 direction keys + jumping (W+A+Space - jumping while moving in multiple directions)
      const hasMultipleActions = movementKeysCount >= 3 || // 3+ direction keys at once
                                 (movementKeysCount >= 2 && this.controls.run) || // 2 directions + running
                                 (movementKeysCount >= 2 && !isGrounded); // 2 directions + jumping (airborne)
      
      // FLUIDITE is also marked during swift camera movements in updateRotation()
      // This handles the movement-based FLUIDITE activation
      if (hasMultipleActions && this.activeCompetencesTracker) {
        this.activeCompetencesTracker.markActive(Competence.FLUIDITE);
      }
    }

    // Determine if we want to climb (if moving forward while in front of climbable surface)
    // Climbing is attempted when moving forward - CharacterController will check if surface is climbable
    const wantsToClimb = this.controls.moveForward;
    
    // Move character controller (pass run state and climb intent)
    this.characterController.move(moveDirection, deltaTime, this.controls.run, wantsToClimb);

    // Sync camera position with character controller position
    const controllerPos = this.characterController.getPosition();
    this.camera.position.set(controllerPos.x, controllerPos.y, controllerPos.z);
  }

  /**
   * Update camera (call each frame)
   */
  update(deltaTime: number): void {
    this.updateRotation(deltaTime);
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



