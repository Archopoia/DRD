import { Souffrance, getSouffranceName, getSouffranceAttribute, getResistanceCompetenceName } from './data/SouffranceData';
import { Competence, getCompetenceName } from './data/CompetenceData';
import { CharacterSheetManager } from './CharacterSheetManager';
import { ActiveCompetencesTracker } from './ActiveCompetencesTracker';
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
  private activeCompetencesTracker: ActiveCompetencesTracker;
  private lastHealthState: HealthState;

  constructor(characterSheetManager: CharacterSheetManager, activeCompetencesTracker?: ActiveCompetencesTracker) {
    this.characterSheetManager = characterSheetManager;
    this.activeCompetencesTracker = activeCompetencesTracker || new ActiveCompetencesTracker(2000); // Default 2 second XP timeframe per CT
    this.lastHealthState = this.getHealthState();
  }

  /**
   * Get the active competences tracker (for marking competences as active from gameplay)
   */
  getActiveCompetencesTracker(): ActiveCompetencesTracker {
    return this.activeCompetencesTracker;
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
    
    // Mark 1: Compétence d'Action used - VIDEO GAME ADAPTATION
    // Distribute 3 marks per failure among all active competences (up to 3 competences)
    // Rules: 1 CT = 3 marks, 2 CTs = 1.5 marks each, 3 CTs = 1 mark each
    // Priority: If more than 3 CTs active, prioritize those with lowest degree count
    
    // Get currently active competences (from gameplay actions like walking, jumping, etc.)
    // Environmental damage should only distribute XP to competences that are already active from gameplay
    // The usedCompetence parameter is only for context/logging - we don't mark it as active here
    const activeCompetences = this.activeCompetencesTracker.getActiveCompetences();
    
    // Distribute marks among active competences
    this.characterSheetManager.distributeMarksToActiveCompetences(activeCompetences, failures, false);
    
    if (failures > 0) {
      // Show ALL active competences (should always include at least usedCompetence)
      const allActiveNames = activeCompetences.length > 0
        ? activeCompetences.map(c => getCompetenceName(c)).join(', ')
        : getCompetenceName(usedCompetence); // Fallback if somehow empty
      
      // Get the competences that actually received XP (up to 3, prioritized by lowest degree)
      const sortedCompetences = [...activeCompetences].sort((a, b) => {
        return this.characterSheetManager.getCompetenceDegree(a) - this.characterSheetManager.getCompetenceDegree(b);
      });
      const selectedCompetences = sortedCompetences.slice(0, 3);
      const numCompetences = selectedCompetences.length;
      const marksPerCT = numCompetences === 1 ? 3.0 : (numCompetences === 2 ? 1.5 : 1.0);
      const totalMarksPerFailure = 3.0;
      
      const selectedNames = numCompetences > 0
        ? selectedCompetences.map(c => getCompetenceName(c)).join(', ')
        : allActiveNames; // Fallback
      
      // Create detailed message showing all active CTs and which ones received XP
      // Format should clearly show: which CTs were active, which ones received XP, and how much each got
      const selectedNamesList = selectedCompetences.map(c => getCompetenceName(c)).join(', ');
      let message = '';
      
      if (numCompetences === 0) {
        // No active CTs - can happen if environmental damage occurs when no competences are active from gameplay
        message = `No active CTs. No XP distributed`;
      } else if (numCompetences === 1) {
        // Only one CT active and received XP
        message = `Active CTs: ${selectedNamesList}. Gained ${(totalMarksPerFailure * failures).toFixed(1)} marks total (${(marksPerCT * failures).toFixed(1)} marks to ${selectedNamesList})`;
      } else {
        // Multiple CTs active - show all that received XP clearly
        if (activeCompetences.length === selectedCompetences.length) {
          // All active CTs received XP (2-3 CTs) - show both CTs clearly
          message = `Active CTs: ${selectedNamesList}. Gained ${(totalMarksPerFailure * failures).toFixed(1)} marks total (${(marksPerCT * failures).toFixed(1)} marks each to ${selectedNamesList})`;
        } else {
          // More than 3 active CTs, only some were selected
          message = `Active CTs: ${allActiveNames} (${activeCompetences.length} total). Selected: ${selectedNamesList} (lowest degree). Gained ${(totalMarksPerFailure * failures).toFixed(1)} marks total (${(marksPerCT * failures).toFixed(1)} marks each to ${selectedNamesList})`;
        }
      }
      
      eventLog.addEvent(
        EventType.EXPERIENCE_GAIN,
        message,
        { 
          activeCompetences: activeCompetences, // All active competences
          selectedCompetences: selectedCompetences, // Competences that received XP
          competences: selectedCompetences, // For backward compatibility
          marks: totalMarksPerFailure * failures, 
          marksPerCT: marksPerCT * failures,
          failures: failures 
        }
      );
      Debug.log('SouffranceHealthSystem', `Active CTs: [${allActiveNames}]. Distributed ${totalMarksPerFailure * failures} marks (${marksPerCT * failures} per CT) among ${numCompetences} selected compétences: ${selectedNames}`);
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
   * Apply critical failure (5 marks per failure + more severe suffering)
   * According to page 63: "Lors d'un Échec Critique vous obtiendrez 5 M d'un coup"
   * VIDEO GAME ADAPTATION: 5 marks per failure, distributed among active competences
   * 
   * @param souffrance The type of souffrance to apply
   * @param failures The number of failures on the check (but for critical failure, marks are 5 per failure regardless)
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
    const souffranceName = getSouffranceName(souffrance);
    
    // Critical failure: 5 marks PER FAILURE distributed among active competences
    // According to page 63: "Lors d'un Échec Critique vous obtiendrez 5 M d'un coup"
    // VIDEO GAME ADAPTATION: Critical failure = 5 marks per failure (vs normal 3 marks per failure)
    
    // Mark the used competence as active FIRST
    this.activeCompetencesTracker.markActive(usedCompetence);
    
    // Get all active competences (now includes the one we just marked)
    const activeCompetences = this.activeCompetencesTracker.getActiveCompetences();
    
    // Distribute 5 marks per failure (instead of 3) among active competences
    // Same distribution rules: 1 CT = 5 marks per failure, 2 CTs = 2.5 each, 3 CTs = 1.67 each
    // Sort and select competences (prioritize lowest degree)
    const sortedCompetences = [...activeCompetences].sort((a, b) => {
      return this.characterSheetManager.getCompetenceDegree(a) - this.characterSheetManager.getCompetenceDegree(b);
    });
    const selectedCompetences = sortedCompetences.slice(0, 3);
    const numCompetences = selectedCompetences.length;
    let marksPerCT: number;
    if (numCompetences === 1) {
      marksPerCT = 5.0; // 5 marks per failure for 1 CT
    } else if (numCompetences === 2) {
      marksPerCT = 2.5; // 2.5 marks per failure each for 2 CTs
    } else {
      marksPerCT = 5.0 / 3.0; // ~1.67 marks per failure each for 3 CTs
    }
    
    // Distribute marks
    selectedCompetences.forEach(competence => {
      this.characterSheetManager.addPartialMarks(competence, marksPerCT * failures, false);
    });
    
    // Show ALL active competences in event log (should always include at least usedCompetence)
    const allActiveNames = activeCompetences.length > 0
      ? activeCompetences.map(c => getCompetenceName(c)).join(', ')
      : getCompetenceName(usedCompetence); // Fallback if somehow empty
    const selectedNames = selectedCompetences.length > 0
      ? selectedCompetences.map(c => getCompetenceName(c)).join(', ')
      : allActiveNames; // Fallback
    
    const totalMarks = marksPerCT * numCompetences * failures;
    
    // Create detailed message showing all active CTs
    let message = '';
    if (activeCompetences.length === 1) {
      // Only one active CT (just the used one, no others active)
      message = `Critical failure! Active CTs: ${allActiveNames}. Gained ${totalMarks.toFixed(1)} marks - ${(marksPerCT * failures).toFixed(1)} marks per CT`;
    } else if (activeCompetences.length <= 3) {
      // 2-3 active CTs, all receive XP
      message = `Critical failure! Active CTs: ${allActiveNames}. Gained ${totalMarks.toFixed(1)} marks distributed - ${(marksPerCT * failures).toFixed(1)} marks per CT`;
    } else {
      // More than 3 active CTs, show which were selected (prioritized by lowest degree)
      message = `Critical failure! Active CTs: ${allActiveNames} (${activeCompetences.length} total). Selected: ${selectedNames} (lowest degree). Gained ${totalMarks.toFixed(1)} marks distributed - ${(marksPerCT * failures).toFixed(1)} marks per CT`;
    }
    
    eventLog.addEvent(
      EventType.EXPERIENCE_GAIN,
      message,
      { 
        activeCompetences: activeCompetences,
        selectedCompetences: selectedCompetences,
        competences: selectedCompetences,
        marks: totalMarks, 
        failures: failures, 
        critical: true 
      }
    );
    Debug.log('SouffranceHealthSystem', `Critical failure! Active CTs: [${allActiveNames}]. Distributed ${totalMarks.toFixed(1)} marks among ${numCompetences} selected compétences: ${selectedNames}`);
    
    // Apply suffering (but don't call applySouffranceFromFailure as it would give marks again)
    // Just apply the suffering damage directly
    const degreeAmount = failures;
    const resistanceLevel = this.characterSheetManager.getResistanceLevel(souffrance);
    const absorbedAmount = Math.min(resistanceLevel, degreeAmount);
    const actualDamage = degreeAmount - absorbedAmount;

    if (actualDamage > 0) {
      const currentDice = this.characterSheetManager.getSouffrance(souffrance).degreeCount;
      const newDiceCount = Math.round((currentDice + actualDamage) * 10) / 10;
      this.characterSheetManager.setSouffranceDice(souffrance, newDiceCount);
      
      // Gain marks on resistance competence (actual damage gives marks)
      for (let i = 0; i < actualDamage; i++) {
        this.characterSheetManager.addSouffranceMark(souffrance, false);
      }
      const resistanceName = getResistanceCompetenceName(souffrance);
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
      
      const currentDiceAfter = this.characterSheetManager.getSouffrance(souffrance).degreeCount;
      eventLog.addEvent(
        EventType.SOUFFRANCE_DAMAGE,
        `+${actualDamage.toFixed(1)} DS ${souffranceName} (${currentDiceAfter.toFixed(1)} DS total) - Critical failure`,
        {
          souffrance: souffrance,
          damage: actualDamage,
          totalDice: currentDiceAfter,
        }
      );
      
      this.checkHealthStateChange();
    }

    return actualDamage;
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

