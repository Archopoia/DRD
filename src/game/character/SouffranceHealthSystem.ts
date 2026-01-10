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
   * According to rules (page 63 & 72):
   * - Each failure on the competence check = 1 mark on the competence used
   * - Each failure also causes suffering (1 DS per failure, typically)
   * - After resistance absorbs some suffering, the actual damage that goes through = marks on resistance competence
   * 
   * Example: Walk [Pas] vs DC +5, roll -2 = 7 failures
   * - 7 marks on [Pas] (the competence used)
   * - 7 failures = 7 Blessures
   * - R[Blessures] Niv +2 absorbs 2 Blessures
   * - 5 actual Blessures = 5 marks on R[Blessures]
   * 
   * @param souffrance The type of souffrance to apply
   * @param failures The number of failures on the competence check (each failure = 1 mark on used competence, and typically 1 DS of suffering)
   * @param usedCompetence The competence that was being used when the failure occurred
   * @returns The actual amount of DS applied (after resistance)
   */
  applySouffranceFromFailure(
    souffrance: Souffrance,
    failures: number,
    usedCompetence: Competence
  ): number {
    if (failures <= 0) {
      return 0;
    }

    // Each failure typically equals 1 DS of suffering
    // The suffering amount equals the number of failures (unless specified otherwise by the Révélateur)
    const diceAmount = failures;

    Debug.log('SouffranceHealthSystem', `Applying ${diceAmount} DS of ${getSouffranceName(souffrance)} (from ${failures} failures) (resisted by ${getResistanceCompetenceName(souffrance)}) from failure using ${usedCompetence}`);

    // Calculate resistance
    // The souffrance has a separate resistance competence
    // Resistance level = resistance competence level (Niv from resistance dice count, not souffrance dice)
    const resistanceLevel = this.characterSheetManager.getResistanceLevel(souffrance);
    
    // Resistance absorbs a number of DS equal to the resistance level
    // According to page 72: "Vous absorberez passivement un nombre de Souffrances égal à votre Niv de CT de Résistance liée au mal"
    // So if R[Blessures] is Niv 2, it absorbs 2 DS
    const absorbedAmount = Math.min(resistanceLevel, diceAmount);
    const actualDamage = diceAmount - absorbedAmount;

    Debug.log('SouffranceHealthSystem', `Applying ${diceAmount} DS of ${getSouffranceName(souffrance)}, ${getResistanceCompetenceName(souffrance)} Niv ${resistanceLevel} absorbed ${absorbedAmount}, actual damage ${actualDamage}`);

    // Gain experience marks FIRST (before applying damage)
    const eventLog = getEventLog();
    const souffranceName = getSouffranceName(souffrance);
    const resistanceName = getResistanceCompetenceName(souffrance);
    
    // Mark 1: Competence used - ALL failures give marks
    // According to page 63: "Pour chaque Échec obtenu lorsque vous vous éprouverez d'une Épreuve Possible, attribuez-vous 1 Marque à la CT utilisée"
    for (let i = 0; i < failures; i++) {
      this.characterSheetManager.addCompetenceMark(usedCompetence, false);
    }
    if (failures > 0) {
      eventLog.addEvent(
        EventType.EXPERIENCE_GAIN,
        `Gained ${failures} mark${failures > 1 ? 's' : ''} on ${getCompetenceName(usedCompetence)} (${failures} failure${failures > 1 ? 's' : ''} on check)`,
        { competence: usedCompetence, marks: failures }
      );
      Debug.log('SouffranceHealthSystem', `Gained ${failures} marks on used competence: ${usedCompetence}`);
    }

    // Mark 2: Souffrance resistance - only actual damage gives marks
    // According to page 72: "Chaque Échec déterminé comme une Souffrance ET outrepassant votre Résistance liée, s'accumule en Dé NÉGATIFS liés à cette Souffrance ET en Marque d'expérience dans la CT y ayant résisté"
    // The resistance competence gains marks equal to the actual damage taken (after resistance absorption)
    if (actualDamage > 0) {
      for (let i = 0; i < actualDamage; i++) {
        this.characterSheetManager.addSouffranceMark(souffrance, false);
      }
      eventLog.addEvent(
        EventType.EXPERIENCE_GAIN,
        `Gained ${actualDamage} mark${actualDamage > 1 ? 's' : ''} on ${resistanceName} (${actualDamage} DS after resistance, ${absorbedAmount}/${diceAmount} absorbed)`,
        {
          resistanceCompetence: resistanceName,
          marks: actualDamage,
          actualDamage: actualDamage,
          absorbed: absorbedAmount,
          total: diceAmount,
        }
      );
      Debug.log('SouffranceHealthSystem', `Gained ${actualDamage} marks on ${resistanceName} (actual damage after ${absorbedAmount} absorbed)`);
    } else if (absorbedAmount > 0) {
      // If all damage was resisted, still log it (but no marks gained since no actual damage)
      eventLog.addEvent(
        EventType.SOUFFRANCE_RESISTED,
        `${resistanceName} fully resisted ${souffranceName} (${absorbedAmount}/${diceAmount} DS absorbed)`,
        {
          souffrance: souffrance,
          resisted: true,
          absorbed: absorbedAmount,
          total: diceAmount,
        }
      );
    }

    // Apply the actual damage (after resistance)
    if (actualDamage > 0) {
      const currentDice = this.characterSheetManager.getSouffrance(souffrance).diceCount;
      const newDiceCount = Math.round((currentDice + actualDamage) * 10) / 10; // Round to 1 decimal
      this.characterSheetManager.setSouffranceDice(souffrance, newDiceCount);
      
      const currentDiceAfter = this.characterSheetManager.getSouffrance(souffrance).diceCount;
      
      // Log damage event
      eventLog.addEvent(
        EventType.SOUFFRANCE_DAMAGE,
        `+${actualDamage.toFixed(1)} DS ${souffranceName} (${currentDiceAfter.toFixed(1)} DS total)${usedCompetence === Competence.PAS ? ' - Stepping on platform' : ''}`,
        {
          souffrance: souffrance,
          damage: actualDamage,
          totalDice: currentDiceAfter,
        }
      );
      
      // Check for health state changes
      this.checkHealthStateChange();
    }

    return actualDamage;
  }

  /**
   * Apply critical failure (5 marks + more severe suffering)
   * According to page 63: "Lors d'un Échec Critique vous obtiendrez 5 M d'un coup"
   * 
   * @param souffrance The type of souffrance to apply
   * @param failures The number of failures on the check (but for critical failure, marks are 5 regardless)
   * @param usedCompetence The competence that was being used
   * @returns The actual amount of DS applied
   */
  applyCriticalFailure(
    souffrance: Souffrance,
    failures: number,
    usedCompetence: Competence
  ): number {
    Debug.log('SouffranceHealthSystem', `Critical failure! Applying ${failures} failures worth of ${getSouffranceName(souffrance)}`);
    
    const eventLog = getEventLog();
    
    // Critical failure: 5 marks on the competence, regardless of number of failures
    // According to page 63: "Lors d'un Échec Critique vous obtiendrez 5 M d'un coup (quel qu'en soit le nombre d'Échecs par rapport au Niv d'Épreuve)"
    for (let i = 0; i < 5; i++) {
      this.characterSheetManager.addCompetenceMark(usedCompetence, false);
    }
    eventLog.addEvent(
      EventType.EXPERIENCE_GAIN,
      `Critical failure! Gained 5 marks on ${getCompetenceName(usedCompetence)}`,
      { competence: usedCompetence, marks: 5, critical: true }
    );
    
    // Apply suffering (the failures still cause suffering as normal)
    return this.applySouffranceFromFailure(souffrance, failures, usedCompetence);
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

