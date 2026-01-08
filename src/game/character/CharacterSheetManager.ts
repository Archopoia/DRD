import { Attribute } from './data/AttributeData';
import { Aptitude, getAptitudeAttributes } from './data/AptitudeData';
import { Competence } from './data/CompetenceData';
import { Souffrance } from './data/SouffranceData';
import { getMasteries } from './data/MasteryRegistry';

/**
 * Character Sheet State Manager
 * Manages all character sheet data and calculations
 */

export interface CharacterSheetState {
  // Attributes (8)
  attributes: Record<Attribute, number>;
  
  // Aptitudes (8) - calculated from attributes
  aptitudeLevels: Record<Aptitude, number>;
  
  // Competences (72) - dice count, marks, masteries
  competences: Record<Competence, CompetenceData>;
  
  // Souffrances (8) - dice count, marks
  souffrances: Record<Souffrance, SouffranceData>;
  
  // Experience system
  freeMarks: number;
}

export interface CompetenceData {
  diceCount: number;
  isRevealed: boolean;
  marks: boolean[]; // 100 marks
  eternalMarks: number;
  eternalMarkIndices: number[];
  masteries: MasteryData[];
  masteryPoints: number; // MT points - earned when gaining non-Niv dice (aside from first)
}

export interface MasteryData {
  name: string;
  diceCount: number;
}

export interface SouffranceData {
  diceCount: number; // Dés de Souffrance (DS) - accumulates when damage is taken
  resistanceDiceCount: number; // Dés de Résistance - only increases when realized (clicked when full)
  marks: boolean[]; // 100 marks (for resistance competence)
  eternalMarks: number;
  eternalMarkIndices: number[];
}

export class CharacterSheetManager {
  private state: CharacterSheetState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): CharacterSheetState {
    // Initialize all attributes to 0
    const attributes: Record<Attribute, number> = {
      [Attribute.FOR]: 0,
      [Attribute.AGI]: 0,
      [Attribute.DEX]: 0,
      [Attribute.VIG]: 0,
      [Attribute.EMP]: 0,
      [Attribute.PER]: 0,
      [Attribute.CRE]: 0,
      [Attribute.VOL]: 0,
    };

    // Initialize aptitude levels (will be calculated)
    const aptitudeLevels: Record<Aptitude, number> = {
      [Aptitude.PUISSANCE]: 0,
      [Aptitude.AISANCE]: 0,
      [Aptitude.PRECISION]: 0,
      [Aptitude.ATHLETISME]: 0,
      [Aptitude.CHARISME]: 0,
      [Aptitude.DETECTION]: 0,
      [Aptitude.REFLEXION]: 0,
      [Aptitude.DOMINATION]: 0,
    };

    // Initialize all competences
    const competences: Record<Competence, CompetenceData> = {} as Record<Competence, CompetenceData>;
    Object.values(Competence).forEach((comp) => {
      competences[comp] = {
        diceCount: 0,
        isRevealed: false,
        marks: new Array(100).fill(false),
        eternalMarks: 0,
        eternalMarkIndices: [],
        masteries: [],
        masteryPoints: 0, // Start with 0 mastery points
      };
    });

    // Initialize all souffrances
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.values(Souffrance).forEach((souf) => {
      souffrances[souf] = {
        diceCount: 0, // Souffrance dice (DS) - accumulates from damage
        resistanceDiceCount: 0, // Resistance competence dice - only increases on realization
        marks: new Array(100).fill(false),
        eternalMarks: 0,
        eternalMarkIndices: [],
      };
    });

    return {
      attributes,
      aptitudeLevels,
      competences,
      souffrances,
      freeMarks: 0,
    };
  }

  getState(): CharacterSheetState {
    // Create new objects for nested structures to ensure React detects changes
    const competences: Record<Competence, CompetenceData> = {} as Record<Competence, CompetenceData>;
    Object.keys(this.state.competences).forEach((key) => {
      const comp = this.state.competences[key as Competence];
      competences[key as Competence] = {
        ...comp,
        masteries: [...comp.masteries],
        marks: [...comp.marks],
        eternalMarkIndices: [...comp.eternalMarkIndices],
      };
    });
    
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.keys(this.state.souffrances).forEach((key) => {
      const souf = this.state.souffrances[key as Souffrance];
      souffrances[key as Souffrance] = {
        ...souf,
        marks: [...souf.marks],
        eternalMarkIndices: [...souf.eternalMarkIndices],
      };
    });
    
    return {
      ...this.state,
      competences,
      souffrances,
      aptitudeLevels: { ...this.state.aptitudeLevels },
      attributes: { ...this.state.attributes },
    };
  }

  setAttribute(attribute: Attribute, value: number): void {
    this.state.attributes[attribute] = Math.max(-50, Math.min(50, value));
    this.recalculateAptitudes();
  }

  getAttribute(attribute: Attribute): number {
    return this.state.attributes[attribute];
  }

  getAptitudeLevel(aptitude: Aptitude): number {
    return this.state.aptitudeLevels[aptitude];
  }

  private recalculateAptitudes(): void {
    // Simplified calculation - in full implementation, use AttributeCalculator
    // For now, use simple sum of weighted attributes
    Object.values(Aptitude).forEach((aptitude) => {
      const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
      const atb1Value = this.state.attributes[atb1];
      const atb2Value = this.state.attributes[atb2];
      const atb3Value = this.state.attributes[atb3];
      
      // Helper function to calculate contribution with proper rounding
      // For positive: floor division (rounds down)
      // For negative: truncate towards zero (so -0.6 becomes 0, not -1)
      const calculateContribution = (value: number, divisor: number): number => {
        if (value >= 0) {
          return Math.floor(value / divisor);
        } else {
          return Math.ceil(value / divisor);
        }
      };
      
      // ATB+3 = 6/10: -/+1 every -/+1.667 (10/6)
      const atb3Contribution = calculateContribution(atb1Value, 10 / 6);
      // ATB+2 = 3/10: -/+1 every -/+3.333 (10/3)
      const atb2Contribution = calculateContribution(atb2Value, 10 / 3);
      // ATB+1 = 1/10: -/+1 every -/+10 (10/1)
      const atb1Contribution = calculateContribution(atb3Value, 10 / 1);
      
      this.state.aptitudeLevels[aptitude] = atb3Contribution + atb2Contribution + atb1Contribution;
    });
  }

  getCompetence(competence: Competence): CompetenceData {
    return { ...this.state.competences[competence] };
  }

  setCompetenceDice(competence: Competence, diceCount: number): void {
    const comp = this.state.competences[competence];
    const oldDiceCount = comp.diceCount;
    const oldLevel = this.getCompetenceLevel(competence);
    
    comp.diceCount = Math.max(0, diceCount);
    
    // Check if we should earn a mastery point
    // Mastery points (MT) are earned at every non-Niv dice gained, aside from the first one
    if (diceCount > oldDiceCount) {
      const newLevel = this.getCompetenceLevel(competence);
      
      // Earn mastery point if:
      // 1. Level didn't change (non-Niv dice)
      // 2. It's not the first dice (oldDiceCount > 0)
      if (newLevel === oldLevel && oldDiceCount > 0) {
        comp.masteryPoints += 1;
      }
    }
  }

  revealCompetence(competence: Competence): void {
    this.state.competences[competence].isRevealed = true;
  }

  addCompetenceMark(competence: Competence, isEternal: boolean = false): void {
    const comp = this.state.competences[competence];
    for (let i = 0; i < 100; i++) {
      if (!comp.marks[i]) {
        comp.marks[i] = true;
        if (isEternal) {
          comp.eternalMarkIndices.push(i);
          comp.eternalMarks++;
        }
        return;
      }
    }
  }

  getCompetenceLevel(competence: Competence): number {
    const diceCount = this.state.competences[competence].diceCount;
    if (diceCount === 0) return 0;
    if (diceCount <= 2) return 1;
    if (diceCount <= 5) return 2;
    if (diceCount <= 9) return 3;
    if (diceCount <= 14) return 4;
    return 5;
  }

  getTotalMarks(competence: Competence): number {
    return this.state.competences[competence].marks.filter(m => m).length;
  }

  isCompetenceEprouvee(competence: Competence): boolean {
    return this.getTotalMarks(competence) >= 100;
  }

  realizeCompetence(competence: Competence): void {
    if (!this.isCompetenceEprouvee(competence)) return;
    
    const comp = this.state.competences[competence];
    const oldDiceCount = comp.diceCount;
    const oldLevel = this.getCompetenceLevel(competence);
    
    comp.diceCount += 1;
    
    // Check if we should earn a mastery point
    // Mastery points (MT) are earned at every non-Niv dice gained, aside from the first one
    const newLevel = this.getCompetenceLevel(competence);
    if (newLevel === oldLevel && oldDiceCount > 0) {
      comp.masteryPoints += 1;
    }
    
    // Clear non-eternal marks
    for (let i = 0; i < 100; i++) {
      if (!comp.eternalMarkIndices.includes(i)) {
        comp.marks[i] = false;
      }
    }
    
    // Gain free marks = current level
    const level = this.getCompetenceLevel(competence);
    this.state.freeMarks += level;
  }

  getFreeMarks(): number {
    return this.state.freeMarks;
  }

  addFreeMarks(amount: number): void {
    this.state.freeMarks += amount;
  }

  spendFreeMarks(amount: number): boolean {
    if (this.state.freeMarks >= amount) {
      this.state.freeMarks -= amount;
      return true;
    }
    return false;
  }

  getSouffrance(souffrance: Souffrance): SouffranceData {
    return { ...this.state.souffrances[souffrance] };
  }

  setSouffranceDice(souffrance: Souffrance, diceCount: number): void {
    this.state.souffrances[souffrance].diceCount = Math.max(0, diceCount);
  }

  /**
   * Add a mark to a souffrance (souffrances act as their own resistance competences)
   */
  addSouffranceMark(souffrance: Souffrance, isEternal: boolean = false): void {
    const souf = this.state.souffrances[souffrance];
    for (let i = 0; i < 100; i++) {
      if (!souf.marks[i]) {
        souf.marks[i] = true;
        if (isEternal) {
          souf.eternalMarkIndices.push(i);
          souf.eternalMarks++;
        }
        return;
      }
    }
  }

  /**
   * Get total marks for a souffrance
   */
  getTotalSouffranceMarks(souffrance: Souffrance): number {
    return this.state.souffrances[souffrance].marks.filter(m => m).length;
  }

  /**
   * Get souffrance level (Niv 0-5) based on dice count
   * Same calculation as competence level
   */
  getSouffranceLevel(souffrance: Souffrance): number {
    const diceCount = this.state.souffrances[souffrance].diceCount;
    if (diceCount === 0) return 0;
    if (diceCount <= 2) return 1;
    if (diceCount <= 5) return 2;
    if (diceCount <= 9) return 3;
    if (diceCount <= 14) return 4;
    return 5;
  }

  /**
   * Get resistance competence dice count
   * This is separate from souffrance dice count - only increases on realization
   */
  getResistanceDiceCount(souffrance: Souffrance): number {
    return this.state.souffrances[souffrance].resistanceDiceCount;
  }

  /**
   * Get resistance competence level (Niv 0-5) based on resistance dice count
   * This is separate from souffrance dice count - only increases on realization
   */
  getResistanceLevel(souffrance: Souffrance): number {
    const diceCount = this.state.souffrances[souffrance].resistanceDiceCount;
    if (diceCount === 0) return 0;
    if (diceCount <= 2) return 1;
    if (diceCount <= 5) return 2;
    if (diceCount <= 9) return 3;
    if (diceCount <= 14) return 4;
    return 5;
  }

  /**
   * Check if souffrance is éprouvée (10 marks total, minus eternal marks)
   */
  isSouffranceEprouvee(souffrance: Souffrance): boolean {
    const souf = this.state.souffrances[souffrance];
    const totalMarks = this.getTotalSouffranceMarks(souffrance);
    const requiredMarks = 10 - souf.eternalMarks;
    return totalMarks >= requiredMarks;
  }

  /**
   * Realize a souffrance resistance competence (gain +1 resistance dice when 10 marks reached, like competences)
   * This increases the resistance competence dice, NOT the souffrance dice
   */
  realizeSouffrance(souffrance: Souffrance): void {
    if (!this.isSouffranceEprouvee(souffrance)) return;
    
    const souf = this.state.souffrances[souffrance];
    const oldResistanceDiceCount = souf.resistanceDiceCount;
    const oldLevel = this.getResistanceLevel(souffrance);
    
    // +1 dice to resistance competence (NOT souffrance dice)
    souf.resistanceDiceCount += 1;
    
    // Clear non-eternal marks
    for (let i = 0; i < 100; i++) {
      if (!souf.eternalMarkIndices.includes(i)) {
        souf.marks[i] = false;
      }
    }
    
    // Gain free marks = current resistance level (same as competence realization)
    const level = this.getResistanceLevel(souffrance);
    this.state.freeMarks += level;
  }

  /**
   * Get mastery points (MT) for a competence
   */
  getMasteryPoints(competence: Competence): number {
    return this.state.competences[competence].masteryPoints;
  }

  /**
   * Unlock a mastery by spending a mastery point
   * Unlocks with +1 dice automatically
   * @param competence The competence
   * @param masteryName The name of the mastery to unlock
   * @returns true if successful, false if insufficient points or invalid mastery
   */
  unlockMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    
    // Check if we have mastery points available
    if (comp.masteryPoints <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cannot unlock mastery: No mastery points available', {
          competence,
          masteryName,
          points: comp.masteryPoints
        });
      }
      return false;
    }
    
    // Verify the mastery is valid for this competence
    const availableMasteries = getMasteries(competence);
    if (!availableMasteries.includes(masteryName)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cannot unlock mastery: Invalid mastery for competence', {
          competence,
          masteryName,
          available: availableMasteries
        });
      }
      return false;
    }
    
    // Check if this mastery is already unlocked
    if (comp.masteries.some(m => m.name === masteryName)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cannot unlock mastery: Already unlocked', {
          competence,
          masteryName,
          unlocked: comp.masteries.map(m => m.name)
        });
      }
      return false;
    }
    
    // Create a new competence object with updated masteries and points
    // This ensures React detects the change
    this.state.competences[competence] = {
      ...comp,
      masteryPoints: comp.masteryPoints - 1,
      masteries: [...comp.masteries, {
        name: masteryName,
        diceCount: 1, // Start with +1 dice when unlocked
      }]
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Mastery unlocked successfully', {
        competence,
        masteryName,
        remainingPoints: this.state.competences[competence].masteryPoints,
        totalMasteries: this.state.competences[competence].masteries.length
      });
    }
    
    return true;
  }

  /**
   * Upgrade an existing mastery by spending a mastery point
   * Increases the mastery's dice count by 1 (up to competence level)
   * @param competence The competence
   * @param masteryName The name of the mastery to upgrade
   * @returns true if successful, false if insufficient points or invalid mastery
   */
  upgradeMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    
    // Check if we have mastery points available
    if (comp.masteryPoints <= 0) {
      return false;
    }
    
    // Find the mastery
    const mastery = comp.masteries.find(m => m.name === masteryName);
    if (!mastery) {
      return false;
    }
    
    // Check if we can upgrade (dice count must be less than competence level)
    const maxDice = this.getCompetenceLevel(competence);
    if (mastery.diceCount >= maxDice) {
      return false;
    }
    
    // Spend a mastery point and increase dice count
    comp.masteryPoints -= 1;
    mastery.diceCount += 1;
    
    return true;
  }

  /**
   * Remove a mastery (refund the mastery point)
   * @param competence The competence
   * @param masteryName The name of the mastery to remove
   */
  removeMastery(competence: Competence, masteryName: string): boolean {
    const comp = this.state.competences[competence];
    const index = comp.masteries.findIndex(m => m.name === masteryName);
    
    if (index === -1) {
      return false;
    }
    
    // Remove the mastery and refund the point
    comp.masteries.splice(index, 1);
    comp.masteryPoints += 1;
    
    return true;
  }
}

