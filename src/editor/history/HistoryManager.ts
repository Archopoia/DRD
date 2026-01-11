/**
 * History Manager - Manages undo/redo functionality for the editor
 * Tracks all actions and allows jumping to any point in history
 */

export interface HistoryAction {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  data: any; // Action-specific data
  undo: () => void;
  redo: () => void;
}

export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  maxHistorySize: number;
}

/**
 * HistoryManager - Manages undo/redo stack
 */
export class HistoryManager {
  private state: HistoryState;
  private listeners: Set<(state: HistoryState) => void> = new Set();

  constructor(maxHistorySize: number = 100) {
    this.state = {
      actions: [],
      currentIndex: -1,
      maxHistorySize,
    };
  }

  /**
   * Add an action to history
   */
  addAction(action: HistoryAction): void {
    // Remove any actions after current index (when undoing and then doing new action)
    if (this.state.currentIndex < this.state.actions.length - 1) {
      this.state.actions = this.state.actions.slice(0, this.state.currentIndex + 1);
    }

    // Add new action
    this.state.actions.push(action);
    this.state.currentIndex = this.state.actions.length - 1;

    // Limit history size
    if (this.state.actions.length > this.state.maxHistorySize) {
      this.state.actions.shift();
      this.state.currentIndex--;
    }

    this.notifyListeners();
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    const action = this.state.actions[this.state.currentIndex];
    action.undo();
    this.state.currentIndex--;

    this.notifyListeners();
    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.state.currentIndex++;
    const action = this.state.actions[this.state.currentIndex];
    action.redo();

    this.notifyListeners();
    return true;
  }

  /**
   * Jump to a specific point in history
   */
  jumpToIndex(index: number): boolean {
    if (index < -1 || index >= this.state.actions.length) return false;

    const targetIndex = index;
    const currentIndex = this.state.currentIndex;

    if (targetIndex === currentIndex) return true;

    // If going backwards, undo actions
    if (targetIndex < currentIndex) {
      for (let i = currentIndex; i > targetIndex; i--) {
        this.state.actions[i].undo();
      }
    } else {
      // If going forwards, redo actions
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        this.state.actions[i].redo();
      }
    }

    this.state.currentIndex = targetIndex;
    this.notifyListeners();
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.state.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.state.currentIndex < this.state.actions.length - 1;
  }

  /**
   * Get current history state
   */
  getState(): HistoryState {
    return {
      ...this.state,
      actions: [...this.state.actions], // Return copy
    };
  }

  /**
   * Get actions for display
   */
  getActions(): HistoryAction[] {
    return [...this.state.actions];
  }

  /**
   * Get current index
   */
  getCurrentIndex(): number {
    return this.state.currentIndex;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.state = {
      actions: [],
      currentIndex: -1,
      maxHistorySize: this.state.maxHistorySize,
    };
    this.notifyListeners();
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: (state: HistoryState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

