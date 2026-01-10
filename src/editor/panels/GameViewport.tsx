'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '@/lib/constants';
import { TransformGizmo, TransformMode } from '@/editor/gizmos/TransformGizmo';

interface GameViewportProps {
  scene: THREE.Scene | null;
  selectedObject: THREE.Object3D | null;
  selectedObjects: Set<THREE.Object3D>;
  transformMode: TransformMode;
  onSelectObject: (object: THREE.Object3D | null, multiSelect?: boolean) => void;
  onObjectChange?: (object: THREE.Object3D) => void;
}

/**
 * Game Viewport - Shows the 3D scene with editor camera and object selection
 */
export default function GameViewport({ scene, selectedObject, selectedObjects, transformMode, onSelectObject, onObjectChange }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const editorCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [isPanning, setIsPanning] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [zoomSpeed, setZoomSpeed] = useState(0.001); // Default zoom speed
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const orbitDistanceRef = useRef(10);
  const orbitAngleRef = useRef({ horizontal: Math.PI / 4, vertical: Math.PI / 3 });
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  
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

  // Update camera position based on orbit controls
  const updateCameraPosition = useCallback(() => {
    if (!editorCameraRef.current) return;

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
          editorCameraRef.current.aspect = width / height;
          editorCameraRef.current.updateProjectionMatrix();
        }
      }
    };

    updateSize();
    
    // Create editor camera (perspective)
    const camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.FOV,
      container.clientWidth / container.clientHeight || 1,
      GAME_CONFIG.NEAR,
      GAME_CONFIG.FAR
    );
    
    // Position camera for orbit view
    orbitDistanceRef.current = 15;
    orbitAngleRef.current = { horizontal: Math.PI / 4, vertical: Math.PI / 3 };
    
    editorCameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Update gizmo camera reference
    if (gizmoRef.current) {
      gizmoRef.current.setCamera(camera);
    }
    
    // Initial camera position
    updateCameraPosition();

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
  }, [scene, updateCameraPosition]);

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
          if (gizmoIntersects.length > 0) {
            let hitObject: THREE.Object3D | null = gizmoIntersects[0].object;
            let axis: string | undefined = hitObject.userData.axis;
            let type: string | undefined = hitObject.userData.type;
            
            // Traverse up parent chain to find axis info
            while (!axis && hitObject && hitObject.parent && hitObject.parent !== gizmoGroup.parent) {
              hitObject = hitObject.parent;
              axis = hitObject.userData.axis;
              type = hitObject.userData.type;
            }

            if (axis && type === transformMode) {
              // Start dragging gizmo - prevent default and stop propagation
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingGizmo(true);
              setDraggingAxis(axis);
              dragStartMouseRef.current = new THREE.Vector2(e.clientX, e.clientY);
              dragStartObjectTransformRef.current = {
                position: selectedObject.position.clone(),
                rotation: selectedObject.rotation.clone(),
                scale: selectedObject.scale.clone(),
              };
              return; // Don't process object selection
            }
          }
        }
      }
      // If not gizmo, handle object selection
      handleClick(e);
    } else if (e.button === 1) {
      // Middle mouse button - pan
      e.preventDefault();
      setIsPanning(true);
    } else if (e.button === 2) {
      // Right click - rotate/orbit
      e.preventDefault();
      setIsRotating(true);
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

    const handleGizmoDrag = (e: MouseEvent) => {
      const currentGizmo = gizmoRef.current;
      if (!currentGizmo || !camera) return;

      const gizmoGroup = currentGizmo.getGizmoGroup();
      if (!gizmoGroup) return;

      // Calculate mouse movement from start position
      const mouseDeltaX = e.clientX - startMouse.x;
      const mouseDeltaY = -(e.clientY - startMouse.y); // Invert Y for screen space
      
      // Get the axis direction in local space
      const axisDirection = new THREE.Vector3();
      if (currentAxis === 'x') axisDirection.set(1, 0, 0);
      else if (currentAxis === 'y') axisDirection.set(0, 1, 0);
      else if (currentAxis === 'z') axisDirection.set(0, 0, 1);
      
      // Transform axis to world space using gizmo/object orientation
      // For rotate mode, gizmo doesn't rotate with object, so use world axes directly
      if (currentMode !== 'rotate') {
        axisDirection.applyQuaternion(gizmoGroup.quaternion);
      }
      axisDirection.normalize();
      
      if (currentMode === 'translate') {
        // Calculate movement along the axis in world space
        if (startTransform.position) {
          // Use distance-based sensitivity
          const distance = currentObject.position.distanceTo(camera.position);
          const sensitivity = 0.015 * Math.max(0.5, Math.min(2.0, distance / 10));
          
          // Project mouse movement onto axis (use combined delta for better feel)
          const mouseDelta = mouseDeltaX + mouseDeltaY;
          const movement = axisDirection.clone().multiplyScalar(mouseDelta * sensitivity);
          
          currentObject.position.copy(startTransform.position).add(movement);
        }

      } else if (currentMode === 'rotate') {
        // Rotate mode - calculate angle from mouse movement
        if (startTransform.rotation) {
          // Use combined mouse delta for rotation
          const angle = (mouseDeltaX + mouseDeltaY) * 0.015; // Radians
          
          // Reset to start rotation
          currentObject.rotation.copy(startTransform.rotation);
          
          // Rotate around the world axis
          currentObject.rotateOnWorldAxis(axisDirection, angle);
        }

      } else if (currentMode === 'scale') {
        // Scale mode - calculate based on mouse movement
        if (startTransform.scale) {
          // Use distance-based sensitivity
          const distance = currentObject.position.distanceTo(camera.position);
          const sensitivity = 0.01 * Math.max(0.5, Math.min(2.0, distance / 10));
          
          // Calculate scale factor from mouse movement
          const mouseDelta = mouseDeltaX + mouseDeltaY;
          const scaleFactor = 1 + (mouseDelta * sensitivity);
          
          // Reset to start scale
          currentObject.scale.copy(startTransform.scale);
          
          // Apply scaling to the selected axis
          if (currentAxis === 'x') {
            currentObject.scale.x = startTransform.scale.x * scaleFactor;
          } else if (currentAxis === 'y') {
            currentObject.scale.y = startTransform.scale.y * scaleFactor;
          } else if (currentAxis === 'z') {
            currentObject.scale.z = startTransform.scale.z * scaleFactor;
          }
          
          // Clamp scale to reasonable values
          if (currentObject.scale.x < 0.01) currentObject.scale.x = 0.01;
          if (currentObject.scale.y < 0.01) currentObject.scale.y = 0.01;
          if (currentObject.scale.z < 0.01) currentObject.scale.z = 0.01;
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

    const handleGizmoDragEnd = () => {
      setIsDraggingGizmo(false);
      setDraggingAxis(null);
      dragStartMouseRef.current = null;
      dragStartObjectTransformRef.current = null;
    };

    document.addEventListener('mousemove', handleGizmoDrag);
    document.addEventListener('mouseup', handleGizmoDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleGizmoDrag);
      document.removeEventListener('mouseup', handleGizmoDragEnd);
    };
  }, [isDraggingGizmo, draggingAxis, selectedObject, transformMode, onObjectChange]);

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
    if (isRotating) {
      // Orbit rotation
      const sensitivity = 0.01;
      orbitAngleRef.current.horizontal -= deltaX * sensitivity;
      orbitAngleRef.current.vertical += deltaY * sensitivity;
      orbitAngleRef.current.vertical = Math.max(0.1, Math.min(Math.PI - 0.1, orbitAngleRef.current.vertical));
      updateCameraPosition();
    } else if (isPanning) {
      // Pan camera
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
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [scene, isRotating, isPanning, isDraggingGizmo, updateCameraPosition, handleMouseMoveForHover]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsRotating(false);
    // Gizmo dragging end is now handled by document-level mouseup listener
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+scroll: Adjust zoom speed
      const speedDelta = e.deltaY * 0.0001; // Smaller increments for speed adjustment
      setZoomSpeed(prev => {
        const newSpeed = Math.max(0.0001, Math.min(0.01, prev - speedDelta));
        return parseFloat(newSpeed.toFixed(5)); // Round to 5 decimal places
      });
    } else {
      // Normal scroll: Zoom using current zoom speed
      const delta = e.deltaY * zoomSpeed;
      orbitDistanceRef.current = Math.max(1, Math.min(100, orbitDistanceRef.current + delta));
      updateCameraPosition();
    }
  }, [updateCameraPosition, zoomSpeed]);


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
  useEffect(() => {
    if (selectedObjects.size > 0) {
      const firstSelected = Array.from(selectedObjects)[0];
      const box = new THREE.Box3().setFromObject(firstSelected);
      orbitTargetRef.current = box.getCenter(new THREE.Vector3());
      updateCameraPosition();
    }
  }, [selectedObjects, updateCameraPosition]);

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
      {/* Viewport overlay info */}
      <div className="absolute top-2 left-2 bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-300 pointer-events-none">
        <div className="mb-1">
          {!scene ? 'No scene' : 
           isDraggingGizmo ? `Dragging ${draggingAxis?.toUpperCase()} (${transformMode})` :
           isRotating ? 'Orbiting (Right-click)' :
           isPanning ? 'Panning (Middle-click)' :
           'Left: Select | Ctrl+Left: Multi-select | Right: Orbit | Middle: Pan'}
        </div>
        {selectedObject && (
          <div className="text-gray-400 text-xs mt-1">
            Transform: {transformMode} (W/Move, E/Rotate, R/Scale)
          </div>
        )}
        <div className="text-gray-400 text-xs mt-1">
          Scroll: Zoom | Ctrl+Scroll: Zoom Speed ({zoomSpeed.toFixed(4)})
        </div>
      </div>
      
      {selectedObjects.size > 0 && (
        <div className="absolute bottom-2 left-2 bg-blue-900/80 border border-blue-700 rounded px-2 py-1 text-xs font-mono text-white pointer-events-none">
          {selectedObjects.size === 1 
            ? `Selected: ${Array.from(selectedObjects)[0].name || Array.from(selectedObjects)[0].type}`
            : `${selectedObjects.size} objects selected`}
        </div>
      )}
    </div>
  );
}

