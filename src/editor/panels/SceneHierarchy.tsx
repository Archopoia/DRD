'use client';

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HistoryManager } from '../history/HistoryManager';
import { createReparentObjectAction } from '../history/actions/EditorActions';

interface SceneHierarchyProps {
  scene: THREE.Scene | null;
  selectedObject: THREE.Object3D | null;
  selectedObjects?: Set<THREE.Object3D>;
  onSelectObject: (object: THREE.Object3D | null, multiSelect?: boolean) => void;
  onDeleteObject?: (object: THREE.Object3D) => void;
  onDuplicateObject?: (object: THREE.Object3D) => void;
  historyManager?: HistoryManager | null;
}

interface TreeNode {
  object: THREE.Object3D;
  children: TreeNode[];
  expanded: boolean;
}

/**
 * Scene Hierarchy Panel - Shows the scene graph as a tree (Unity/Creation Engine style)
 * Enhanced for action-RPG development (Daggerfall/Morrowind style)
 */
export default function SceneHierarchy({ scene, selectedObject, selectedObjects, onSelectObject, onDeleteObject, onDuplicateObject, historyManager }: SceneHierarchyProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedObjects, setExpandedObjects] = useState<Set<THREE.Object3D>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; object: THREE.Object3D } | null>(null);
  const [renameObject, setRenameObject] = useState<THREE.Object3D | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedObject, setDraggedObject] = useState<THREE.Object3D | null>(null);
  const [dragOverObject, setDragOverObject] = useState<THREE.Object3D | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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
        // Filter out editor-specific objects (gizmos, etc.)
        if (!child.userData._isEditorObject) {
          node.children.push(buildTree(child));
        }
      });

      return node;
    };

    const sceneTree: TreeNode[] = [];
    scene.children.forEach(child => {
      if (!child.userData._isEditorObject) {
        sceneTree.push(buildTree(child));
      }
    });

    setTree(sceneTree);
  }, [scene, expandedObjects]);

  // Close context menu on click outside or left click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        const target = e.target as Node;
        // Close if clicking outside both the container and the context menu
        if (
          containerRef.current && !containerRef.current.contains(target) &&
          contextMenuRef.current && !contextMenuRef.current.contains(target)
        ) {
          setContextMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  // Also close context menu on left click anywhere
  useEffect(() => {
    const handleLeftClick = (e: MouseEvent) => {
      if (contextMenu && e.button === 0) {
        const target = e.target as Node;
        // Close if clicking outside the context menu
        if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
          setContextMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleLeftClick);
    return () => document.removeEventListener('mousedown', handleLeftClick);
  }, [contextMenu]);

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

  const expandAll = () => {
    const allObjects = new Set<THREE.Object3D>();
    const collectObjects = (node: TreeNode) => {
      allObjects.add(node.object);
      node.children.forEach(collectObjects);
    };
    tree.forEach(collectObjects);
    setExpandedObjects(allObjects);
  };

  const collapseAll = () => {
    setExpandedObjects(new Set());
  };

  const getObjectName = (object: THREE.Object3D): string => {
    if (object.name) return object.name;
    if (object instanceof THREE.Mesh) return `Mesh (${object.geometry.type})`;
    if (object instanceof THREE.Light) return `Light (${object.type})`;
    if (object instanceof THREE.Camera) return `Camera (${object.type})`;
    return object.constructor.name;
  };

  const getObjectIcon = (object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh) {
      // Check if it's an entity
      if (object.userData?.entityId) {
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
          </svg>
        );
      }
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      );
    }
    if (object instanceof THREE.Light) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
        </svg>
      );
    }
    if (object instanceof THREE.Group) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      );
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    );
  };

  const handleContextMenu = (object: THREE.Object3D, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, object });
  };

  const handleRename = (object: THREE.Object3D) => {
    setRenameObject(object);
    setRenameValue(object.name || getObjectName(object));
    setContextMenu(null);
  };

  const confirmRename = () => {
    if (renameObject && renameValue.trim()) {
      renameObject.name = renameValue.trim();
      setRenameObject(null);
      setRenameValue('');
    }
  };

  const cancelRename = () => {
    setRenameObject(null);
    setRenameValue('');
  };

  const handleDelete = (object: THREE.Object3D) => {
    if (onDeleteObject && object.parent) {
      if (object instanceof THREE.Camera || (object instanceof THREE.Light && scene?.children.includes(object))) {
        return;
      }
      onDeleteObject(object);
    }
    setContextMenu(null);
  };

  const handleDuplicate = (object: THREE.Object3D) => {
    if (onDuplicateObject) {
      onDuplicateObject(object);
    }
    setContextMenu(null);
  };

  const toggleVisibility = (object: THREE.Object3D, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    object.visible = !object.visible;
    if (contextMenu) {
      setContextMenu(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (object: THREE.Object3D, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', object.uuid);
    setDraggedObject(object);
  };

  const handleDragOver = (object: THREE.Object3D, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverObject(object);
  };

  const handleDragLeave = () => {
    setDragOverObject(null);
  };

  const handleDrop = (targetObject: THREE.Object3D, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedObject || !targetObject || !scene) {
      setDraggedObject(null);
      setDragOverObject(null);
      return;
    }

    // Don't allow dropping on itself or its children
    if (draggedObject === targetObject) {
      setDraggedObject(null);
      setDragOverObject(null);
      return;
    }

    // Check if target is a descendant of dragged object
    let isDescendant = false;
    targetObject.traverseAncestors((ancestor) => {
      if (ancestor === draggedObject) {
        isDescendant = true;
      }
    });
    if (isDescendant) {
      setDraggedObject(null);
      setDragOverObject(null);
      return;
    }

    // Store old parent and world transform before reparenting
    const oldParent = draggedObject.parent;
    const worldPosition = new THREE.Vector3();
    const worldRotation = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    draggedObject.getWorldPosition(worldPosition);
    draggedObject.getWorldQuaternion(worldRotation);
    draggedObject.getWorldScale(worldScale);

    // Remove from old parent
    if (draggedObject.parent) {
      draggedObject.parent.remove(draggedObject);
    }

    // Update target parent's world matrix first (ensure it's up to date)
    targetObject.updateMatrixWorld(true);

    // Add to new parent
    targetObject.add(draggedObject);

    // Restore world transform by computing local transform relative to new parent
    // Create world matrix from stored world transform
    const worldMatrix = new THREE.Matrix4();
    worldMatrix.compose(worldPosition, worldRotation, worldScale);
    
    // Get the new parent's world matrix inverse
    const parentMatrixInv = new THREE.Matrix4().copy(targetObject.matrixWorld).invert();
    
    // Compute local matrix = parentMatrixInv * worldMatrix
    const localMatrix = new THREE.Matrix4().multiplyMatrices(parentMatrixInv, worldMatrix);
    
    // Extract local position, rotation, scale
    const localPosition = new THREE.Vector3();
    const localRotation = new THREE.Quaternion();
    const localScale = new THREE.Vector3();
    localMatrix.decompose(localPosition, localRotation, localScale);
    
    // Apply local transform to maintain world position
    draggedObject.position.copy(localPosition);
    draggedObject.quaternion.copy(localRotation);
    draggedObject.scale.copy(localScale);
    draggedObject.updateMatrix();
    draggedObject.updateMatrixWorld(true);

    // Create history action for reparenting
    if (historyManager && oldParent !== targetObject) {
      const action = createReparentObjectAction(
        draggedObject,
        oldParent,
        targetObject,
        worldPosition,
        worldRotation,
        worldScale,
        `Reparent ${draggedObject.name || draggedObject.type}`
      );
      historyManager.addAction(action);
    }

    // Force tree rebuild by toggling expanded state (triggers useEffect)
    setExpandedObjects(prev => new Set(prev));

    setDraggedObject(null);
    setDragOverObject(null);
  };

  const handleDragEnd = () => {
    setDraggedObject(null);
    setDragOverObject(null);
  };

  // Filter tree based on search query
  const filterTree = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) return nodes;

    const filtered: TreeNode[] = [];
    nodes.forEach(node => {
      const name = getObjectName(node.object).toLowerCase();
      if (name.includes(query.toLowerCase())) {
        filtered.push(node);
      } else {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          filtered.push({ ...node, children: filteredChildren });
        }
      }
    });
    return filtered;
  };

  const filteredTree = filterTree(tree, searchQuery);
  const objectCount = tree.reduce((count, node) => {
    const countChildren = (n: TreeNode): number => 1 + n.children.reduce((sum, child) => sum + countChildren(child), 0);
    return count + countChildren(node);
  }, 0);

  const renderTreeNode = (node: TreeNode, depth: number = 0, selectedObjects?: Set<THREE.Object3D>): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = node.expanded;
    const isSelected = selectedObject === node.object;
    const isMultiSelected = selectedObjects?.has(node.object) || false;
    const isRenaming = renameObject === node.object;

    return (
      <div key={node.object.uuid}>
        <div
          className={`flex items-center py-0.5 px-1 cursor-pointer hover:bg-gray-700/50 group relative ${
            isSelected ? 'bg-blue-600/30 text-white border-l-2 border-blue-500' : 
            isMultiSelected ? 'bg-blue-700/20 text-blue-200' :
            'text-gray-300'
          } ${!node.object.visible ? 'opacity-50' : ''} ${
            dragOverObject === node.object ? 'bg-blue-900/50 border-l-2 border-blue-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          draggable
          onDragStart={(e) => handleDragStart(node.object, e)}
          onDragOver={(e) => handleDragOver(node.object, e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(node.object, e)}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            if (!isRenaming) {
              const multiSelect = e.ctrlKey || e.metaKey;
              onSelectObject(node.object, multiSelect);
            }
          }}
          onContextMenu={(e) => handleContextMenu(node.object, e)}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.object);
            }}
            className={`w-4 h-4 mr-1 flex items-center justify-center text-gray-500 hover:text-white ${!hasChildren ? 'invisible' : ''}`}
          >
            {isExpanded ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>

          {/* Icon */}
          <span className="mr-1.5 flex-shrink-0">{getObjectIcon(node.object)}</span>

          {/* Name (editable if renaming) */}
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={confirmRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                } else if (e.key === 'Escape') {
                  cancelRename();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 bg-gray-700 border border-blue-500 rounded px-1 py-0.5 text-xs font-mono text-white focus:outline-none"
            />
          ) : (
            <span className="text-xs font-mono flex-1 truncate">{getObjectName(node.object)}</span>
          )}

          {/* Visibility toggle button (eye icon) */}
          <button
            onClick={(e) => toggleVisibility(node.object, e)}
            className="mr-1 p-0.5 text-gray-500 hover:text-white flex-shrink-0"
            title={node.object.visible ? 'Hide' : 'Show'}
          >
            {node.object.visible ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>

          {/* Action buttons on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 ml-1">
            {onDuplicateObject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(node.object);
                }}
                className="text-gray-400 hover:text-blue-400 p-0.5"
                title="Duplicate (Ctrl+D)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            )}
            {onDeleteObject && node.object.parent && !(node.object instanceof THREE.Camera) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node.object);
                }}
                className="text-gray-400 hover:text-red-400 p-0.5"
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            )}
          </div>
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
    <div ref={containerRef} className="h-full flex flex-col bg-gray-800">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-700 p-1.5 flex items-center gap-1">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={expandAll}
          className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs font-mono"
          title="Expand All"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button
          onClick={collapseAll}
          className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs font-mono"
          title="Collapse All"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {objectCount > 0 && (
          <span className="text-xs text-gray-500 font-mono px-2" title={`${objectCount} objects`}>
            {objectCount}
          </span>
        )}
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1">
        {filteredTree.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono py-4 text-center">
            {searchQuery ? 'No objects found' : scene ? 'No objects in scene' : 'Scene not available'}
          </div>
        ) : (
          filteredTree.map(node => renderTreeNode(node, 0, selectedObjects))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[160px] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRename(contextMenu.object)}
            className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Rename
          </button>
          {onDuplicateObject && (
            <button
              onClick={() => handleDuplicate(contextMenu.object)}
              className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Duplicate
            </button>
          )}
          <button
            onClick={() => toggleVisibility(contextMenu.object)}
            className="w-full text-left px-3 py-1.5 text-xs font-mono text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {contextMenu.object.visible ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </>
              )}
            </svg>
            {contextMenu.object.visible ? 'Hide' : 'Show'}
          </button>
          {onDeleteObject && contextMenu.object.parent && !(contextMenu.object instanceof THREE.Camera) && (
            <>
              <div className="border-t border-gray-700 my-1"/>
              <button
                onClick={() => handleDelete(contextMenu.object)}
                className="w-full text-left px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-gray-700 hover:text-red-300 flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
