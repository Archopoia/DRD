import { Souffrance, getSouffranceName, getSouffranceAttribute, getResistanceCompetenceName } from './data/SouffranceData';
import { Competence, getCompetenceName } from './data/CompetenceData';
import { CharacterSheetManager } from './CharacterSheetManager';
import { Debug } from '../utils/debug';
import { getEventLog, EventType } from '../utils/EventLog';

/**
 * Health state based on total souffrance dice count
 */
export enum HealthState {
  NORMAL = 'NORMAL',           // 0-14 total DS
  RAGE = 'RAGE',               // 10-14 total DS (overlaps with normal)
  UNCONSCIOUS = 'UNCONSCIOUS', // 15-20 total DS
  DEFEATED = 'DEFEATED',       // 21-25 total DS (Coma/Madness)
  DEATH = 'DEATH',             // 26+ total DS
}

/**
 * Séquelle (Sequela) type based on souffrance level
 */
export enum SequeleType {
  NONE = 'NONE',               // 0-2 DS
  PASSAGERE = 'PASSAGERE',     // 3-5 DS (Temporary)
  DURABLE = 'DURABLE',         // 6-9 DS (Durable)
  PERMANENTE = 'PERMANENTE',   // 10-14 DS (Permanent)
  FATALE = 'FATALE',           // 15-20 DS (Fatal)
  VAINCU = 'VAINCU',           // 21-25 DS (Defeated)
  MORT = 'MORT',               // 26+ DS (Death)
}

/**
 * Resistance Competence System
 * 
 * Each Souffrance IS its own resistance competence, named R[Blessures], R[Fatigues], etc.
 * The souffrance itself (with its niveau/level from dice count) is used to resist damage.
 * 
 * Key distinction:
 * - **Souffrance dice (DS)**: The actual damage/negative dice you have (e.g., "3 DS Blessures")
 * - **Resistance competence R[Souffrance]**: The competence that resists damage (e.g., "R[Blessures] Niv 2")
 * 
 * So when resisting Blessures damage, you use R[Blessures] competence level (Niv from dice count).
 * When resisting Fatigues damage, you use R[Fatigues] competence level, etc.
 * 
 * Each souffrance acts as its own resistance competence - there are no separate
 * ROBUSTESSE, SATIETE, RECTITUDE, or IMMUNITE competences.
 */

/**
 * Souffrance Health System
 * Manages 8 souffrance types, total health state, and experience integration
 */
export class SouffranceHealthSystem {
  private characterSheetManager: CharacterSheetManager;
  private lastHealthState: HealthState;

  constructor(characterSheetManager: CharacterSheetManager) {
    this.characterSheetManager = characterSheetManager;
    this.lastHealthState = this.getHealthState();
  }

  /**
   * Get total souffrance dice across all 8 types
   */
  getTotalSouffrance(): number {
    let total = 0;
    Object.values(Souffrance).forEach((souffrance) => {
      const souffranceData = this.characterSheetManager.getSouffrance(souffrance);
      total += souffranceData.diceCount;
    });
    return Math.round(total * 10) / 10; // Round to 1 decimal to avoid floating point errors
  }

  /**
   * Get current health state based on total souffrance
   */
  getHealthState(): HealthState {
    const total = this.getTotalSouffrance();
    
    if (total >= 26) {
      return HealthState.DEATH;
    } else if (total >= 21) {
      return HealthState.DEFEATED;
    } else if (total >= 15) {
      return HealthState.UNCONSCIOUS;
    } else if (total >= 10) {
      return HealthState.RAGE;
    }
    return HealthState.NORMAL;
  }

  /**
   * Get séquelle type for a specific souffrance
   */
  getSequeleType(souffrance: Souffrance): SequeleType {
    const souffranceData = this.characterSheetManager.getSouffrance(souffrance);
    const diceCount = souffranceData.diceCount;

    if (diceCount >= 26) {
      return SequeleType.MORT;
    } else if (diceCount >= 21) {
      return SequeleType.VAINCU;
    } else if (diceCount >= 15) {
      return SequeleType.FATALE;
    } else if (diceCount >= 10) {
      return SequeleType.PERMANENTE;
    } else if (diceCount >= 6) {
      return SequeleType.DURABLE;
    } else if (diceCount >= 3) {
      return SequeleType.PASSAGERE;
    }
    return SequeleType.NONE;
  }

  /**
   * Get souffrance level (Niv 0-5) based on dice count
   * Same as competence level calculation
   */
  getSouffranceLevel(souffrance: Souffrance): number {
    const souffranceData = this.characterSheetManager.getSouffrance(souffrance);
    const diceCount = souffranceData.diceCount;
    
    if (diceCount === 0) return 0;
    if (diceCount <= 2) return 1;
    if (diceCount <= 5) return 2;
    if (diceCount <= 9) return 3;
    if (diceCount <= 14) return 4;
    return 5;
  }

  /**
   * Apply souffrance from a competence failure
   * This is the main method that links suffering to experience
   * 
   * @param souffrance The type of souffrance to apply
   * @param diceAmount The amount of DS to apply (before resistance)
   * @param usedCompetence The competence that was being used when the failure occurred
   * @returns The actual amount of DS applied (after resistance)
   */
  applySouffranceFromFailure(
    souffrance: Souffrance,
    diceAmount: number,
    usedCompetence: Competence
  ): number {
    if (diceAmount <= 0) {
      return 0;
    }

    Debug.log('SouffranceHealthSystem', `Applying ${diceAmount} DS of ${getSouffranceName(souffrance)} (resisted by ${getResistanceCompetenceName(souffrance)}) from failure using ${usedCompetence}`);

    // Calculate resistance
    // The souffrance has a separate resistance competence
    // Resistance level = resistance competence level (Niv from resistance dice count, not souffrance dice)
    const resistanceLevel = this.characterSheetManager.getResistanceLevel(souffrance);
    
    // Resistance is much weaker - only absorbs a small fraction per level
    // At Niv 1: absorbs 0.1 DS (10%), Niv 2: 0.2 DS (20%), etc.
    // Resistance becomes more effective at higher levels, but never fully negates damage
    const absorbedAmountRaw = Math.min(diceAmount * 0.1 * resistanceLevel, diceAmount * 0.5); // Max 50% absorption even at high levels
    const absorbedAmount = Math.round(absorbedAmountRaw * 10) / 10; // Round to 1 decimal
    const actualDamageRaw = Math.max(0, diceAmount - absorbedAmount);
    const actualDamage = Math.round(actualDamageRaw * 10) / 10; // Round to 1 decimal

    Debug.log('SouffranceHealthSystem', `Applying ${diceAmount.toFixed(1)} DS of ${getSouffranceName(souffrance)}, ${getResistanceCompetenceName(souffrance)} Niv ${resistanceLevel} absorbed ${absorbedAmount.toFixed(1)}, actual damage ${actualDamage.toFixed(1)}`);

    // Apply the actual damage (after resistance)
    if (actualDamage > 0) {
      const currentDice = this.characterSheetManager.getSouffrance(souffrance).diceCount;
      const newDiceCount = Math.round((currentDice + actualDamage) * 10) / 10; // Round to 1 decimal
      this.characterSheetManager.setSouffranceDice(souffrance, newDiceCount);
      
      // Check for health state changes
      this.checkHealthStateChange();
    }

    // Gain experience marks and log events
    const eventLog = getEventLog();
    const souffranceName = getSouffranceName(souffrance);
    const resistanceName = getResistanceCompetenceName(souffrance);
    const currentDiceAfter = this.characterSheetManager.getSouffrance(souffrance).diceCount;
    
    // Mark 1: Competence used (1 mark for failure)
    // According to rules: "1 Marque par Échec dans une Épreuve Possible"
    this.characterSheetManager.addCompetenceMark(usedCompetence, false);
    eventLog.addEvent(
      EventType.EXPERIENCE_GAIN,
      `Gained 1 mark on ${getCompetenceName(usedCompetence)} (used while suffering)`,
      { competence: usedCompetence, marks: 1 }
    );
    Debug.log('SouffranceHealthSystem', `Gained 1 mark on used competence: ${usedCompetence}`);

    // Mark 2: Souffrance resistance (marks = actual damage taken, minimum 1)
    // According to rules: "Chaque Échec déterminé comme une Souffrance ET outrepassant votre Résistance liée, s'accumule en Dé NÉGATIFS liés à cette Souffrance ET en Marque d'expérience dans la CT y ayant résisté"
    // The resistance competence gains marks based on the actual damage taken (the suffering experienced)
    // Always gain at least 1 mark when suffering occurs (even if all damage is resisted)
    if (actualDamage > 0 || diceAmount > 0) {
      // Gain marks based on actual damage taken, minimum 1 mark
      const marksToAdd = Math.max(1, Math.ceil(actualDamage > 0 ? actualDamage : diceAmount * 0.1));
      for (let i = 0; i < marksToAdd; i++) {
        this.characterSheetManager.addSouffranceMark(souffrance, false);
      }
      eventLog.addEvent(
        EventType.EXPERIENCE_GAIN,
        `Gained ${marksToAdd} mark${marksToAdd > 1 ? 's' : ''} on ${resistanceName} (suffered ${actualDamage > 0 ? actualDamage.toFixed(1) : 'resisted'} DS)`,
        {
          resistanceCompetence: resistanceName,
          marks: marksToAdd,
          actualDamage: actualDamage,
        }
      );
      Debug.log('SouffranceHealthSystem', `Gained ${marksToAdd} marks on ${resistanceName}`);
    }
    
    // Log damage event if damage was applied
    if (actualDamage > 0) {
      eventLog.addEvent(
        EventType.SOUFFRANCE_DAMAGE,
        `+${actualDamage.toFixed(1)} DS ${souffranceName} (${currentDiceAfter.toFixed(1)} DS total)${usedCompetence === Competence.PAS ? ' - Stepping on platform' : ''}`,
        {
          souffrance: souffrance,
          damage: actualDamage,
          totalDice: currentDiceAfter,
        }
      );
    } else if (absorbedAmount >= diceAmount * 0.9) {
      // Only log resistance if most damage was resisted (90%+)
      eventLog.addEvent(
        EventType.SOUFFRANCE_RESISTED,
        `${resistanceName} resisted ${souffranceName} damage (${absorbedAmount.toFixed(1)}/${diceAmount.toFixed(1)} DS absorbed)`,
        {
          souffrance: souffrance,
          resisted: true,
          absorbed: absorbedAmount,
          total: diceAmount,
        }
      );
    }

    return actualDamage;
  }

  /**
   * Apply critical failure (5 marks + more severe suffering)
   * @param souffrance The type of souffrance to apply
   * @param diceAmount The amount of DS to apply
   * @param usedCompetence The competence that was being used
   * @returns The actual amount of DS applied
   */
  applyCriticalFailure(
    souffrance: Souffrance,
    diceAmount: number,
    usedCompetence: Competence
  ): number {
    Debug.log('SouffranceHealthSystem', `Critical failure! Applying ${diceAmount} DS of ${getSouffranceName(souffrance)}`);
    
    // Critical failure: 5 marks instead of 1
    // First apply normal marks (1 for failure)
    // Then add 4 more marks for critical failure (total 5)
    this.characterSheetManager.addCompetenceMark(usedCompetence, false);
    for (let i = 0; i < 4; i++) {
      this.characterSheetManager.addCompetenceMark(usedCompetence, false);
    }
    
    // Apply suffering (usually more severe for critical failures)
    return this.applySouffranceFromFailure(souffrance, diceAmount, usedCompetence);
  }


  /**
   * Get all souffrance dice counts as a record
   */
  getAllSouffranceDice(): Record<Souffrance, number> {
    const result: Record<Souffrance, number> = {} as Record<Souffrance, number>;
    Object.values(Souffrance).forEach((souffrance) => {
      const diceCount = this.characterSheetManager.getSouffrance(souffrance).diceCount;
      result[souffrance] = Math.round(diceCount * 10) / 10; // Round to 1 decimal
    });
    return result;
  }

  /**
   * Check for health state changes and emit events
   */
  private checkHealthStateChange(): void {
    const currentState = this.getHealthState();
    if (currentState !== this.lastHealthState) {
      const eventLog = getEventLog();
      const totalDS = this.getTotalSouffrance();
      
      let message = '';
      const totalDSRounded = Math.round(totalDS * 10) / 10; // Round to 1 decimal
      switch (currentState) {
        case HealthState.RAGE:
          message = `Entered RAGE state (${totalDSRounded.toFixed(1)} DS total) - Must roll to act against instinct`;
          break;
        case HealthState.UNCONSCIOUS:
          message = `Entered UNCONSCIOUS/DEMENTIA state (${totalDSRounded.toFixed(1)} DS total) - Must roll to act`;
          break;
        case HealthState.DEFEATED:
          message = `DEFEATED (${totalDSRounded.toFixed(1)} DS total) - Coma or Madness`;
          break;
        case HealthState.DEATH:
          message = `DEATH or LOST (${totalDSRounded.toFixed(1)} DS total)`;
          break;
        case HealthState.NORMAL:
          if (this.lastHealthState !== HealthState.NORMAL) {
            message = `Returned to NORMAL state (${totalDSRounded.toFixed(1)} DS total)`;
          }
          break;
      }

      if (message) {
        eventLog.addEvent(
          EventType.HEALTH_STATE_CHANGE,
          message,
          {
            previousState: this.lastHealthState,
            currentState,
            totalDS,
          }
        );
      }

      this.lastHealthState = currentState;
    }
  }

  /**
   * Get character sheet manager (for UI integration)
   */
  getCharacterSheetManager(): CharacterSheetManager {
    return this.characterSheetManager;
  }

  /**
   * Get health state description (for UI)
   */
  getHealthStateDescription(): string {
    const state = this.getHealthState();
    const total = this.getTotalSouffrance();
    
    switch (state) {
      case HealthState.NORMAL:
        return `Normal (${total} DS)`;
      case HealthState.RAGE:
        return `Rage (${total} DS) - Must roll to act against instinct`;
      case HealthState.UNCONSCIOUS:
        return `Unconscious/Dementia (${total} DS) - Must roll to act`;
      case HealthState.DEFEATED:
        return `Defeated (${total} DS) - Coma or Madness`;
      case HealthState.DEATH:
        return `Death or Lost (${total} DS)`;
      default:
        return `Unknown (${total} DS)`;
    }
  }

  /**
   * Check if character can act (not defeated/dead)
   */
  canAct(): boolean {
    const state = this.getHealthState();
    return state !== HealthState.DEFEATED && state !== HealthState.DEATH;
  }

}

