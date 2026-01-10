'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';

interface InspectorProps {
  object: THREE.Object3D | null;
  manager?: CharacterSheetManager;
  onObjectChange?: (object: THREE.Object3D) => void; // Callback when object is modified
}

/**
 * Inspector Panel - Shows and edits properties of selected object in real-time
 */
export default function Inspector({ object, manager, onObjectChange }: InspectorProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [visible, setVisible] = useState(true);
  const [additionalProps, setAdditionalProps] = useState<Record<string, any>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state when object changes
  useEffect(() => {
    if (!object) {
      setName('');
      setPosition({ x: 0, y: 0, z: 0 });
      setRotation({ x: 0, y: 0, z: 0 });
      setScale({ x: 1, y: 1, z: 1 });
      setVisible(true);
      setAdditionalProps({});
      return;
    }

    setName(object.name || '');
    setPosition({ 
      x: parseFloat(object.position.x.toFixed(3)), 
      y: parseFloat(object.position.y.toFixed(3)), 
      z: parseFloat(object.position.z.toFixed(3))
    });
    setRotation({ 
      x: parseFloat((object.rotation.x * 180 / Math.PI).toFixed(2)), 
      y: parseFloat((object.rotation.y * 180 / Math.PI).toFixed(2)), 
      z: parseFloat((object.rotation.z * 180 / Math.PI).toFixed(2))
    });
    setScale({ 
      x: parseFloat(object.scale.x.toFixed(3)), 
      y: parseFloat(object.scale.y.toFixed(3)), 
      z: parseFloat(object.scale.z.toFixed(3))
    });
    setVisible(object.visible);

    // Additional read-only properties
    const props: Record<string, any> = {
      'Type': object.constructor.name,
      'UUID': object.uuid,
      'Children': object.children.length,
    };

    // Mesh-specific properties
    if (object instanceof THREE.Mesh) {
      props['Geometry'] = object.geometry.type;
      props['Material'] = object.material ? (Array.isArray(object.material) ? `${object.material.length} materials` : object.material.type) : 'none';
      if (object.geometry instanceof THREE.BufferGeometry) {
        props['Vertices'] = object.geometry.attributes.position?.count || 0;
      }
    }

    // Light-specific properties
    if (object instanceof THREE.Light) {
      props['Color'] = `#${object.color.getHexString()}`;
      props['Intensity'] = object.intensity.toFixed(2);
    }

    // Camera-specific properties
    if (object instanceof THREE.Camera) {
      if (object instanceof THREE.PerspectiveCamera) {
        props['FOV'] = object.fov + '°';
        props['Near'] = object.near;
        props['Far'] = object.far;
      }
    }

    setAdditionalProps(props);
  }, [object]);

  // Apply changes to object with debounce
  const applyChanges = () => {
    if (!object) return;

    object.name = name || '(unnamed)';
    object.position.set(position.x, position.y, position.z);
    object.rotation.set(
      rotation.x * Math.PI / 180,
      rotation.y * Math.PI / 180,
      rotation.z * Math.PI / 180
    );
    object.scale.set(scale.x, scale.y, scale.z);
    object.visible = visible;

    if (onObjectChange) {
      onObjectChange(object);
    }
  };

  const handlePropertyChange = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates to avoid too many re-renders
    updateTimeoutRef.current = setTimeout(() => {
      applyChanges();
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const renderVectorInput = (
    label: string,
    values: { x: number; y: number; z: number },
    onChange: (values: { x: number; y: number; z: number }) => void
  ) => (
    <div className="mb-3 border-b border-gray-700 pb-3">
      <div className="text-xs font-mono font-semibold text-gray-400 mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">X</label>
          <input
            type="number"
            step="0.01"
            value={values.x}
            onChange={(e) => {
              onChange({ ...values, x: parseFloat(e.target.value) || 0 });
              handlePropertyChange();
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">Y</label>
          <input
            type="number"
            step="0.01"
            value={values.y}
            onChange={(e) => {
              onChange({ ...values, y: parseFloat(e.target.value) || 0 });
              handlePropertyChange();
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">Z</label>
          <input
            type="number"
            step="0.01"
            value={values.z}
            onChange={(e) => {
              onChange({ ...values, z: parseFloat(e.target.value) || 0 });
              handlePropertyChange();
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  if (!object) {
    return (
      <div className="p-4">
        <div className="text-gray-500 text-xs font-mono text-center py-8">
          No object selected
          <br />
          <span className="text-gray-600 mt-2 block">
            Select an object from the Hierarchy to view and edit its properties
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4">
      <div className="space-y-3">
        {/* Name */}
        <div className="mb-3 border-b border-gray-700 pb-3">
          <label className="text-xs font-mono font-semibold text-gray-400 block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handlePropertyChange();
            }}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            placeholder="Object name"
          />
        </div>

        {/* Transform */}
        <div className="mb-3 border-b border-gray-700 pb-3">
          <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Transform</div>
          {renderVectorInput('Position', position, (v) => {
            setPosition(v);
            handlePropertyChange();
          })}
          {renderVectorInput('Rotation (deg)', rotation, (v) => {
            setRotation(v);
            handlePropertyChange();
          })}
          {renderVectorInput('Scale', scale, (v) => {
            setScale(v);
            handlePropertyChange();
          })}
        </div>

        {/* Visibility */}
        <div className="mb-3 border-b border-gray-700 pb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => {
                setVisible(e.target.checked);
                handlePropertyChange();
              }}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-xs font-mono text-gray-300">Visible</span>
          </label>
        </div>

        {/* Additional Read-only Properties */}
        {Object.keys(additionalProps).length > 0 && (
          <div className="mb-3 border-b border-gray-700 pb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Info</div>
            {Object.entries(additionalProps).map(([key, value]) => (
              <div key={key} className="mb-1">
                <span className="text-xs text-gray-500 font-mono">{key}:</span>{' '}
                <span className="text-xs text-gray-300 font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* User Data */}
        {object.userData && Object.keys(object.userData).length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">User Data</div>
            <div className="bg-gray-900 rounded p-2">
              {Object.entries(object.userData).map(([key, value]) => (
                <div key={key} className="mb-1 text-xs font-mono">
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

