import { Competence } from './data/CompetenceData';

/**
 * Tracks competences that are actively being used within their XP timeframes
 * Used for video game XP distribution: when failing, distribute XP among all active competences
 * 
 * IMPORTANT: CTs should be marked as active WHEN THEY ARE USED IN GAMEPLAY (e.g., swinging weapon,
 * running, jumping, talking, tracking), NOT just when failures occur. This allows the XP system
 * to distribute marks across all competences that were actively engaged during the action.
 * 
 * XP TIMEFRAME MECHANISM:
 * - Each CT has its own independent 2-second XP timeframe (default)
 * - When a CT is used (marked active), it can gain XP for 2 seconds (xpTimeframe)
 * - If the CT is used again within that 2 seconds, the timer RESETS (extends to another 2 seconds from that point)
 * - Multiple CTs can be active simultaneously, each with their own independent timeframe
 * - Example: Jumping uses [Saut] (becomes active for 2s). If you jump again after 1s, [Saut] can gain XP for another 2s from that point
 * 
 * Example usage:
 * - When character swings weapon: markActive(Competence.ARME) → [Armé] active for 2s (can gain XP)
 * - When character runs: markActive(Competence.PAS) → [Pas] active for 2s (can gain XP)
 * - When character jumps: markActive(Competence.SAUT) → [Saut] active for 2s (can gain XP)
 * - When multiple actions occur: markActiveMultiple([Competence.PAS, Competence.ARME]) → Both active for 2s
 */
export class ActiveCompetencesTracker {
  private activeCompetences: Map<Competence, number>; // competence -> timestamp when it was last marked active
  private xpTimeframe: number; // XP timeframe in milliseconds - each CT can gain XP for this duration after being used

  constructor(xpTimeframe: number = 2000) {
    // Default 2 seconds - each CT can gain XP for 2 seconds after being used
    // When a CT is used again, the timer resets to another 2 seconds from that point
    // Multiple CTs can be active simultaneously, each with their own independent 2-second XP timeframe
    this.activeCompetences = new Map();
    this.xpTimeframe = xpTimeframe;
  }

  /**
   * Mark a competence as active (currently being used in gameplay)
   * 
   * This RESETS the competence's XP timeframe - it can now gain XP for the next xpTimeframe milliseconds.
   * If the competence was already active, this extends/resets its XP timeframe.
   * 
   * Call this method WHEN a competence is being used, not just on failure.
   * Examples:
   * - markActive(Competence.PAS) when character is walking/running → [Pas] can gain XP for 2s
   * - markActive(Competence.ARME) when character swings a weapon → [Armé] can gain XP for 2s
   * - markActive(Competence.SAUT) when character jumps → [Saut] can gain XP for 2s
   * - If you jump again after 1s → [Saut]'s XP timeframe resets to another 2s from that point
   * 
   * @param competence The competence being used
   * @param timestamp Optional timestamp (defaults to current time)
   */
  markActive(competence: Competence, timestamp: number = Date.now()): void {
    // Setting the timestamp resets the XP timeframe for this competence
    // If already active, this extends/resets the timer to another xpTimeframe milliseconds
    this.activeCompetences.set(competence, timestamp);
    this.cleanupOld(timestamp);
  }

  /**
   * Mark multiple competences as active at once
   * 
   * This RESETS the XP timeframe for all specified competences - each can gain XP for the next xpTimeframe milliseconds.
   * Useful when multiple CTs are used simultaneously (e.g., swinging weapon while running).
   * 
   * @param competences Array of competences being used
   * @param timestamp Optional timestamp (defaults to current time)
   */
  markActiveMultiple(competences: Competence[], timestamp: number = Date.now()): void {
    // Reset XP timeframe for all specified competences
    competences.forEach(comp => {
      this.activeCompetences.set(comp, timestamp);
    });
    this.cleanupOld(timestamp);
  }

  /**
   * Get all competences that are currently active (within their XP timeframes)
   * A competence is active if it was used within the last xpTimeframe milliseconds.
   * Each competence has its own independent XP timeframe.
   * 
   * @param currentTime Current timestamp (defaults to now)
   * @returns Array of active competences that can currently gain XP
   */
  getActiveCompetences(currentTime: number = Date.now()): Competence[] {
    this.cleanupOld(currentTime);
    return Array.from(this.activeCompetences.keys());
  }

  /**
   * Clear all active competences
   */
  clear(): void {
    this.activeCompetences.clear();
  }

  /**
   * Remove competences whose XP timeframes have expired
   * Each competence's XP timeframe is independent - expires xpTimeframe milliseconds after it was last used
   */
  private cleanupOld(currentTime: number): void {
    const cutoff = currentTime - this.xpTimeframe;
    for (const [competence, timestamp] of this.activeCompetences.entries()) {
      if (timestamp < cutoff) {
        // This competence's XP timeframe has expired - it can no longer gain XP until used again
        this.activeCompetences.delete(competence);
      }
    }
  }

  /**
   * Set the XP timeframe for all competences (how long after being used they can gain XP)
   * @param ms XP timeframe in milliseconds (default: 2000ms = 2 seconds)
   */
  setXpTimeframe(ms: number): void {
    this.xpTimeframe = ms;
  }

  /**
   * Get the current XP timeframe
   * @returns XP timeframe in milliseconds
   */
  getXpTimeframe(): number {
    return this.xpTimeframe;
  }

  /**
   * Get all active competences with their remaining time (for UI display)
   * @param currentTime Current timestamp (defaults to now)
   * @returns Array of objects with competence and remaining time in milliseconds
   */
  getActiveCompetencesWithRemainingTime(currentTime: number = Date.now()): Array<{ competence: Competence; remainingTime: number }> {
    this.cleanupOld(currentTime);
    const result: Array<{ competence: Competence; remainingTime: number }> = [];
    
    for (const [competence, timestamp] of this.activeCompetences.entries()) {
      const elapsed = currentTime - timestamp;
      const remainingTime = Math.max(0, this.xpTimeframe - elapsed);
      result.push({ competence, remainingTime });
    }
    
    // Sort by remaining time (most time remaining first)
    result.sort((a, b) => b.remainingTime - a.remainingTime);
    
    return result;
  }
}

