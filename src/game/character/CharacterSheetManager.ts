import { Attribute } from './data/AttributeData';
import { Aptitude, getAptitudeAttributes } from './data/AptitudeData';
import { Competence } from './data/CompetenceData';
import { Souffrance } from './data/SouffranceData';

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
  marks: boolean[]; // 10 marks
  eternalMarks: number;
  eternalMarkIndices: number[];
  masteries: MasteryData[];
}

export interface MasteryData {
  name: string;
  diceCount: number;
}

export interface SouffranceData {
  diceCount: number;
  marks: boolean[]; // 10 marks
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
        marks: new Array(10).fill(false),
        eternalMarks: 0,
        eternalMarkIndices: [],
        masteries: [],
      };
    });

    // Initialize all souffrances
    const souffrances: Record<Souffrance, SouffranceData> = {} as Record<Souffrance, SouffranceData>;
    Object.values(Souffrance).forEach((souf) => {
      souffrances[souf] = {
        diceCount: 0,
        marks: new Array(10).fill(false),
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
    return { ...this.state };
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
      
      // Simplified: ATB+3 = 6/10, ATB+2 = 3/10, ATB+1 = 1/10
      const atb3Contribution = Math.floor(atb1Value * 6 / 10);
      const atb2Contribution = Math.floor(atb2Value * 3 / 10);
      const atb1Contribution = Math.floor(atb3Value * 1 / 10);
      
      this.state.aptitudeLevels[aptitude] = atb3Contribution + atb2Contribution + atb1Contribution;
    });
  }

  getCompetence(competence: Competence): CompetenceData {
    return { ...this.state.competences[competence] };
  }

  setCompetenceDice(competence: Competence, diceCount: number): void {
    this.state.competences[competence].diceCount = Math.max(0, diceCount);
  }

  revealCompetence(competence: Competence): void {
    this.state.competences[competence].isRevealed = true;
  }

  addCompetenceMark(competence: Competence, isEternal: boolean = false): void {
    const comp = this.state.competences[competence];
    for (let i = 0; i < 10; i++) {
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
    return this.getTotalMarks(competence) >= 10;
  }

  realizeCompetence(competence: Competence): void {
    if (!this.isCompetenceEprouvee(competence)) return;
    
    const comp = this.state.competences[competence];
    comp.diceCount += 1;
    
    // Clear non-eternal marks
    for (let i = 0; i < 10; i++) {
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
}

