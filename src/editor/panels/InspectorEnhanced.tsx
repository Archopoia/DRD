'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Entity } from '@/game/ecs/Entity';
import { EntityManager } from '@/game/ecs/EntityManager';
import { TransformComponent } from '@/game/ecs/components/TransformComponent';
import { MeshRendererComponent } from '@/game/ecs/components/MeshRendererComponent';
import { PhysicsComponent } from '@/game/ecs/components/PhysicsComponent';
import { LightComponent } from '@/game/ecs/components/LightComponent';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';

interface InspectorEnhancedProps {
  object: THREE.Object3D | null;
  entityManager?: EntityManager | null;
  manager?: CharacterSheetManager;
  onObjectChange?: (object: THREE.Object3D) => void;
}

/**
 * Enhanced Inspector Panel - Shows properties of selected object or entity
 * Supports both legacy Three.js objects and new ECS entities
 */
export default function InspectorEnhanced({ object, entityManager, manager, onObjectChange }: InspectorEnhancedProps) {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [isEntity, setIsEntity] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if object is an entity or legacy object
  useEffect(() => {
    if (!object || !entityManager) {
      setEntity(null);
      setIsEntity(false);
      return;
    }

    const entityId = object.userData?.entityId;
    if (entityId) {
      const foundEntity = entityManager.getEntity(entityId);
      setEntity(foundEntity);
      setIsEntity(!!foundEntity);
    } else {
      setEntity(null);
      setIsEntity(false);
    }
  }, [object, entityManager]);

  // Transform properties (shared by both legacy and entity)
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [visible, setVisible] = useState(true);
  const [name, setName] = useState('');

  // Entity-specific component properties
  const [meshColor, setMeshColor] = useState(0x808080);
  const [physicsType, setPhysicsType] = useState<'static' | 'dynamic' | 'kinematic' | 'none'>('none');
  const [mass, setMass] = useState(1.0);
  const [lightType, setLightType] = useState<'point' | 'directional' | 'spot' | 'ambient'>('point');
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [lightColor, setLightColor] = useState(0xffffff);

  // Update state when object/entity changes
  useEffect(() => {
    if (!object) {
      setName('');
      setPosition({ x: 0, y: 0, z: 0 });
      setRotation({ x: 0, y: 0, z: 0 });
      setScale({ x: 1, y: 1, z: 1 });
      setVisible(true);
      return;
    }

    setName(object.name || '');

    if (isEntity && entity && entityManager) {
      // Load from entity components
      const transform = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
      if (transform) {
        const pos = transform.getPosition();
        const rot = transform.getRotation();
        const scl = transform.getScale();
        setPosition(pos);
        setRotation(rot);
        setScale(scl);
        setVisible(true); // TODO: Add visibility to transform component
      }

      const meshRenderer = entityManager.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
      if (meshRenderer) {
        setMeshColor(meshRenderer.materialColor);
        setVisible(meshRenderer.visible);
      }

      const physics = entityManager.getComponent<PhysicsComponent>(entity, 'PhysicsComponent');
      if (physics) {
        setPhysicsType(physics.properties.bodyType);
        setMass(physics.properties.mass || 1.0);
      } else {
        setPhysicsType('none');
      }

      const light = entityManager.getComponent<LightComponent>(entity, 'LightComponent');
      if (light) {
        setLightType(light.properties.type);
        setLightIntensity(light.properties.intensity);
        setLightColor(light.properties.color);
      }
    } else {
      // Legacy object
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
    }
  }, [object, entity, isEntity, entityManager]);

  // Apply changes
  const applyChanges = () => {
    if (!object) return;

    if (isEntity && entity && entityManager) {
      // Update entity components
      const transform = entityManager.getComponent<TransformComponent>(entity, 'TransformComponent');
      if (transform) {
        entity.name = name || '(unnamed)';
        transform.setPosition(position);
        transform.setRotation(rotation);
        transform.setScale(scale);
      }

      const meshRenderer = entityManager.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent');
      if (meshRenderer) {
        meshRenderer.setColor(meshColor);
        meshRenderer.setVisible(visible);
      }

      const physics = entityManager.getComponent<PhysicsComponent>(entity, 'PhysicsComponent');
      if (physics && physicsType !== 'none') {
        // Physics type changes require recreating the component - complex operation
        // For now, just update mass
        if (physics.properties.mass !== undefined) {
          physics.properties.mass = mass;
        }
        physics.updateTransform(position);
      }

      const light = entityManager.getComponent<LightComponent>(entity, 'LightComponent');
      if (light) {
        light.setColor(lightColor);
        light.setIntensity(lightIntensity);
      }

      // Trigger update
      if (onObjectChange) {
        onObjectChange(object);
      }
    } else {
      // Legacy object
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
    }
  };

  const handlePropertyChange = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
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
        {['x', 'y', 'z'].map((axis) => (
          <div key={axis}>
            <label className="text-xs text-gray-500 block mb-0.5 uppercase">{axis}</label>
            <input
              type="number"
              step="0.01"
              value={values[axis as keyof typeof values]}
              onChange={(e) => {
                onChange({ ...values, [axis]: parseFloat(e.target.value) || 0 });
                handlePropertyChange();
              }}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}
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

  const transform = isEntity && entity && entityManager
    ? entityManager.getComponent<TransformComponent>(entity, 'TransformComponent')
    : null;
  const meshRenderer = isEntity && entity && entityManager
    ? entityManager.getComponent<MeshRendererComponent>(entity, 'MeshRendererComponent')
    : null;
  const physics = isEntity && entity && entityManager
    ? entityManager.getComponent<PhysicsComponent>(entity, 'PhysicsComponent')
    : null;
  const light = isEntity && entity && entityManager
    ? entityManager.getComponent<LightComponent>(entity, 'LightComponent')
    : null;

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4">
      <div className="space-y-3">
        {/* Entity Badge */}
        {isEntity && (
          <div className="mb-2 px-2 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs font-mono text-blue-300">
            Entity: {entity?.id.substring(0, 8)}...
          </div>
        )}

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

        {/* Mesh Renderer Component */}
        {meshRenderer && (
          <div className="mb-3 border-b border-gray-700 pb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Mesh Renderer</div>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-0.5">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={`#${meshColor.toString(16).padStart(6, '0')}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace('#', '0x');
                    setMeshColor(parseInt(hex));
                    handlePropertyChange();
                  }}
                  className="w-16 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={`#${meshColor.toString(16).padStart(6, '0')}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace('#', '0x');
                    if (!isNaN(parseInt(hex))) {
                      setMeshColor(parseInt(hex));
                      handlePropertyChange();
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
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
        )}

        {/* Physics Component */}
        {physics && (
          <div className="mb-3 border-b border-gray-700 pb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Physics</div>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-0.5">Body Type</label>
              <select
                value={physicsType}
                onChange={(e) => {
                  setPhysicsType(e.target.value as any);
                  // Note: Changing body type requires recreating component - complex operation
                  handlePropertyChange();
                }}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="static">Static</option>
                <option value="dynamic">Dynamic</option>
                <option value="kinematic">Kinematic</option>
              </select>
            </div>
            {physicsType === 'dynamic' && (
              <div className="mb-2">
                <label className="text-xs text-gray-500 block mb-0.5">Mass</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={mass}
                  onChange={(e) => {
                    setMass(parseFloat(e.target.value) || 1.0);
                    handlePropertyChange();
                  }}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Light Component */}
        {light && (
          <div className="mb-3 border-b border-gray-700 pb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Light</div>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-0.5">Type</label>
              <select
                value={lightType}
                onChange={(e) => {
                  setLightType(e.target.value as any);
                  handlePropertyChange();
                }}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="ambient">Ambient</option>
                <option value="directional">Directional</option>
                <option value="point">Point</option>
                <option value="spot">Spot</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-0.5">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={`#${lightColor.toString(16).padStart(6, '0')}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace('#', '0x');
                    setLightColor(parseInt(hex));
                    handlePropertyChange();
                  }}
                  className="w-16 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={`#${lightColor.toString(16).padStart(6, '0')}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace('#', '0x');
                    if (!isNaN(parseInt(hex))) {
                      setLightColor(parseInt(hex));
                      handlePropertyChange();
                    }
                  }}
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-0.5">Intensity</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={lightIntensity}
                onChange={(e) => {
                  setLightIntensity(parseFloat(e.target.value) || 0);
                  handlePropertyChange();
                }}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Legacy Object Info */}
        {!isEntity && (
          <div className="mb-3 border-b border-gray-700 pb-3">
            <div className="text-xs font-mono font-semibold text-gray-400 mb-2">Info</div>
            <div className="mb-1">
              <span className="text-xs text-gray-500 font-mono">Type:</span>{' '}
              <span className="text-xs text-gray-300 font-mono">{object.constructor.name}</span>
            </div>
            <div className="mb-1">
              <span className="text-xs text-gray-500 font-mono">UUID:</span>{' '}
              <span className="text-xs text-gray-300 font-mono">{object.uuid.substring(0, 8)}...</span>
            </div>
          </div>
        )}

        {/* Visibility (for legacy objects) */}
        {!isEntity && (
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
        )}
      </div>
    </div>
  );
}

