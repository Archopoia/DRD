import * as THREE from 'three';

/**
 * Custom retro shader for Daggerfall-like visual style
 * Includes color quantization and optional dithering
 */
export const RetroShader = {
  uniforms: {
    tDiffuse: { value: null },
    colorBits: { value: 4 },
    ditherEnabled: { value: true },
    resolution: { value: new THREE.Vector2(1280, 720) },
  },

  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float colorBits;
    uniform bool ditherEnabled;
    uniform vec2 resolution;
    varying vec2 vUv;
    
    // Dithering matrix
    float ditherMatrix[16] = float[](
      0.0,  8.0,  2.0,  10.0,
      12.0, 4.0,  14.0, 6.0,
      3.0,  11.0, 1.0,  9.0,
      15.0, 7.0,  13.0, 5.0
    );
    
    float getDitherValue(vec2 coord) {
      int x = int(mod(coord.x, 4.0));
      int y = int(mod(coord.y, 4.0));
      int index = x + y * 4;
      return ditherMatrix[index] / 16.0;
    }
    
    vec3 quantizeColor(vec3 color, float bits) {
      float levels = pow(2.0, bits);
      return floor(color * levels) / levels;
    }
    
    void main() {
      vec4 texColor = texture2D(tDiffuse, vUv);
      vec3 color = texColor.rgb;
      
      // Apply dithering if enabled
      if (ditherEnabled) {
        vec2 screenCoord = gl_FragCoord.xy;
        float dither = getDitherValue(screenCoord) - 0.5;
        color += dither * (1.0 / pow(2.0, colorBits));
      }
      
      // Quantize colors
      color = quantizeColor(color, colorBits);
      
      gl_FragColor = vec4(color, texColor.a);
    }
  `,
};



