/**
 * Generate a unique ID (simple UUID-like implementation)
 */
function generateId(): string {
  return 'entity_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Entity - A container for components
 * Entities are simple IDs with a name and optional metadata
 */
export class Entity {
  public readonly id: string;
  public name: string;
  public active: boolean = true;
  public tags: Set<string> = new Set();
  public metadata: Record<string, any> = {};

  constructor(name: string = 'Entity', id?: string) {
    this.id = id || generateId();
    this.name = name;
  }

  /**
   * Add a tag to this entity
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Remove a tag from this entity
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }

  /**
   * Check if entity has a tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Clone entity (for prefabs/duplication)
   */
  clone(newId?: string): Entity {
    const cloned = new Entity(this.name, newId);
    cloned.active = this.active;
    cloned.tags = new Set(this.tags);
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}

