/**
 * Event Log System
 * Tracks and manages game world events for UI display
 */

export enum EventType {
  SOUFFRANCE_DAMAGE = 'SOUFFRANCE_DAMAGE',
  SOUFFRANCE_RESISTED = 'SOUFFRANCE_RESISTED',
  COMPETENCE_USE = 'COMPETENCE_USE',
  HEALTH_STATE_CHANGE = 'HEALTH_STATE_CHANGE',
  EXPERIENCE_GAIN = 'EXPERIENCE_GAIN',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export interface GameEvent {
  id: string;
  type: EventType;
  message: string;
  timestamp: number;
  data?: Record<string, any>; // Additional event data
}

type EventListener = (event: GameEvent) => void;

/**
 * Event Log Manager
 * Centralized system for tracking and broadcasting game events
 */
export class EventLog {
  private events: GameEvent[] = [];
  private listeners: Set<EventListener> = new Set();
  private maxEvents: number = 20; // Keep last 20 events

  /**
   * Add a new event to the log
   */
  addEvent(type: EventType, message: string, data?: Record<string, any>): void {
    const event: GameEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      data,
    };

    this.events.push(event);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Get recent events (most recent first)
   */
  getRecentEvents(count: number = 10): GameEvent[] {
    return this.events.slice(-count).reverse();
  }

  /**
   * Get all events
   */
  getAllEvents(): GameEvent[] {
    return [...this.events];
  }

  /**
   * Subscribe to new events
   */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Singleton instance
let eventLogInstance: EventLog | null = null;

/**
 * Get the global event log instance
 */
export function getEventLog(): EventLog {
  if (!eventLogInstance) {
    eventLogInstance = new EventLog();
  }
  return eventLogInstance;
}

