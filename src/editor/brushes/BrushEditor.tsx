'use client';

import { useState } from 'react';
import * as THREE from 'three';
import { BrushTool, BrushShape } from './BrushTool';
import { EntityManager } from '@/game/ecs/EntityManager';
import { RetroRenderer } from '@/game/renderer/RetroRenderer';
import { PhysicsWorld } from '@/game/physics/PhysicsWorld';

interface BrushEditorProps {
  entityManager?: EntityManager | null;
  renderer?: RetroRenderer | null;
  physicsWorld?: PhysicsWorld | null;
  onBrushCreated?: (entity: any) => void;
}

/**
 * Brush Editor Panel - Create and edit brushes for level geometry
 * Similar to Doom Builder / Hammer Editor brush creation
 */
export default function BrushEditor({ entityManager, renderer, physicsWorld, onBrushCreated }: BrushEditorProps) {
  const [brushShape, setBrushShape] = useState<BrushShape>('box');
  const [brushSize, setBrushSize] = useState({ x: 2, y: 2, z: 2 });
  const [brushPosition, setBrushPosition] = useState({ x: 0, y: 1, z: 0 });

  const handleCreateBrush = () => {
    if (!entityManager || !renderer || !physicsWorld) {
      alert('Brush tool requires EntityManager, Renderer, and PhysicsWorld');
      return;
    }

    const brushTool = new BrushTool(entityManager, renderer, physicsWorld);
    const brush = brushTool.createBrush({
      shape: brushShape,
      size: brushSize,
      position: brushPosition,
    });

    if (onBrushCreated) {
      onBrushCreated(brush);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-4">
        <div className="text-xs font-mono font-semibold text-gray-400 mb-2">
          Create Brush
        </div>
        <div className="text-xs text-gray-500 mb-3">
          Brushes are the building blocks for level geometry. Create custom shapes to build your level.
        </div>

        {/* Brush Shape */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Shape</label>
          <div className="grid grid-cols-3 gap-2">
            {(['box', 'cylinder', 'sphere'] as BrushShape[]).map((shape) => (
              <button
                key={shape}
                onClick={() => setBrushShape(shape)}
                className={`px-2 py-1.5 text-xs font-mono rounded border transition-colors ${
                  brushShape === shape
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Size</label>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="text-xs text-gray-400 block mb-0.5 uppercase">{axis}</label>
                <input
                  type="number"
                  step="0.1"
                  value={brushSize[axis]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    setBrushSize({ ...brushSize, [axis]: val });
                  }}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Brush Position */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis}>
                <label className="text-xs text-gray-400 block mb-0.5 uppercase">{axis}</label>
                <input
                  type="number"
                  step="0.1"
                  value={brushPosition[axis]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setBrushPosition({ ...brushPosition, [axis]: val });
                  }}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateBrush}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono rounded transition-colors"
        >
          Create Brush
        </button>
      </div>

      {/* Brush Info */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
        <div className="text-xs font-mono font-semibold text-gray-400 mb-2">
          Brush Editing Guide
        </div>
        <div className="text-xs font-mono text-gray-500 space-y-1">
          <div>• Brushes create level geometry</div>
          <div>• Use different shapes to build your level</div>
          <div>• Brushes are static physics objects</div>
          <div>• Edit brush properties in Inspector</div>
          <div>• Vertex editing coming soon</div>
        </div>
      </div>
    </div>
  );
}
