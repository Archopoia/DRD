/**
 * Material Definition - JSON format for material definitions
 */

export interface MaterialTexture {
  diffuse?: string;
  normal?: string;
  roughness?: string;
  metalness?: string;
  emissive?: string;
  ao?: string; // Ambient occlusion
}

export interface MaterialTiling {
  x: number;
  y: number;
}

export interface MaterialDefinition {
  id: string;
  name: string;
  diffuse: string; // Hex color or texture path
  emissive?: string; // Hex color
  roughness?: number; // 0.0 - 1.0
  metalness?: number; // 0.0 - 1.0
  tiling?: MaterialTiling;
  textures?: MaterialTexture;
}
