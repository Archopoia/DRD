import * as THREE from 'three';
import { RetroShader } from './RetroShader';
import { GAME_CONFIG } from '@/lib/constants';
import { Debug } from '../utils/debug';

/**
 * Retro-style renderer setup for Daggerfall-like visuals
 */
export class RetroRenderer {
  public renderer: THREE.WebGLRenderer;
  private composer: THREE.EffectComposer | null = null;
  private shaderPass: THREE.ShaderPass | null = null;

  constructor(canvas: HTMLCanvasElement) {
    Debug.startMeasure('RetroRenderer.constructor');
    
    try {
      if (!canvas) {
        throw new Error('Canvas element is required');
      }

      Debug.log('RetroRenderer', 'Creating WebGL renderer...');
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false, // Retro games don't use antialiasing
        powerPreference: 'high-performance',
      });

      if (!this.renderer) {
        throw new Error('Failed to create WebGL renderer');
      }

      Debug.log('RetroRenderer', `Setting size to ${GAME_CONFIG.RENDER_WIDTH}x${GAME_CONFIG.RENDER_HEIGHT}`);
      this.renderer.setSize(GAME_CONFIG.RENDER_WIDTH, GAME_CONFIG.RENDER_HEIGHT);
      this.renderer.setPixelRatio(GAME_CONFIG.PIXEL_RATIO);
      
      // Note: Texture filtering is set per-material for retro look
      
      // Enable shadow maps if needed later
      this.renderer.shadowMap.enabled = false;
      
      // Set clear color to dark gray (typical dungeon color)
      this.renderer.setClearColor(0x1a1a1a);

      Debug.log('RetroRenderer', 'Renderer created successfully');
      
      try {
        const gl = this.renderer.getContext();
        if (gl) {
          const version = gl.getParameter(gl.VERSION);
          Debug.log('RetroRenderer', `WebGL version: ${version}`);
        }
      } catch (err) {
        Debug.warn('RetroRenderer', 'Could not get WebGL version info');
      }
      
      Debug.endMeasure('RetroRenderer.constructor');
    } catch (error) {
      Debug.error('RetroRenderer', 'Failed to create renderer', error as Error);
      throw error;
    }
  }

  /**
   * Setup retro shader post-processing
   * Note: This requires THREE.EffectComposer which is in three/examples/jsm
   * For minimal setup, we'll apply shader directly to materials instead
   */
  setupRetroShader(): void {
    // For now, we'll apply retro shader directly to materials
    // Full post-processing can be added later with EffectComposer
  }

  /**
   * Create a retro-style material with custom shader
   */
  createRetroMaterial(texture?: THREE.Texture): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...RetroShader.uniforms,
        tDiffuse: { value: texture || null },
        colorBits: { value: GAME_CONFIG.COLOR_BITS },
        ditherEnabled: { value: GAME_CONFIG.DITHER_ENABLED },
        resolution: { value: new THREE.Vector2(GAME_CONFIG.RENDER_WIDTH, GAME_CONFIG.RENDER_HEIGHT) },
      },
      vertexShader: RetroShader.vertexShader,
      fragmentShader: RetroShader.fragmentShader,
    });

    if (texture) {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
    }

    return material;
  }

  /**
   * Create a standard material with retro texture filtering
   */
  createRetroStandardMaterial(color: number = 0x808080): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color });
    return material;
  }

  /**
   * Resize renderer
   */
  resize(width: number, height: number): void {
    try {
      if (width <= 0 || height <= 0) {
        Debug.warn('RetroRenderer', `Invalid resize dimensions: ${width}x${height}`);
        return;
      }
      
      this.renderer.setSize(width, height);
      if (this.shaderPass) {
        RetroShader.uniforms.resolution.value.set(width, height);
      }
      Debug.log('RetroRenderer', `Resized to ${width}x${height}`);
    } catch (error) {
      Debug.error('RetroRenderer', 'Error resizing renderer', error as Error);
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
  }
}

