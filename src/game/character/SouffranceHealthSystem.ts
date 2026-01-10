import { Souffrance, getSouffranceName, getSouffranceAttribute, getResistanceCompetenceName } from './data/SouffranceData';
import { Competence, getCompetenceName } from './data/CompetenceData';
import { CharacterSheetManager } from './CharacterSheetManager';
import { Debug } from '../utils/debug';
import { getEventLog, EventType } from '../utils/EventLog';

/**
 * Health state based on total souffrance degree count
 */
export enum HealthState {
  NORMAL = 'NORMAL',           // 0-14 total DS (Degrees of Souffrance)
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
 * Compétence de Résistance System
 * 
 * Each Souffrance has its own resistance compétence (compétence de Résistance), named R[Blessures], R[Fatigues], etc.
 * These are compétences used to resist damage.
 * 
 * Key distinctions:
 * - **Souffrances**: The actual DS (Degrees of Souffrance) accumulated on top of character sheet (e.g., "3 DS Blessures")
 * - **Compétences de Résistance R[Souffrance]**: The compétences that resist damage (e.g., "R[Blessures] Niv 2")
 * 
 * So when resisting Blessures damage, you use R[Blessures] compétence level (Niv from degree count).
 * When resisting Fatigues damage, you use R[Fatigues] compétence level, etc.
 * 
 * R[Souffrance] are compétences de Résistance - they are compétences, nothing else.
 * There are no separate ROBUSTESSE, SATIETE, RECTITUDE, or IMMUNITE compétences.
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
   * Get total souffrance degrees (DS) across all 8 types
   */
  getTotalSouffrance(): number {
    let total = 0;
    Object.values(Souffrance).forEach((souffrance) => {
      const souffranceData = this.characterSheetManager.getSouffrance(souffrance);
      total += souffranceData.degreeCount;
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
    const degreeCount = souffranceData.degreeCount;

    if (degreeCount >= 26) {
      return SequeleType.MORT;
    } else if (degreeCount >= 21) {
      return SequeleType.VAINCU;
    } else if (degreeCount >= 15) {
      return SequeleType.FATALE;
    } else if (degreeCount >= 10) {
      return SequeleType.PERMANENTE;
    } else if (degreeCount >= 6) {
      return SequeleType.DURABLE;
    } else if (degreeCount >= 3) {
      return SequeleType.PASSAGERE;
    }
    return SequeleType.NONE;
  }

  /**
   * Get souffrance level (Niv 0-5) based on degree count
   * Same as compétence level calculation
   */
  getSouffranceLevel(souffrance: Souffrance): number {
    const souffranceData = this.characterSheetManager.getSouffrance(souffrance);
    const degreeCount = souffranceData.degreeCount;
    
    if (degreeCount === 0) return 0;
    if (degreeCount <= 2) return 1;
    if (degreeCount <= 5) return 2;
    if (degreeCount <= 9) return 3;
    if (degreeCount <= 14) return 4;
    return 5;
  }

  /**
   * Apply souffrance from a compétence failure
   * This is the main method that links suffering to experience
   * 
   * According to rules (page 63 & 72):
   * - Each failure on the compétence check = 1 mark on the compétence used
   * - Each failure also causes suffering (1 DS per failure, typically)
   * - After resistance absorbs some suffering, the actual damage that goes through = marks on resistance compétence
   * 
   * Example: Walk [Pas] vs DC +5, roll -2 = 7 failures
   * - 7 marks on [Pas] (the compétence d'Action used)
   * - 7 failures = 7 Blessures DS
   * - R[Blessures] compétence de Résistance Niv +2 absorbs 2 DS
   * - 5 actual Blessures DS = 5 marks on R[Blessures] compétence de Résistance
   * 
   * @param souffrance The type of souffrance to apply
   * @param failures The number of failures on the compétence check (each failure = 1 mark on used compétence, and typically 1 DS of suffering)
   * @param usedCompetence The compétence d'Action that was being used when the failure occurred
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
    const degreeAmount = failures;

    Debug.log('SouffranceHealthSystem', `Applying ${degreeAmount} DS of ${getSouffranceName(souffrance)} (from ${failures} failures) (resisted by ${getResistanceCompetenceName(souffrance)}) from failure using ${usedCompetence}`);

    // Calculate resistance
    // The souffrance has a separate resistance compétence (compétence de Résistance)
    // Resistance level = resistance compétence level (Niv from resistance degree count, not souffrance degree)
    const resistanceLevel = this.characterSheetManager.getResistanceLevel(souffrance);
    
    // Resistance absorbs a number of DS equal to the resistance level
    // According to page 72: "Vous absorberez passivement un nombre de Souffrances égal à votre Niv de CT de Résistance liée au mal"
    // So if R[Blessures] is Niv 2, it absorbs 2 DS
    const absorbedAmount = Math.min(resistanceLevel, degreeAmount);
    const actualDamage = degreeAmount - absorbedAmount;

    Debug.log('SouffranceHealthSystem', `Applying ${degreeAmount} DS of ${getSouffranceName(souffrance)}, ${getResistanceCompetenceName(souffrance)} Niv ${resistanceLevel} absorbed ${absorbedAmount}, actual damage ${actualDamage}`);

    // Gain experience marks FIRST (before applying damage)
    const eventLog = getEventLog();
    const souffranceName = getSouffranceName(souffrance);
    const resistanceName = getResistanceCompetenceName(souffrance);
    
    // Mark 1: Compétence d'Action used - ALL failures give marks
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
      Debug.log('SouffranceHealthSystem', `Gained ${failures} marks on used compétence d'Action: ${usedCompetence}`);
    }

    // Mark 2: Compétence de Résistance - only actual damage gives marks
    // According to page 72: "Chaque Échec déterminé comme une Souffrance ET outrepassant votre Résistance liée, s'accumule en Dé NÉGATIFS liés à cette Souffrance ET en Marque d'expérience dans la CT y ayant résisté"
    // The resistance compétence gains marks equal to the actual damage taken (after resistance absorption)
    if (actualDamage > 0) {
      for (let i = 0; i < actualDamage; i++) {
        this.characterSheetManager.addSouffranceMark(souffrance, false);
      }
      eventLog.addEvent(
        EventType.EXPERIENCE_GAIN,
        `Gained ${actualDamage} mark${actualDamage > 1 ? 's' : ''} on ${resistanceName} (${actualDamage} DS after resistance, ${absorbedAmount}/${degreeAmount} absorbed)`,
        {
          resistanceCompetence: resistanceName,
          marks: actualDamage,
          actualDamage: actualDamage,
          absorbed: absorbedAmount,
          total: degreeAmount,
        }
      );
      Debug.log('SouffranceHealthSystem', `Gained ${actualDamage} marks on ${resistanceName} compétence de Résistance (actual damage after ${absorbedAmount} absorbed)`);
    } else if (absorbedAmount > 0) {
      // If all damage was resisted, still log it (but no marks gained since no actual damage)
      eventLog.addEvent(
        EventType.SOUFFRANCE_RESISTED,
        `${resistanceName} fully resisted ${souffranceName} (${absorbedAmount}/${degreeAmount} DS absorbed)`,
        {
          souffrance: souffrance,
          resisted: true,
          absorbed: absorbedAmount,
          total: degreeAmount,
        }
      );
    }

    // Apply the actual damage (after resistance)
    if (actualDamage > 0) {
      const currentDegree = this.characterSheetManager.getSouffrance(souffrance).degreeCount;
      const newDegreeCount = Math.round((currentDegree + actualDamage) * 10) / 10; // Round to 1 decimal
      this.characterSheetManager.setSouffranceDegree(souffrance, newDegreeCount);
      
      const currentDegreeAfter = this.characterSheetManager.getSouffrance(souffrance).degreeCount;
      
      // Log damage event
      eventLog.addEvent(
        EventType.SOUFFRANCE_DAMAGE,
        `+${actualDamage.toFixed(1)} DS ${souffranceName} (${currentDegreeAfter.toFixed(1)} DS total)${usedCompetence === Competence.PAS ? ' - Stepping on platform' : ''}`,
        {
          souffrance: souffrance,
          damage: actualDamage,
          totalDegree: currentDegreeAfter,
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
   * @param usedCompetence The compétence d'Action that was being used
   * @returns The actual amount of DS applied
   */
  applyCriticalFailure(
    souffrance: Souffrance,
    failures: number,
    usedCompetence: Competence
  ): number {
    Debug.log('SouffranceHealthSystem', `Critical failure! Applying ${failures} failures worth of ${getSouffranceName(souffrance)}`);
    
    const eventLog = getEventLog();
    
    // Critical failure: 5 marks on the compétence d'Action, regardless of number of failures
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
   * Get all souffrance degree counts as a record
   */
  getAllSouffranceDegrees(): Record<Souffrance, number> {
    const result: Record<Souffrance, number> = {} as Record<Souffrance, number>;
    Object.values(Souffrance).forEach((souffrance) => {
      const degreeCount = this.characterSheetManager.getSouffrance(souffrance).degreeCount;
      result[souffrance] = Math.round(degreeCount * 10) / 10; // Round to 1 decimal
    });
    return result;
  }

  // Legacy alias for backwards compatibility during migration
  getAllSouffranceDice(): Record<Souffrance, number> {
    return this.getAllSouffranceDegrees();
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

