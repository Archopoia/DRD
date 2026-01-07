// Type definitions for the game

export interface GameConfig {
  renderWidth: number;
  renderHeight: number;
  pixelRatio: number;
  fov: number;
  near: number;
  far: number;
}

export interface CameraControls {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  run: boolean;
}

export interface MouseState {
  deltaX: number;
  deltaY: number;
  locked: boolean;
}



