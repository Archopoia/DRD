// Game constants
export const GAME_CONFIG = {
  // Renderer settings
  RENDER_WIDTH: 1280,
  RENDER_HEIGHT: 720,
  get PIXEL_RATIO() {
    if (typeof window === 'undefined') return 1;
    return Math.min(window.devicePixelRatio || 1, 2);
  },
  
  // Camera settings
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  MOUSE_SENSITIVITY: 0.002,
  
  // Movement settings
  MOVE_SPEED: 5.0,
  RUN_MULTIPLIER: 2.0,
  
  // Retro shader settings
  COLOR_BITS: 4, // Color quantization bits
  DITHER_ENABLED: true,
};

