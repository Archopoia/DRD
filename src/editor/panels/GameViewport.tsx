'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '@/lib/constants';
import { TransformGizmo, TransformMode } from '@/editor/gizmos/TransformGizmo';
import { logGizmo, logTransform, logGeneral } from '@/editor/utils/debugLogger';
import { HistoryManager } from '../history/HistoryManager';
import { createTransformObjectAction } from '../history/actions/EditorActions';
import { EditorCore } from '../core';

interface GameViewportProps {
  scene: THREE.Scene | null;
  selectedObject: THREE.Object3D | null;
  selectedObjects: Set<THREE.Object3D>;
  transformMode: TransformMode;
  editorCore?: EditorCore | null; // EditorCore for physics body updates and editor operations
  onSelectObject: (object: THREE.Object3D | null, multiSelect?: boolean) => void;
  onObjectChange?: (object: THREE.Object3D) => void;
  onTransformModeChange?: (mode: TransformMode) => void;
  historyManager?: HistoryManager | null;
}

/**
 * Game Viewport - Shows the 3D scene with editor camera and object selection
 * Refactored to use EditorCore instead of direct gameInstance access
 */
export default function GameViewport({ scene, selectedObject, selectedObjects, transformMode, editorCore, onSelectObject, onObjectChange, onTransformModeChange, historyManager }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const editorCameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [isPanning, setIsPanning] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [zoomSpeed, setZoomSpeed] = useState(0.01); // Default zoom speed (10x faster)
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const orbitDistanceRef = useRef(10);
  const orbitAngleRef = useRef({ horizontal: Math.PI / 4, vertical: Math.PI / 3 });
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  
  // View mode state (perspective, top, front, side)
  type ViewMode = 'perspective' | 'top' | 'front' | 'side';
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const orthoSizeRef = useRef(20); // Orthographic camera size
  
  // Grid state
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const [gridSize, setGridSize] = useState(10); // Grid size (number of divisions)
  const [gridScale, setGridScale] = useState(1.0); // Grid scale (spacing)
  const [snapEnabled, setSnapEnabled] = useState(true); // Snap to grid enabled
  const [snapSize, setSnapSize] = useState(0.5); // Snap size (same as grid spacing)
  
  // Gizmo state
  const gizmoRef = useRef<TransformGizmo | null>(null);
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  const [draggingAxis, setDraggingAxis] = useState<string | null>(null);
  const dragStartMouseRef = useRef<THREE.Vector2 | null>(null);
  const dragStartObjectTransformRef = useRef<{
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  } | null>(null);
  // Store start transforms for all selected objects for multi-select
  const dragStartTransformsRef = useRef<Map<THREE.Object3D, {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }>>(new Map());

  // Snap to grid function
  const snapToGrid = useCallback((value: number, snapSize: number): number => {
    if (!snapEnabled) return value;
    return Math.round(value / snapSize) * snapSize;
  }, [snapEnabled]);

  // Snap vector to grid
  const snapVectorToGrid = useCallback((vec: THREE.Vector3, snapSize: number): THREE.Vector3 => {
    return new THREE.Vector3(
      snapToGrid(vec.x, snapSize),
      snapToGrid(vec.y, snapSize),
      snapToGrid(vec.z, snapSize)
    );
  }, [snapEnabled, snapSize]);

  // Update camera position based on orbit controls (perspective view)
  const updateCameraPosition = useCallback(() => {
    if (!editorCameraRef.current || !(editorCameraRef.current instanceof THREE.PerspectiveCamera)) return;

    const camera = editorCameraRef.current;
    const distance = orbitDistanceRef.current;
    const angles = orbitAngleRef.current;
    const target = orbitTargetRef.current;

    const x = target.x + distance * Math.sin(angles.vertical) * Math.cos(angles.horizontal);
    const y = target.y + distance * Math.cos(angles.vertical);
    const z = target.z + distance * Math.sin(angles.vertical) * Math.sin(angles.horizontal);

    camera.position.set(x, y, z);
    camera.lookAt(target);
  }, []);

  // Update orthographic camera for 2D views
  const updateOrthographicCamera = useCallback((mode: ViewMode) => {
    if (!editorCameraRef.current || !(editorCameraRef.current instanceof THREE.OrthographicCamera)) return;
    if (!containerRef.current) return;

    const camera = editorCameraRef.current;
    const container = containerRef.current;
    const aspect = container.clientWidth / container.clientHeight || 1;
    const size = orthoSizeRef.current;
    const target = orbitTargetRef.current;

    // Update orthographic camera bounds
    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.updateProjectionMatrix();

    // Position camera based on view mode
    switch (mode) {
      case 'top':
        // Top view: camera above, looking down
        camera.position.set(target.x, target.y + 20, target.z);
        camera.lookAt(target);
        camera.up.set(0, 0, -1); // Rotate up vector for top view
        break;
      case 'front':
        // Front view: camera in front, looking at scene
        camera.position.set(target.x, target.y, target.z + 20);
        camera.lookAt(target);
        camera.up.set(0, 1, 0);
        break;
      case 'side':
        // Side view: camera to the side, looking at scene
        camera.position.set(target.x + 20, target.y, target.z);
        camera.lookAt(target);
        camera.up.set(0, 1, 0);
        break;
    }
  }, []);

  // Initialize grid
  useEffect(() => {
    if (!scene) return;

    // Create grid helper
    const grid = new THREE.GridHelper(gridSize * gridScale, gridSize, 0x444444, 0x222222);
    grid.position.y = 0;
    scene.add(grid);
    gridRef.current = grid;

    return () => {
      if (grid && scene) {
        scene.remove(grid);
        grid.dispose();
      }
      gridRef.current = null;
    };
  }, [scene, gridSize, gridScale]);

  // Initialize gizmo
  useEffect(() => {
    if (!scene) return;

    const gizmo = new TransformGizmo(scene);
    gizmoRef.current = gizmo;

    return () => {
      gizmo.dispose();
      gizmoRef.current = null;
    };
  }, [scene]);

  // Update gizmo when selection or mode changes
  useEffect(() => {
    if (!gizmoRef.current || !editorCameraRef.current) return;

    gizmoRef.current.setCamera(editorCameraRef.current);
    gizmoRef.current.setSelectedObject(selectedObject);
    gizmoRef.current.setMode(transformMode);
  }, [selectedObject, transformMode]);

  // Initialize editor camera and renderer
  useEffect(() => {
    if (!containerRef.current || !scene) return;

    const container = containerRef.current;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    
    renderer.setClearColor(0x1a1a1a);
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      if (width > 0 && height > 0) {
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        if (editorCameraRef.current) {
          if (editorCameraRef.current instanceof THREE.PerspectiveCamera) {
            editorCameraRef.current.aspect = width / height;
            editorCameraRef.current.updateProjectionMatrix();
          } else if (editorCameraRef.current instanceof THREE.OrthographicCamera) {
            const aspect = width / height;
            const size = orthoSizeRef.current;
            editorCameraRef.current.left = -size * aspect;
            editorCameraRef.current.right = size * aspect;
            editorCameraRef.current.top = size;
            editorCameraRef.current.bottom = -size;
            editorCameraRef.current.updateProjectionMatrix();
          }
        }
      }
    };

    updateSize();
    
    // Create editor camera based on view mode
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    
    if (viewMode === 'perspective') {
      camera = new THREE.PerspectiveCamera(
        GAME_CONFIG.FOV,
        container.clientWidth / container.clientHeight || 1,
        GAME_CONFIG.NEAR,
        GAME_CONFIG.FAR
      );
      // Position camera for orbit view
      orbitDistanceRef.current = 15;
      orbitAngleRef.current = { horizontal: Math.PI / 4, vertical: Math.PI / 3 };
      updateCameraPosition();
    } else {
      // Orthographic camera for 2D views
      const aspect = container.clientWidth / container.clientHeight || 1;
      const size = orthoSizeRef.current;
      camera = new THREE.OrthographicCamera(
        -size * aspect,
        size * aspect,
        size,
        -size,
        GAME_CONFIG.NEAR,
        GAME_CONFIG.FAR
      );
      updateOrthographicCamera(viewMode);
    }
    
    editorCameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Update gizmo camera reference
    if (gizmoRef.current) {
      gizmoRef.current.setCamera(camera);
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
      renderer.dispose();
      rendererRef.current = null;
      editorCameraRef.current = null;
      canvasRef.current = null;
    };
  }, [scene, updateCameraPosition, viewMode, updateOrthographicCamera]);

  // Handle click to select object (gizmo detection is now in handleMouseDown)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !scene || !editorCameraRef.current || !rendererRef.current) return;
    if (isDraggingGizmo) return; // Don't select if we're dragging gizmo

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, editorCameraRef.current);

    // Select object (gizmos are already excluded)
    // Get all meshes in scene (excluding gizmos)
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible && !object.userData.isGizmo) {
        meshes.push(object);
      }
    });

    const intersections = raycasterRef.current.intersectObjects(meshes, true);
    
    if (intersections.length > 0) {
      const clickedObject = intersections[0].object;
      // Ctrl+click for multi-select, regular click for single select
      onSelectObject(clickedObject, e.ctrlKey || e.metaKey);
    } else if (!e.ctrlKey && !e.metaKey) {
      // Only clear selection if not doing multi-select
      onSelectObject(null, false);
    }
  }, [scene, onSelectObject, isDraggingGizmo]);

  // Handle mouse events for orbit controls and gizmo
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 0) {
      // Left click - select object or gizmo (Ctrl+click for multi-select)
      // Check if we clicked on gizmo first
      if (gizmoRef.current && selectedObject && editorCameraRef.current) {
        const gizmoGroup = gizmoRef.current.getGizmoGroup();
        if (gizmoGroup) {
          raycasterRef.current.setFromCamera(mouseRef.current, editorCameraRef.current);
          const gizmoIntersects = raycasterRef.current.intersectObjects(gizmoGroup.children, true);
          
          logGizmo(`Gizmo click detection`, {
            hasGizmoGroup: !!gizmoGroup,
            intersectionsCount: gizmoIntersects.length,
            currentMode: transformMode,
            gizmoGroupChildrenCount: gizmoGroup.children.length,
            mouseCoords: { x: mouseRef.current.x, y: mouseRef.current.y },
          });
          
          if (gizmoIntersects.length > 0) {
            let hitObject: THREE.Object3D | null = gizmoIntersects[0].object;
            let axis: string | undefined = hitObject.userData.axis;
            let type: string | undefined = hitObject.userData.type;
            
            logGizmo(`First intersection`, {
              objectType: hitObject.type,
              objectName: hitObject.name,
              hasAxis: !!axis,
              hasType: !!type,
              axis,
              type,
              userData: hitObject.userData,
            });
            
            // Traverse up parent chain to find axis info
            let traversalDepth = 0;
            while (!axis && hitObject && hitObject.parent && hitObject.parent !== gizmoGroup.parent && traversalDepth < 10) {
              hitObject = hitObject.parent;
              axis = hitObject.userData.axis;
              type = hitObject.userData.type;
              traversalDepth++;
              
              if (traversalDepth === 1) {
                logGizmo(`Traversing to parent`, {
                  parentType: hitObject.type,
                  parentName: hitObject.name,
                  axis,
                  type,
                });
              }
            }

            logGizmo(`Final axis detection`, {
              axis,
              type,
              transformMode,
              matches: axis && type === transformMode,
            });

            if (axis && type === transformMode) {
              // Start dragging gizmo - prevent default and stop propagation
              e.preventDefault();
              e.stopPropagation();
              
              logGizmo(`Gizmo clicked: axis=${axis}, mode=${transformMode}`, {
                axis,
                mode: transformMode,
                objectName: selectedObject.name,
                objectType: selectedObject.type,
                objectPosition: selectedObject.position.clone(),
                objectRotation: selectedObject.rotation.clone(),
                objectScale: selectedObject.scale.clone(),
              });
              
              // Mark ALL selected objects as editor-controlled BEFORE starting drag
              // This prevents physics from overwriting our changes in the game loop
              dragStartTransformsRef.current.clear();
              selectedObjects.forEach(obj => {
                if (obj instanceof THREE.Mesh) {
                  obj.userData._editorControlled = true;
                }
                // Store start transform for each selected object
                dragStartTransformsRef.current.set(obj, {
                  position: obj.position.clone(),
                  rotation: obj.rotation.clone(),
                  scale: obj.scale.clone(),
                });
              });
              
              // Also store for the primary selected object (for backward compatibility)
              dragStartObjectTransformRef.current = {
                position: selectedObject.position.clone(),
                rotation: selectedObject.rotation.clone(),
                scale: selectedObject.scale.clone(),
              };
              
              setIsDraggingGizmo(true);
              setDraggingAxis(axis);
              dragStartMouseRef.current = new THREE.Vector2(e.clientX, e.clientY);
              
              logTransform(`Dragging started: ${transformMode} on ${axis} axis (${selectedObjects.size} objects)`, {
                startMouse: { x: e.clientX, y: e.clientY },
                startPosition: dragStartObjectTransformRef.current.position,
                startRotation: dragStartObjectTransformRef.current.rotation,
                startScale: dragStartObjectTransformRef.current.scale,
                selectedCount: selectedObjects.size,
              });
              
              return; // Don't process object selection
            } else {
              logGizmo(`Gizmo click detected but not matching mode`, {
                axis,
                type,
                transformMode,
                reason: !axis ? 'no axis' : type !== transformMode ? 'type mismatch' : 'unknown',
              });
            }
          } else {
            logGizmo(`No gizmo intersections found`, {
              gizmoGroupChildrenCount: gizmoGroup.children.length,
              mouseCoords: { x: mouseRef.current.x, y: mouseRef.current.y },
            });
          }
        } else {
          logGizmo(`No gizmo group available`, {});
        }
      } else {
        logGizmo(`Gizmo click check skipped`, {
          hasGizmoRef: !!gizmoRef.current,
          hasSelectedObject: !!selectedObject,
          hasCamera: !!editorCameraRef.current,
        });
      }
      // If not gizmo, handle object selection
      handleClick(e);
    } else if (e.button === 1) {
      // Middle mouse button - pan (works in all views)
      e.preventDefault();
      setIsPanning(true);
    } else if (e.button === 2) {
      // Right click - rotate/orbit (only in perspective view)
      if (viewMode === 'perspective') {
        e.preventDefault();
        setIsRotating(true);
      }
    }
  }, [handleClick, selectedObject, transformMode]);

  // Handle hover highlighting for gizmo
  const handleMouseMoveForHover = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !scene || !editorCameraRef.current || !gizmoRef.current || isDraggingGizmo) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, editorCameraRef.current);

    const gizmoGroup = gizmoRef.current.getGizmoGroup();
    if (gizmoGroup) {
      const intersects = raycasterRef.current.intersectObjects(gizmoGroup.children, true);
      if (intersects.length > 0) {
        const axis = intersects[0].object.userData.axis;
        if (axis && intersects[0].object.userData.type === transformMode) {
          gizmoRef.current.highlightAxis(axis);
          return;
        }
      }
      gizmoRef.current.highlightAxis(null);
    }
  }, [scene, transformMode, isDraggingGizmo]);

  // Handle gizmo dragging with document-level event listeners
  useEffect(() => {
    if (!isDraggingGizmo || !selectedObject || !gizmoRef.current || !dragStartMouseRef.current || !dragStartObjectTransformRef.current || !editorCameraRef.current) {
      return;
    }

    // Store refs in local variables to avoid stale closures
    const currentObject = selectedObject;
    const currentMode = transformMode;
    const currentAxis = draggingAxis;
    const startMouse = dragStartMouseRef.current;
    const startTransform = dragStartObjectTransformRef.current;
    const camera = editorCameraRef.current;

    logGizmo(`Gizmo drag useEffect triggered`, {
      isDraggingGizmo,
      hasSelectedObject: !!selectedObject,
      hasGizmoRef: !!gizmoRef.current,
      hasDragStartMouse: !!dragStartMouseRef.current,
      hasDragStartTransform: !!dragStartObjectTransformRef.current,
      hasCamera: !!editorCameraRef.current,
      mode: currentMode,
      axis: currentAxis,
    });

    const handleGizmoDrag = (e: MouseEvent) => {
      const currentGizmo = gizmoRef.current;
      if (!currentGizmo || !camera) {
        logGizmo(`Drag handler: Missing gizmo or camera`, { hasGizmo: !!currentGizmo, hasCamera: !!camera });
        return;
      }

      const gizmoGroup = currentGizmo.getGizmoGroup();
      if (!gizmoGroup) {
        logGizmo(`Drag handler: No gizmo group`);
        return;
      }

      // Calculate mouse movement from start position
      const mouseDeltaX = e.clientX - startMouse.x;
      const mouseDeltaY = -(e.clientY - startMouse.y); // Invert Y for screen space
      
      logTransform(`Drag update: delta=(${mouseDeltaX.toFixed(2)}, ${mouseDeltaY.toFixed(2)})`, {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startMouseX: startMouse.x,
        startMouseY: startMouse.y,
        deltaX: mouseDeltaX,
        deltaY: mouseDeltaY,
        mode: currentMode,
        axis: currentAxis,
      });
      
      // Get the axis direction in local space
      const axisDirection = new THREE.Vector3();
      
      // For rotation mode, swap blue and green axes:
      // Blue gizmo (z) should control Y axis (what green currently does)
      // Green gizmo (y) should control Z axis (what blue currently does)
      if (currentMode === 'rotate') {
        if (currentAxis === 'x') axisDirection.set(1, 0, 0);
        else if (currentAxis === 'y') axisDirection.set(0, 0, 1); // Green controls Z axis
        else if (currentAxis === 'z') axisDirection.set(0, 1, 0); // Blue controls Y axis
      } else {
        // For translate and scale, use normal axis mapping
        if (currentAxis === 'x') axisDirection.set(1, 0, 0);
        else if (currentAxis === 'y') axisDirection.set(0, 1, 0);
        else if (currentAxis === 'z') axisDirection.set(0, 0, 1);
      }
      
      const axisDirectionLocal = axisDirection.clone();
      
      // Transform axis to world space using gizmo/object orientation
      // For rotate mode, gizmo doesn't rotate with object, so use world axes directly
      if (currentMode !== 'rotate') {
        axisDirection.applyQuaternion(gizmoGroup.quaternion);
      }
      axisDirection.normalize();
      
      logTransform(`Axis direction calculated`, {
        local: { x: axisDirectionLocal.x, y: axisDirectionLocal.y, z: axisDirectionLocal.z },
        world: { x: axisDirection.x, y: axisDirection.y, z: axisDirection.z },
        gizmoQuaternion: gizmoGroup.quaternion,
        mode: currentMode,
      });
      
      if (currentMode === 'translate') {
        // Calculate movement along the axis in world space
        // Use distance from primary object for sensitivity (applies to all objects)
        const distance = currentObject.position.distanceTo(camera.position);
        const sensitivity = 0.015 * Math.max(0.5, Math.min(2.0, distance / 10));
        
        // Project mouse movement onto axis (use combined delta for better feel)
        let mouseDelta = mouseDeltaX + mouseDeltaY;
        
        // Invert direction for blue gizmo (z-axis)
        if (currentAxis === 'z') {
          mouseDelta = -mouseDelta;
        }
        
        const movement = axisDirection.clone().multiplyScalar(mouseDelta * sensitivity);
        
        // Apply transform to ALL selected objects
        selectedObjects.forEach(obj => {
          const objStartTransform = dragStartTransformsRef.current.get(obj);
          if (objStartTransform) {
            const newPosition = objStartTransform.position.clone().add(movement);
            // Apply snap to grid if enabled
            let finalPosition = newPosition;
            if (snapEnabled) {
              finalPosition = snapVectorToGrid(newPosition, snapSize);
            }
            obj.position.copy(finalPosition);
            obj.updateMatrix();
            obj.updateMatrixWorld(true);
            updatePhysicsBodyIfExists(obj);
          }
        });
        
        if (startTransform.position) {
          logTransform(`Translate calculation (${selectedObjects.size} objects)`, {
            distance,
            sensitivity,
            mouseDelta,
            movement: { x: movement.x, y: movement.y, z: movement.z },
            startPosition: startTransform.position,
            newPosition: startTransform.position.clone().add(movement),
          });
        }

        // Update object change callback
        if (onObjectChange) {
          selectedObjects.forEach(obj => {
            onObjectChange(obj);
          });
        }

      } else if (currentMode === 'rotate') {
        // Rotate mode - calculate angle from total mouse movement since drag start
        // Calculate total rotation angle from start position
        let totalAngle = (mouseDeltaX + mouseDeltaY) * 0.015; // Radians
        
        // Invert controls only for red (x-axis) rotating gizmo
        if (currentAxis === 'x') {
          totalAngle = -totalAngle;
        }
        
        // Create rotation quaternion for the total angle around world axis
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(axisDirection, totalAngle);
        
        // Apply rotation to ALL selected objects
        selectedObjects.forEach(obj => {
          const objStartTransform = dragStartTransformsRef.current.get(obj);
          if (objStartTransform) {
            // Store start quaternion if not already stored
            if (!obj.userData._gizmoStartQuaternion) {
              obj.userData._gizmoStartQuaternion = new THREE.Quaternion().setFromEuler(objStartTransform.rotation);
            }
            const startQuaternion = obj.userData._gizmoStartQuaternion;
            
            // Combine rotations: rotationQuaternion * startQuaternion
            const finalQuaternion = rotationQuaternion.clone().multiply(startQuaternion);
            
            // Apply to object quaternion directly
            obj.quaternion.copy(finalQuaternion);
            
            // Update Euler angles from quaternion (for Inspector display)
            obj.rotation.setFromQuaternion(obj.quaternion);
            
            // Force matrix update - critical for visual updates!
            obj.updateMatrix();
            obj.updateMatrixWorld(true);
            
            // Update physics body if this object has one
            updatePhysicsBodyIfExists(obj);
          }
        });
        
        if (startTransform.rotation) {
          logTransform(`Rotate calculation (${selectedObjects.size} objects)`, {
            mouseDeltaX,
            mouseDeltaY,
            totalAngle,
            totalAngleDegrees: (totalAngle * 180 / Math.PI).toFixed(2),
            axis: currentAxis,
          });
        }

      } else if (currentMode === 'scale') {
        // Scale mode - calculate based on mouse movement
        // Use distance from primary object for sensitivity (applies to all objects)
        const distance = currentObject.position.distanceTo(camera.position);
        const sensitivity = 0.01 * Math.max(0.5, Math.min(2.0, distance / 10));
        
        // Calculate scale factor from mouse movement
        let mouseDelta = mouseDeltaX + mouseDeltaY;
        
        // Invert direction for blue gizmo (z-axis)
        if (currentAxis === 'z') {
          mouseDelta = -mouseDelta;
        }
        
        const scaleFactor = 1 + (mouseDelta * sensitivity);
        
        // Apply scaling to ALL selected objects
        selectedObjects.forEach(obj => {
          const objStartTransform = dragStartTransformsRef.current.get(obj);
          if (objStartTransform) {
            // Reset to start scale
            obj.scale.copy(objStartTransform.scale);
            
            // Apply scaling to the selected axis
            if (currentAxis === 'x') {
              obj.scale.x = objStartTransform.scale.x * scaleFactor;
            } else if (currentAxis === 'y') {
              obj.scale.y = objStartTransform.scale.y * scaleFactor;
            } else if (currentAxis === 'z') {
              obj.scale.z = objStartTransform.scale.z * scaleFactor;
            }
            
            // Clamp scale to reasonable values
            if (obj.scale.x < 0.01) obj.scale.x = 0.01;
            if (obj.scale.y < 0.01) obj.scale.y = 0.01;
            if (obj.scale.z < 0.01) obj.scale.z = 0.01;
            
            // Force matrix update
            obj.updateMatrix();
            obj.updateMatrixWorld(true);
            
            // Update physics body if this object has one
            updatePhysicsBodyIfExists(obj);
          }
        });
        
        if (startTransform.scale) {
          logTransform(`Scale calculation (${selectedObjects.size} objects)`, {
            distance,
            sensitivity,
            mouseDelta,
            scaleFactor,
            startScale: startTransform.scale,
          });
        }
      }

      // Update gizmo position/rotation to match object
      if (currentGizmo) {
        currentGizmo.updatePosition();
      }

      if (onObjectChange) {
        onObjectChange(currentObject);
      }
    };

    // Helper function to update physics body if object has one
    const updatePhysicsBodyIfExists = (object: THREE.Object3D) => {
      if (!editorCore || !(object instanceof THREE.Mesh)) {
        if (!editorCore) {
          logGeneral(`Cannot update physics body: no editorCore`, { objectName: object?.name || '(unnamed)' });
        }
        return;
      }
      
      try {
        // Use EditorCore's method to update physics body
        editorCore.updatePhysicsBody(object);
        
        logTransform(`Physics body updated successfully`, {
          objectName: object.name || '(unnamed)',
          objectType: object.type,
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          quaternion: object.quaternion.clone(),
          hasPhysicsBody: true,
        });
      } catch (error) {
        logGeneral(`Failed to update physics body`, { 
          error: error instanceof Error ? error.message : String(error), 
          errorStack: error instanceof Error ? error.stack : undefined,
          objectName: object?.name || '(unnamed)',
          objectType: object.type,
        });
      }
    };

    const handleGizmoDragEnd = () => {
      // Clean up temporary rotation data
      if (currentObject.userData._gizmoStartQuaternion) {
        delete currentObject.userData._gizmoStartQuaternion;
      }
      
      // Final physics body update
      updatePhysicsBodyIfExists(currentObject);
      
      // Create history action for transform if start transform was stored and history manager is available
      if (historyManager && selectedObjects.size > 0) {
        // For multi-select, create an action for each transformed object
        selectedObjects.forEach(obj => {
          const objStartTransform = dragStartTransformsRef.current.get(obj);
          if (objStartTransform) {
            const oldPosition = objStartTransform.position.clone();
            const oldRotation = new THREE.Quaternion().setFromEuler(objStartTransform.rotation);
            const oldScale = objStartTransform.scale.clone();
            
            const newPosition = obj.position.clone();
            const newRotation = obj.quaternion.clone();
            const newScale = obj.scale.clone();
            
            // Only create action if transform actually changed
            if (!oldPosition.equals(newPosition) || 
                !oldRotation.equals(newRotation) || 
                !oldScale.equals(newScale)) {
              const action = createTransformObjectAction(
                obj,
                oldPosition,
                oldRotation,
                oldScale,
                newPosition,
                newRotation,
                newScale,
                `Transform ${obj.name || obj.type}`
              );
              historyManager.addAction(action);
            }
          }
        });
      }
      
      logGizmo(`Gizmo drag ended`, {
        mode: currentMode,
        axis: currentAxis,
        finalPosition: currentObject.position.clone(),
        finalRotation: currentObject.rotation.clone(),
        finalRotationDegrees: {
          x: (currentObject.rotation.x * 180 / Math.PI).toFixed(2),
          y: (currentObject.rotation.y * 180 / Math.PI).toFixed(2),
          z: (currentObject.rotation.z * 180 / Math.PI).toFixed(2),
        },
        finalScale: currentObject.scale.clone(),
        isEditorControlled: currentObject.userData._editorControlled,
      });
      
      setIsDraggingGizmo(false);
      setDraggingAxis(null);
      dragStartMouseRef.current = null;
      dragStartObjectTransformRef.current = null;
      
      // Note: We keep _editorControlled flag set so physics doesn't overwrite after drag ends
      // It will be cleared when object is deselected or when editor is closed
    };

    document.addEventListener('mousemove', handleGizmoDrag);
    document.addEventListener('mouseup', handleGizmoDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleGizmoDrag);
      document.removeEventListener('mouseup', handleGizmoDragEnd);
    };
  }, [isDraggingGizmo, draggingAxis, selectedObject, selectedObjects, transformMode, onObjectChange, editorCore, historyManager]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !editorCameraRef.current || !scene) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    // Handle hover highlighting when not dragging
    if (!isDraggingGizmo && !isRotating && !isPanning) {
      handleMouseMoveForHover(e);
    }

    // Gizmo dragging is now handled by document-level event listeners in useEffect
    // Only handle camera controls here
    if (isRotating && viewMode === 'perspective') {
      // Orbit rotation (only in perspective view)
      const sensitivity = 0.01;
      orbitAngleRef.current.horizontal -= deltaX * sensitivity;
      orbitAngleRef.current.vertical += deltaY * sensitivity;
      orbitAngleRef.current.vertical = Math.max(0.1, Math.min(Math.PI - 0.1, orbitAngleRef.current.vertical));
      updateCameraPosition();
    } else if (isPanning) {
      // Pan camera (works in all views)
      if (viewMode === 'perspective' && editorCameraRef.current instanceof THREE.PerspectiveCamera) {
        // Perspective view panning
        const sensitivity = 0.005;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        const forward = new THREE.Vector3();
        editorCameraRef.current.matrixWorld.extractBasis(right, up, forward);
        right.normalize();
        up.normalize();
        
        orbitTargetRef.current.addScaledVector(right, -deltaX * sensitivity * orbitDistanceRef.current);
        orbitTargetRef.current.addScaledVector(up, deltaY * sensitivity * orbitDistanceRef.current);
        updateCameraPosition();
      } else if (viewMode !== 'perspective' && editorCameraRef.current instanceof THREE.OrthographicCamera) {
        // Orthographic view panning (handled in separate check above)
        // This is already handled in the earlier check
      }
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [scene, isRotating, isPanning, isDraggingGizmo, updateCameraPosition, handleMouseMoveForHover]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsRotating(false);
    // Gizmo dragging end is now handled by document-level mouseup listener
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Handle zoom for orthographic views
    if (viewMode !== 'perspective' && editorCameraRef.current instanceof THREE.OrthographicCamera) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      orthoSizeRef.current = Math.max(5, Math.min(100, orthoSizeRef.current * delta));
      
      if (containerRef.current) {
        const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight || 1;
        const size = orthoSizeRef.current;
        editorCameraRef.current.left = -size * aspect;
        editorCameraRef.current.right = size * aspect;
        editorCameraRef.current.top = size;
        editorCameraRef.current.bottom = -size;
        editorCameraRef.current.updateProjectionMatrix();
      }
      return;
    }
    
    // Perspective view zoom (orbit distance)
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+scroll: Adjust zoom speed
      const speedDelta = e.deltaY * 0.001; // 10x larger increments for speed adjustment
      setZoomSpeed(prev => {
        const newSpeed = Math.max(0.001, Math.min(0.1, prev - speedDelta));
        return parseFloat(newSpeed.toFixed(4)); // Round to 4 decimal places
      });
    } else {
      // Normal scroll: Zoom using current zoom speed
      const delta = e.deltaY * zoomSpeed;
      orbitDistanceRef.current = Math.max(1, Math.min(100, orbitDistanceRef.current + delta));
      updateCameraPosition();
    }
  }, [updateCameraPosition, zoomSpeed, viewMode]);


  // Update gizmo position in render loop
  useEffect(() => {
    if (gizmoRef.current && selectedObject) {
      gizmoRef.current.updatePosition();
    }
  }, [selectedObject?.position.x, selectedObject?.position.y, selectedObject?.position.z,
      selectedObject?.rotation.x, selectedObject?.rotation.y, selectedObject?.rotation.z]);

  // Render loop
  useEffect(() => {
    if (!scene || !editorCameraRef.current || !rendererRef.current) return;

    const render = () => {
      if (!scene || !editorCameraRef.current || !rendererRef.current) return;

      // Update gizmo position during dragging
      if (gizmoRef.current && selectedObject) {
        gizmoRef.current.updatePosition();
      }

      rendererRef.current.render(scene, editorCameraRef.current);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene, selectedObject]);

  // Update orbit target to focus on selected objects (focus on first selected)
  // REMOVED: Auto-focus/zoom on selection - user can manually orbit if needed
  // useEffect(() => {
  //   if (selectedObjects.size > 0) {
  //     const firstSelected = Array.from(selectedObjects)[0];
  //     const box = new THREE.Box3().setFromObject(firstSelected);
  //     orbitTargetRef.current = box.getCenter(new THREE.Vector3());
  //     updateCameraPosition();
  //   }
  // }, [selectedObjects, updateCameraPosition]);

  // Visual selection highlighting is now handled in GameEditor component

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-gray-900 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: isRotating ? 'grabbing' : isPanning ? 'grabbing' : 'default' }}
    >
      {/* View Mode Controls - Top left */}
      <div 
        className="absolute top-2 left-2 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-1.5 flex gap-1 z-20 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setViewMode('perspective')}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === 'perspective'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Perspective View"
        >
          3D
        </button>
        <button
          onClick={() => setViewMode('top')}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === 'top'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Top View"
        >
          Top
        </button>
        <button
          onClick={() => setViewMode('front')}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === 'front'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Front View"
        >
          Front
        </button>
        <button
          onClick={() => setViewMode('side')}
          className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
            viewMode === 'side'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Side View"
        >
          Side
        </button>
      </div>

      {/* Grid Controls - Floating panel (bottom right) */}
      <div 
        className="absolute bottom-2 right-2 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 z-30 shadow-xl"
        style={{ bottom: '0.5rem', right: '0.5rem' }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <label className="text-xs text-gray-300 font-mono">Grid</label>
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
            className="w-3 h-3"
          />
        </div>
        {snapEnabled && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-mono">Size:</label>
            <input
              type="number"
              value={snapSize}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  setSnapSize(val);
                }
              }}
              step="0.1"
              min="0.1"
              max="5"
              className="w-12 px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono"
            />
          </div>
        )}
        {viewMode !== 'perspective' && (
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-gray-400 font-mono">Zoom:</label>
            <input
              type="number"
              value={orthoSizeRef.current}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  orthoSizeRef.current = val;
                  updateOrthographicCamera(viewMode);
                }
              }}
              step="1"
              min="5"
              max="100"
              className="w-12 px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Transform Tools - Floating vertical panel (left side) */}
      {selectedObject && onTransformModeChange && (
        <div 
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-1.5 flex flex-col gap-1.5 z-20 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransformModeChange('translate');
            }}
            className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
              transformMode === 'translate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/80'
            }`}
            title="Move (W)"
          >
            {/* Move icon - arrows in 4 directions */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="9 3 12 6 15 3"/>
              <polyline points="9 21 12 18 15 21"/>
              <polyline points="3 9 6 12 3 15"/>
              <polyline points="21 9 18 12 21 15"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransformModeChange('rotate');
            }}
            className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
              transformMode === 'rotate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/80'
            }`}
            title="Rotate (E)"
          >
            {/* Rotate icon - circular arrows */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2v6"/>
              <path d="M12 16v6"/>
              <path d="M4.93 4.93l4.24 4.24"/>
              <path d="M14.83 14.83l4.24 4.24"/>
              <path d="M2 12h6"/>
              <path d="M16 12h6"/>
              <path d="M4.93 19.07l4.24-4.24"/>
              <path d="M14.83 9.17l4.24-4.24"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransformModeChange('scale');
            }}
            className={`w-9 h-9 flex items-center justify-center rounded transition-all ${
              transformMode === 'scale'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/80'
            }`}
            title="Scale (R)"
          >
            {/* Scale icon - corners expanding */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
          </button>
        </div>
      )}

      {/* Viewport overlay info - Command bar at bottom */}
      <div 
        className="absolute bottom-2 left-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-300 pointer-events-none z-10"
        style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem' }}
      >
        {!scene ? 'No scene' : 
         isDraggingGizmo ? `Dragging ${draggingAxis?.toUpperCase()}` :
         isRotating ? 'Orbiting' :
         isPanning ? 'Panning' :
         `Left: Select | Right: Orbit | Middle: Pan | Scroll: Zoom (${zoomSpeed.toFixed(3)})`}
      </div>
      
      {selectedObjects.size > 0 && (
        <div 
          className="absolute bg-blue-900/80 border border-blue-700 rounded px-2 py-1 text-xs font-mono text-white pointer-events-none z-30"
          style={{ top: '0.5rem', right: '0.5rem' }}
        >
          {selectedObjects.size === 1 
            ? `Selected: ${Array.from(selectedObjects)[0].name || Array.from(selectedObjects)[0].type}`
            : `${selectedObjects.size} objects selected`}
        </div>
      )}
    </div>
  );
}

