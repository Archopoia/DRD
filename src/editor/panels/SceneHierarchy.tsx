'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SceneHierarchyProps {
  scene: THREE.Scene | null;
  selectedObject: THREE.Object3D | null;
  selectedObjects?: Set<THREE.Object3D>;
  onSelectObject: (object: THREE.Object3D | null, multiSelect?: boolean) => void;
  onDeleteObject?: (object: THREE.Object3D) => void;
  onDuplicateObject?: (object: THREE.Object3D) => void;
}

interface TreeNode {
  object: THREE.Object3D;
  children: TreeNode[];
  expanded: boolean;
}

/**
 * Scene Hierarchy Panel - Shows the Three.js scene graph as a tree
 */
export default function SceneHierarchy({ scene, selectedObject, selectedObjects, onSelectObject, onDeleteObject, onDuplicateObject }: SceneHierarchyProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedObjects, setExpandedObjects] = useState<Set<THREE.Object3D>>(new Set());

  // Build tree structure from scene
  useEffect(() => {
    if (!scene) {
      setTree([]);
      return;
    }

    const buildTree = (object: THREE.Object3D): TreeNode => {
      const node: TreeNode = {
        object,
        children: [],
        expanded: expandedObjects.has(object),
      };

      object.children.forEach(child => {
        node.children.push(buildTree(child));
      });

      return node;
    };

    const sceneTree: TreeNode[] = [];
    scene.children.forEach(child => {
      sceneTree.push(buildTree(child));
    });

    setTree(sceneTree);
  }, [scene, expandedObjects]);

  const toggleExpand = (object: THREE.Object3D) => {
    setExpandedObjects(prev => {
      const next = new Set(prev);
      if (next.has(object)) {
        next.delete(object);
      } else {
        next.add(object);
      }
      return next;
    });
  };

  const getObjectName = (object: THREE.Object3D): string => {
    if (object.name) return object.name;
    if (object instanceof THREE.Mesh) return `Mesh (${object.geometry.type})`;
    if (object instanceof THREE.Light) return `Light (${object.type})`;
    if (object instanceof THREE.Camera) return `Camera (${object.type})`;
    return object.constructor.name;
  };

  const getObjectIcon = (object: THREE.Object3D): string => {
    if (object instanceof THREE.Mesh) return '📦';
    if (object instanceof THREE.Light) return '💡';
    if (object instanceof THREE.Camera) return '📷';
    if (object instanceof THREE.Group) return '📁';
    if (object instanceof THREE.Scene) return '🌍';
    return '📄';
  };

  const handleDelete = (object: THREE.Object3D, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteObject && object.parent) {
      // Don't allow deleting scene root or camera/light critical objects
      if (object instanceof THREE.Camera || (object instanceof THREE.Light && scene?.children.includes(object))) {
        return;
      }
      onDeleteObject(object);
    }
  };

  const handleDuplicate = (object: THREE.Object3D, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicateObject) {
      onDuplicateObject(object);
    }
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0, selectedObjects?: Set<THREE.Object3D>): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded;
    const isSelected = selectedObject === node.object;
    const isMultiSelected = selectedObjects?.has(node.object) || false;

    return (
      <div key={node.object.uuid}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-700 group ${
            isSelected ? 'bg-blue-900 text-white' : 
            isMultiSelected ? 'bg-blue-800/50 text-blue-200' :
            'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => {
            const multiSelect = e.ctrlKey || e.metaKey;
            onSelectObject(node.object, multiSelect);
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.object);
              }}
              className="w-4 h-4 mr-1 text-gray-400 hover:text-white flex items-center justify-center"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <span className="w-4 h-4 mr-1" />
          )}
          <span className="mr-2">{getObjectIcon(node.object)}</span>
          <span className="text-xs font-mono flex-1 truncate">{getObjectName(node.object)}</span>
          {node.object instanceof THREE.Mesh && (
            <span className="text-xs text-gray-500 ml-2">
              {node.object.geometry.type}
            </span>
          )}
          {/* Action buttons on hover */}
          {(onDeleteObject || onDuplicateObject) && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2">
              {onDuplicateObject && (
                <button
                  onClick={(e) => handleDuplicate(node.object, e)}
                  className="text-gray-400 hover:text-blue-400 text-xs px-1"
                  title="Duplicate"
                >
                  📋
                </button>
              )}
              {onDeleteObject && node.object.parent && !(node.object instanceof THREE.Camera) && (
                <button
                  onClick={(e) => handleDelete(node.object, e)}
                  className="text-gray-400 hover:text-red-400 text-xs px-1"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1, selectedObjects))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-gray-800">
      <div className="p-2">
        {tree.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono py-4 text-center">
            {scene ? 'No objects in scene' : 'Scene not available'}
          </div>
        ) : (
          tree.map(node => renderTreeNode(node, 0, selectedObjects))
        )}
      </div>
    </div>
  );
}

