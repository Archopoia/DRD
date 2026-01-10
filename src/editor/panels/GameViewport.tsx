'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '@/lib/constants';

interface GameViewportProps {
  scene: THREE.Scene | null;
  selectedObject: THREE.Object3D | null;
  selectedObjects: Set<THREE.Object3D>;
  onSelectObject: (object: THREE.Object3D | null, multiSelect?: boolean) => void;
  onObjectChange?: (object: THREE.Object3D) => void;
}

/**
 * Game Viewport - Shows the 3D scene with editor camera and object selection
 */
export default function GameViewport({ scene, selectedObject, selectedObjects, onSelectObject, onObjectChange }: GameViewportProps) {
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

  // Handle click to select object
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !scene || !editorCameraRef.current || !rendererRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    raycasterRef.current.setFromCamera(mouseRef.current, editorCameraRef.current);

    // Get all meshes in scene
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible) {
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
  }, [scene, onSelectObject]);

  // Handle mouse events for orbit controls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    mouseRef.current.set(x, y);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 0) {
      // Left click - select object (Ctrl+click for multi-select)
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
  }, [handleClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !editorCameraRef.current || !scene) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

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
  }, [scene, isRotating, isPanning, updateCameraPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsRotating(false);
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


  // Render loop
  useEffect(() => {
    if (!scene || !editorCameraRef.current || !rendererRef.current) return;

    const render = () => {
      if (!scene || !editorCameraRef.current || !rendererRef.current) return;

      rendererRef.current.render(scene, editorCameraRef.current);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scene]);

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
           isRotating ? 'Orbiting (Right-click)' :
           isPanning ? 'Panning (Middle-click)' :
           'Left: Select | Ctrl+Left: Multi-select | Right: Orbit | Middle: Pan'}
        </div>
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

