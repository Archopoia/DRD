import * as THREE from 'three';
import { HistoryAction } from '../HistoryManager';
import { logHistory, logEditor } from '../../utils/debugLogger';

/**
 * Action creators for common editor operations
 */

export interface CreateObjectActionData {
  object: THREE.Object3D;
  scene: THREE.Scene;
}

export function createCreateObjectAction(
  object: THREE.Object3D,
  scene: THREE.Scene,
  description: string = `Create ${object.name || object.type}`
): HistoryAction {
  const actionId = `create_${object.uuid}_${Date.now()}`;
  logHistory('createCreateObjectAction: Created action', {
    id: actionId,
    description,
    objectName: object.name,
    objectType: object.type,
    objectUuid: object.uuid,
    position: object.position.toArray(),
    sceneChildrenCount: scene.children.length,
  });

  return {
    id: actionId,
    type: 'create_object',
    description,
    timestamp: Date.now(),
    data: { object, scene },
    undo: () => {
      logHistory('createCreateObjectAction: Undoing', {
        id: actionId,
        objectName: object.name,
        sceneChildrenBefore: scene.children.length,
      });
      scene.remove(object);
      // Dispose geometry and material if it's a mesh
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      logHistory('createCreateObjectAction: Undone', {
        id: actionId,
        sceneChildrenAfter: scene.children.length,
      });
    },
    redo: () => {
      logHistory('createCreateObjectAction: Redoing', {
        id: actionId,
        objectName: object.name,
        sceneChildrenBefore: scene.children.length,
      });
      scene.add(object);
      logHistory('createCreateObjectAction: Redone', {
        id: actionId,
        sceneChildrenAfter: scene.children.length,
      });
    },
  };
}

export interface DeleteObjectActionData {
  object: THREE.Object3D;
  scene: THREE.Scene;
  parent: THREE.Object3D | null;
  index: number;
}

export function createDeleteObjectAction(
  object: THREE.Object3D,
  scene: THREE.Scene,
  description: string = `Delete ${object.name || object.type}`
): HistoryAction {
  const parent = object.parent;
  const index = parent ? parent.children.indexOf(object) : -1;
  const actionId = `delete_${object.uuid}_${Date.now()}`;
  
  logHistory('createDeleteObjectAction: Created action', {
    id: actionId,
    description,
    objectName: object.name,
    objectType: object.type,
    objectUuid: object.uuid,
    parent: parent?.name || 'scene',
    index,
    sceneChildrenCount: scene.children.length,
  });

  return {
    id: actionId,
    type: 'delete_object',
    description,
    timestamp: Date.now(),
    data: { object, scene, parent, index },
    undo: () => {
      logHistory('createDeleteObjectAction: Undoing', {
        id: actionId,
        objectName: object.name,
        parent: parent?.name || 'scene',
        sceneChildrenBefore: scene.children.length,
      });
      if (parent) {
        parent.add(object);
      } else {
        scene.add(object);
      }
      logHistory('createDeleteObjectAction: Undone', {
        id: actionId,
        sceneChildrenAfter: scene.children.length,
      });
    },
    redo: () => {
      logHistory('createDeleteObjectAction: Redoing', {
        id: actionId,
        objectName: object.name,
        sceneChildrenBefore: scene.children.length,
      });
      scene.remove(object);
      logHistory('createDeleteObjectAction: Redone', {
        id: actionId,
        sceneChildrenAfter: scene.children.length,
      });
    },
  };
}

export interface TransformObjectActionData {
  object: THREE.Object3D;
  oldPosition: THREE.Vector3;
  oldRotation: THREE.Quaternion;
  oldScale: THREE.Vector3;
  newPosition: THREE.Vector3;
  newRotation: THREE.Quaternion;
  newScale: THREE.Vector3;
}

export function createTransformObjectAction(
  object: THREE.Object3D,
  oldPosition: THREE.Vector3,
  oldRotation: THREE.Quaternion,
  oldScale: THREE.Vector3,
  newPosition: THREE.Vector3,
  newRotation: THREE.Quaternion,
  newScale: THREE.Vector3,
  description: string = `Transform ${object.name || object.type}`
): HistoryAction {
  const actionId = `transform_${object.uuid}_${Date.now()}`;
  const data: TransformObjectActionData = {
    object,
    oldPosition: oldPosition.clone(),
    oldRotation: oldRotation.clone(),
    oldScale: oldScale.clone(),
    newPosition: newPosition.clone(),
    newRotation: newRotation.clone(),
    newScale: newScale.clone(),
  };

  console.log('[EditorActions] createTransformObjectAction: Created action', {
    id: actionId,
    description,
    objectName: object.name,
    objectType: object.type,
    objectUuid: object.uuid,
    oldPosition: data.oldPosition.toArray(),
    newPosition: data.newPosition.toArray(),
    oldRotation: data.oldRotation.toArray(),
    newRotation: data.newRotation.toArray(),
    oldScale: data.oldScale.toArray(),
    newScale: data.newScale.toArray(),
  });

  return {
    id: actionId,
    type: 'transform_object',
    description,
    timestamp: Date.now(),
    data,
    undo: () => {
      console.log('[EditorActions] createTransformObjectAction: Undoing', {
        id: actionId,
        objectName: object.name,
        targetPosition: data.oldPosition.toArray(),
      });
      object.position.copy(data.oldPosition);
      object.quaternion.copy(data.oldRotation);
      object.rotation.setFromQuaternion(data.oldRotation);
      object.scale.copy(data.oldScale);
      object.updateMatrix();
      object.updateMatrixWorld(true);
      console.log('[EditorActions] createTransformObjectAction: Undone', {
        id: actionId,
        actualPosition: object.position.toArray(),
      });
    },
    redo: () => {
      console.log('[EditorActions] createTransformObjectAction: Redoing', {
        id: actionId,
        objectName: object.name,
        targetPosition: data.newPosition.toArray(),
      });
      object.position.copy(data.newPosition);
      object.quaternion.copy(data.newRotation);
      object.rotation.setFromQuaternion(data.newRotation);
      object.scale.copy(data.newScale);
      object.updateMatrix();
      object.updateMatrixWorld(true);
      console.log('[EditorActions] createTransformObjectAction: Redone', {
        id: actionId,
        actualPosition: object.position.toArray(),
      });
    },
  };
}

export interface ReparentObjectActionData {
  object: THREE.Object3D;
  oldParent: THREE.Object3D | null;
  newParent: THREE.Object3D;
  oldWorldPosition: THREE.Vector3;
  oldWorldRotation: THREE.Quaternion;
  oldWorldScale: THREE.Vector3;
}

export function createReparentObjectAction(
  object: THREE.Object3D,
  oldParent: THREE.Object3D | null,
  newParent: THREE.Object3D,
  oldWorldPosition: THREE.Vector3,
  oldWorldRotation: THREE.Quaternion,
  oldWorldScale: THREE.Vector3,
  description: string = `Reparent ${object.name || object.type}`
): HistoryAction {
  const data: ReparentObjectActionData = {
    object,
    oldParent,
    newParent,
    oldWorldPosition: oldWorldPosition.clone(),
    oldWorldRotation: oldWorldRotation.clone(),
    oldWorldScale: oldWorldScale.clone(),
  };

  return {
    id: `reparent_${object.uuid}_${Date.now()}`,
    type: 'reparent_object',
    description,
    timestamp: Date.now(),
    data,
    undo: () => {
      // Remove from new parent
      newParent.remove(object);

      // Add to old parent
      if (oldParent) {
        oldParent.add(object);
      } else {
        // Add to scene
        const scene = object.parent?.parent || (object.parent as any);
        if (scene instanceof THREE.Scene) {
          scene.add(object);
        }
      }

      // Restore world transform
      const worldMatrix = new THREE.Matrix4();
      worldMatrix.compose(data.oldWorldPosition, data.oldWorldRotation, data.oldWorldScale);
      
      const parent = object.parent;
      if (parent) {
        parent.updateMatrixWorld(true);
        const parentMatrixInv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
        const localMatrix = new THREE.Matrix4().multiplyMatrices(parentMatrixInv, worldMatrix);
        
        const localPosition = new THREE.Vector3();
        const localRotation = new THREE.Quaternion();
        const localScale = new THREE.Vector3();
        localMatrix.decompose(localPosition, localRotation, localScale);
        
        object.position.copy(localPosition);
        object.quaternion.copy(localRotation);
        object.scale.copy(localScale);
        object.updateMatrix();
        object.updateMatrixWorld(true);
      }
    },
    redo: () => {
      // Store current world transform
      const currentWorldPosition = new THREE.Vector3();
      const currentWorldRotation = new THREE.Quaternion();
      const currentWorldScale = new THREE.Vector3();
      object.getWorldPosition(currentWorldPosition);
      object.getWorldQuaternion(currentWorldRotation);
      object.getWorldScale(currentWorldScale);

      // Remove from old parent
      if (oldParent) {
        oldParent.remove(object);
      } else {
        const scene = object.parent;
        if (scene instanceof THREE.Scene) {
          scene.remove(object);
        }
      }

      // Add to new parent
      newParent.updateMatrixWorld(true);
      newParent.add(object);

      // Restore world transform
      const worldMatrix = new THREE.Matrix4();
      worldMatrix.compose(currentWorldPosition, currentWorldRotation, currentWorldScale);
      const parentMatrixInv = new THREE.Matrix4().copy(newParent.matrixWorld).invert();
      const localMatrix = new THREE.Matrix4().multiplyMatrices(parentMatrixInv, worldMatrix);
      
      const localPosition = new THREE.Vector3();
      const localRotation = new THREE.Quaternion();
      const localScale = new THREE.Vector3();
      localMatrix.decompose(localPosition, localRotation, localScale);
      
      object.position.copy(localPosition);
      object.quaternion.copy(localRotation);
      object.scale.copy(localScale);
      object.updateMatrix();
      object.updateMatrixWorld(true);
    },
  };
}

export interface PropertyChangeActionData {
  object: THREE.Object3D;
  property: string;
  oldValue: any;
  newValue: any;
}

export function createPropertyChangeAction(
  object: THREE.Object3D,
  property: string,
  oldValue: any,
  newValue: any,
  description: string = `Change ${property} of ${object.name || object.type}`
): HistoryAction {
  const actionId = `property_${object.uuid}_${property}_${Date.now()}`;
  const data: PropertyChangeActionData = {
    object,
    property,
    oldValue,
    newValue,
  };

  logHistory('createPropertyChangeAction: Created action', {
    id: actionId,
    description,
    objectName: object.name,
    objectType: object.type,
    objectUuid: object.uuid,
    property,
    oldValue,
    newValue,
  });

  return {
    id: actionId,
    type: 'property_change',
    description,
    timestamp: Date.now(),
    data,
    undo: () => {
      logHistory('createPropertyChangeAction: Undoing', {
        id: actionId,
        objectName: object.name,
        property,
        targetValue: data.oldValue,
      });
      (object as any)[property] = data.oldValue;
      if (property === 'name') {
        // Name change doesn't need matrix update
      } else {
        object.updateMatrix();
        object.updateMatrixWorld(true);
      }
      logHistory('createPropertyChangeAction: Undone', {
        id: actionId,
        actualValue: (object as any)[property],
      });
    },
    redo: () => {
      logHistory('createPropertyChangeAction: Redoing', {
        id: actionId,
        objectName: object.name,
        property,
        targetValue: data.newValue,
      });
      (object as any)[property] = data.newValue;
      if (property === 'name') {
        // Name change doesn't need matrix update
      } else {
        object.updateMatrix();
        object.updateMatrixWorld(true);
      }
      logHistory('createPropertyChangeAction: Redone', {
        id: actionId,
        actualValue: (object as any)[property],
      });
    },
  };
}

