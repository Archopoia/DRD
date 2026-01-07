'use client';

import { useState, useEffect } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Attribute, getAttributeName, getAttributeAbbreviation } from '@/game/character/data/AttributeData';
import { Aptitude, getAptitudeName, getAptitudeAttributes } from '@/game/character/data/AptitudeData';
import { Action, getActionName, getActionAptitude, getActionLinkedAttribute } from '@/game/character/data/ActionData';
import { Competence, getCompetenceName, getCompetenceAction } from '@/game/character/data/CompetenceData';
import { Souffrance, getSouffranceName, getSouffranceAttribute } from '@/game/character/data/SouffranceData';
import { getMasteries } from '@/game/character/data/MasteryRegistry';

interface CharacterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterSheet({ isOpen, onClose }: CharacterSheetProps) {
  const [manager] = useState(() => new CharacterSheetManager());
  const [state, setState] = useState(manager.getState());
  const [expandedActions, setExpandedActions] = useState<Set<Action>>(new Set());
  const [expandedCompetences, setExpandedCompetences] = useState<Set<Competence>>(new Set());
  const [masterySelectionOpen, setMasterySelectionOpen] = useState<Competence | null>(null);

  useEffect(() => {
    const currentState = manager.getState();
    setState(currentState);
  }, [manager]);

  // Close mastery selection when clicking outside
  useEffect(() => {
    if (!masterySelectionOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mastery-selection-container')) {
        setMasterySelectionOpen(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [masterySelectionOpen]);

  if (!isOpen) return null;

  const handleAttributeChange = (attr: Attribute, value: number) => {
    manager.setAttribute(attr, value);
    setState(manager.getState());
  };

  const toggleAction = (action: Action) => {
    const newSet = new Set(expandedActions);
    if (newSet.has(action)) {
      newSet.delete(action);
    } else {
      newSet.add(action);
    }
    setExpandedActions(newSet);
  };

  const toggleCompetence = (comp: Competence) => {
    const newSet = new Set(expandedCompetences);
    if (newSet.has(comp)) {
      newSet.delete(comp);
    } else {
      newSet.add(comp);
    }
    setExpandedCompetences(newSet);
  };

  const revealCompetence = (comp: Competence) => {
    manager.revealCompetence(comp);
    setState(manager.getState());
  };

  // Get actions for an aptitude
  const getActionsForAptitude = (aptitude: Aptitude): Action[] => {
    return Object.values(Action).filter((action) => getActionAptitude(action) === aptitude);
  };

  // Get competences for an action
  const getCompetencesForAction = (action: Action): Competence[] => {
    return Object.values(Competence).filter((comp) => getCompetenceAction(comp) === action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col rounded-lg border-4 border-border-dark shadow-2xl animate-swing-in overflow-hidden"
        style={{
          background: `
            radial-gradient(#6100001f 3px, transparent 4px),
            radial-gradient(#6100001f 3px, transparent 4px),
            linear-gradient(45deg, transparent 74px, #78c9a3 75px, transparent 76px, transparent 109px),
            linear-gradient(-45deg, transparent 75px, #78c9a3 76px, transparent 77px, transparent 109px),
            #fffaec
          `,
          backgroundSize: '109px 109px, 109px 109px, 109px 109px, 109px 109px',
          backgroundPosition: '54px 55px, 0px 0px, 0px 0px, 0px 0px',
          boxShadow: `
            0 0 20px rgba(0, 0, 0, 0.5),
            inset 0 0 0 2px #ceb68d,
            inset 0 0 0 5px #ffebc6,
            0 0 40px rgba(100, 48, 48, 0.6)
          `
        }}
      >
        {/* Header */}
        <div 
          className="flex justify-between items-center px-6 py-4 border-b-[3px] border-border-dark relative z-10"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(100, 48, 48, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(100, 48, 48, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #643030b9 0%, #643030 100%)
            `,
            boxShadow: 'inset 0 0 0 2px #ceb68d'
          }}
        >
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(184, 134, 11, 0.1) 20px,
                rgba(184, 134, 11, 0.1) 21px
              )`
            }}
          />
          <h2 className="font-medieval text-3xl font-bold text-text-cream relative z-10 tracking-wide" style={{
            textShadow: '0 1px black, 0 2px rgb(19, 19, 19), 0 3px rgb(30, 30, 30), 0 4px rgb(50, 50, 50), 0 5px rgb(70, 70, 70), 0 6px #555'
          }}>
            Feuille de Personnage
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-theme text-text-cream border-2 border-border-dark rounded font-medieval font-semibold transition-all duration-300 relative z-10 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
            style={{
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px 5px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 0 0 1px #ffebc6';
            }}
          >
            Fermer (C)
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="character-sheet-content flex-1 overflow-y-auto p-8 relative z-10">

          {/* Attributes Row - 8 columns */}
          <section className="mb-8">
            <h3 className="font-medieval text-2xl text-text-dark mb-4 pb-2 border-b-2 border-border-dark">Attributs (ATB)</h3>
            <div className="grid grid-cols-8 gap-3">
              {Object.values(Attribute).map((attr) => (
                <div 
                  key={attr} 
                  className="bg-hover-bg border-2 border-border-tan rounded-lg p-3 text-center transition-all duration-300 hover:bg-parchment-light hover:border-gold-glow hover:-translate-y-0.5"
                  style={{
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 10px 4px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 2px #eacb66';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d';
                  }}
                >
                  <label className="block text-xs font-bold text-red-theme mb-2 uppercase tracking-wide">
                    {getAttributeAbbreviation(attr)}
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={state.attributes[attr]}
                    onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-2 bg-parchment-aged border-2 border-border-dark rounded text-text-dark font-medieval text-base font-semibold text-center transition-all duration-300 focus:outline-none focus:border-gold-glow focus:bg-parchment-light"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = '0 0 10px #ffebc6, inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  />
                  <div className="text-xs text-text-secondary mt-2 italic">
                    {getAttributeName(attr)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Free Marks */}
          <section className="mb-6 p-4 bg-yellow-theme-alpha border-[3px] border-border-dark rounded-lg text-center" style={{
            boxShadow: '0 0 0 1px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 1px #ceb68d'
          }}>
            <span className="font-medieval text-lg font-semibold text-text-dark mr-2">Marques Gratuites:</span>
            <span className="font-medieval text-3xl font-bold text-red-theme" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
              {state.freeMarks}
            </span>
          </section>

          {/* Aptitudes Section - 8 Columns Side by Side */}
          <section className="mt-8">
            <h3 className="font-medieval text-2xl text-text-dark mb-4 pb-2 border-b-2 border-border-dark">Aptitudes, Actions et Compétences</h3>
            <div className="grid grid-cols-8 gap-3">
              {Object.values(Aptitude).map((aptitude) => {
                const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
                const level = state.aptitudeLevels[aptitude];
                const actions = getActionsForAptitude(aptitude);
                
                return (
                  <div 
                    key={aptitude} 
                    className="bg-hover-bg border-2 border-border-tan rounded-lg p-3 transition-all duration-300 hover:bg-parchment-light hover:border-gold-glow"
                    style={{
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 10px 4px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 2px #eacb66';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d';
                    }}
                  >
                    {/* Aptitude Header */}
                    <div className="mb-3 pb-3 border-b-2 border-border-dark">
                      <div className="font-medieval text-sm font-bold text-red-theme text-center mb-1 uppercase tracking-wide">
                        {getAptitudeName(aptitude)}
                      </div>
                      <div className="text-xs text-text-secondary text-center mb-1">
                        {getAttributeAbbreviation(atb1)}+3, {getAttributeAbbreviation(atb2)}+2, {getAttributeAbbreviation(atb3)}+1
                      </div>
                      <div className="font-medieval text-xl font-bold text-text-dark text-center" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                        {level >= 0 ? '+' : ''}{level}
                      </div>
                    </div>

                    {/* Main Attribute Input */}
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-red-theme text-center mb-2 uppercase tracking-wide">
                        {getAttributeName(atb1).toUpperCase()}
                      </label>
                      <input
                        type="number"
                        min="-50"
                        max="50"
                        value={state.attributes[atb1]}
                        onChange={(e) => handleAttributeChange(atb1, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-parchment-aged border-2 border-border-dark rounded text-text-dark font-medieval text-base font-semibold text-center transition-all duration-300 focus:outline-none focus:border-gold-glow focus:bg-parchment-light"
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                        onFocus={(e) => {
                          e.target.style.boxShadow = '0 0 10px #ffebc6, inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                      />
                    </div>

                    {/* ATB Values Display */}
                    <div className="mb-3 text-xs space-y-1 pb-3 border-b border-border-tan">
                      <div className="flex justify-between">
                        <span>{getAttributeAbbreviation(atb1)}:</span>
                        <span>{Math.floor(state.attributes[atb1] * 6 / 10)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{getAttributeAbbreviation(atb2)}:</span>
                        <span>{Math.floor(state.attributes[atb2] * 3 / 10)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{getAttributeAbbreviation(atb3)}:</span>
                        <span>{Math.floor(state.attributes[atb3] * 1 / 10)}</span>
                      </div>
                    </div>

                    {/* Souffrance - Right under aptitude, above actions */}
                    <div className="mb-3 pb-3 border-b-2 border-border-dark">
                      {Object.values(Souffrance).map((souf) => {
                        const soufAttr = getSouffranceAttribute(souf);
                        if (soufAttr === atb1) {
                          const soufData = state.souffrances[souf];
                          const level = soufData.diceCount === 0 ? 0 :
                            soufData.diceCount <= 2 ? 1 :
                            soufData.diceCount <= 5 ? 2 :
                            soufData.diceCount <= 9 ? 3 :
                            soufData.diceCount <= 14 ? 4 : 5;
                          const totalMarks = soufData.marks.filter(m => m).length;
                          
                          return (
                            <div key={souf} className="text-xs bg-red-theme-alpha border-2 border-border-dark rounded p-2" style={{
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}>
                              <div className="font-bold text-text-cream mb-1">{getSouffranceName(souf)}</div>
                              <div className="text-text-cream mb-2 text-[0.7rem]">{soufData.diceCount} Dés | N{level} | {totalMarks}/10</div>
                              <input
                                type="number"
                                min="0"
                                value={soufData.diceCount}
                                onChange={(e) => {
                                  manager.setSouffranceDice(souf, parseInt(e.target.value) || 0);
                                  setState(manager.getState());
                                }}
                                className="w-full px-1 py-1 bg-parchment-aged border border-border-dark rounded text-text-dark font-medieval text-[0.7rem] text-center"
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Actions (3 per Aptitude) */}
                    <div className="space-y-1">
                      {actions.map((action) => {
                        const competences = getCompetencesForAction(action);
                        const isExpanded = expandedActions.has(action);
                        const linkedAttr = getActionLinkedAttribute(action);
                        
                        return (
                          <div key={action} className="bg-parchment-aged border border-border-tan rounded p-2 text-xs">
                            <button
                              onClick={() => toggleAction(action)}
                              className="w-full text-left flex items-center justify-between mb-1 font-medieval font-semibold text-text-dark transition-colors duration-300 hover:text-red-theme"
                            >
                              <span>
                                {isExpanded ? '▼' : '▶'} {getActionName(action)}
                              </span>
                              <span className="text-text-secondary">({getAttributeAbbreviation(linkedAttr)})</span>
                            </button>
                            
                            {isExpanded && (
                              <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-border-tan">
                                {competences.map((comp) => {
                                  const compData = state.competences[comp];
                                  const isCompExpanded = expandedCompetences.has(comp);
                                  const level = manager.getCompetenceLevel(comp);
                                  const totalMarks = manager.getTotalMarks(comp);
                                  
                                  return (
                                    <div key={comp} className="bg-hover-bg border border-border-tan rounded p-2 text-xs relative">
                                      {!compData.isRevealed ? (
                                        <button
                                          onClick={() => revealCompetence(comp)}
                                          className="w-full px-2 py-2 bg-teal-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-center transition-all duration-300 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
                                          style={{
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                          }}
                                        >
                                          Révéler {getCompetenceName(comp)}?
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => toggleCompetence(comp)}
                                            className="w-full text-left flex items-center justify-between mb-1 font-medieval font-semibold text-text-dark transition-colors duration-300 hover:text-red-theme"
                                          >
                                            <span className="text-xs">
                                              {isCompExpanded ? '▼' : '▶'} {getCompetenceName(comp)}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                              {compData.diceCount}D N{level} {totalMarks}/10
                                            </span>
                                          </button>
                                          
                                          {isCompExpanded && (
                                            <div className="mt-1 space-y-1 pt-1 border-t border-border-tan">
                                              <div className="flex gap-2 items-center">
                                                <label className="text-xs">Dés:</label>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={compData.diceCount}
                                                  onChange={(e) => {
                                                    manager.setCompetenceDice(comp, parseInt(e.target.value) || 0);
                                                    setState(manager.getState());
                                                  }}
                                                  className="w-12 px-1 py-1 bg-parchment-aged border border-border-dark rounded text-text-dark font-medieval text-xs text-center"
                                                />
                                              </div>
                                              
                                              {manager.isCompetenceEprouvee(comp) && (
                                                <button
                                                  onClick={() => {
                                                    manager.realizeCompetence(comp);
                                                    setState(manager.getState());
                                                  }}
                                                  className="w-full px-2 py-2 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
                                                  style={{
                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                  }}
                                                >
                                                  Réaliser (+{level})
                                                </button>
                                              )}
                                              
                                              {/* Mastery Points Display */}
                                              <div className="text-xs mb-2">
                                                <span className="text-orange-theme font-bold">
                                                  Points MT: {manager.getMasteryPoints(comp)}
                                                </span>
                                              </div>
                                              
                                              {/* Masteries Section */}
                                              <div className="space-y-1 mt-2 pt-2 border-t border-border-tan">
                                                <div className="text-xs font-bold text-text-dark mb-2">
                                                  Maîtrises:
                                                </div>
                                                
                                                {/* List of unlocked masteries */}
                                                <div className="space-y-1 mb-2">
                                                  {compData.masteries.map((mastery, masteryIdx) => {
                                                    const maxDice = level;
                                                    const canUpgrade = mastery.diceCount < maxDice && manager.getMasteryPoints(comp) > 0;
                                                    
                                                    return (
                                                      <div key={masteryIdx} className="bg-parchment-aged border border-border-tan rounded p-2 text-xs flex items-center justify-between">
                                                        <span className="flex-1">{mastery.name}</span>
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-text-secondary text-xs">{mastery.diceCount}D</span>
                                                          {canUpgrade && (
                                                            <button
                                                              onClick={() => {
                                                                manager.upgradeMastery(comp, mastery.name);
                                                                setState(manager.getState());
                                                              }}
                                                              className="px-2 py-1 bg-blue-600 text-white border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark"
                                                              title="Upgrade (+1 point)"
                                                            >
                                                              +1
                                                            </button>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                                
                                                {/* Unlock new mastery button */}
                                                {manager.getMasteryPoints(comp) > 0 && (
                                                  <div className="relative mastery-selection-container" style={{ zIndex: masterySelectionOpen === comp ? 1000 : 'auto' }}>
                                                    <button
                                                      onClick={() => setMasterySelectionOpen(masterySelectionOpen === comp ? null : comp)}
                                                      className="w-full px-2 py-2 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs text-center transition-all duration-300 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
                                                      style={{
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                      }}
                                                    >
                                                      + Débloquer Maîtrise (1 point)
                                                    </button>
                                                    
                                                    {/* Mastery selection dropdown */}
                                                    {masterySelectionOpen === comp && (() => {
                                                      const availableMasteries = getMasteries(comp);
                                                      const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                      const unselectedMasteries = availableMasteries.filter(
                                                        masteryName => !unlockedMasteryNames.includes(masteryName)
                                                      );
                                                      
                                                      if (process.env.NODE_ENV === 'development') {
                                                        console.log('Mastery dropdown for', getCompetenceName(comp), {
                                                          available: availableMasteries.length,
                                                          unlocked: unlockedMasteryNames.length,
                                                          unselected: unselectedMasteries.length,
                                                          unselectedList: unselectedMasteries
                                                        });
                                                      }
                                                      
                                                      return (
                                                        <div 
                                                          className="absolute mt-1 bg-parchment-dark border-2 border-gold-glow rounded shadow-2xl max-h-40 overflow-y-auto w-full min-w-[200px] z-[10000]"
                                                          style={{
                                                            boxShadow: '0 0 0 1px #643030, 0 0 0 2px #ffebc6, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 0 1px #ceb68d'
                                                          }}
                                                        >
                                                          {unselectedMasteries.length > 0 ? (
                                                            unselectedMasteries.map((masteryName) => (
                                                              <button
                                                                key={masteryName}
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  e.preventDefault();
                                                                  const success = manager.unlockMastery(comp, masteryName);
                                                                  if (process.env.NODE_ENV === 'development') {
                                                                    console.log('Unlock mastery:', {
                                                                      competence: getCompetenceName(comp),
                                                                      mastery: masteryName,
                                                                      success,
                                                                      pointsBefore: manager.getMasteryPoints(comp) + 1,
                                                                      pointsAfter: manager.getMasteryPoints(comp)
                                                                    });
                                                                  }
                                                                  setState(manager.getState());
                                                                  setMasterySelectionOpen(null);
                                                                }}
                                                                className="w-full px-2 py-2 text-xs text-left font-medieval text-text-dark block whitespace-nowrap transition-colors duration-300 hover:bg-hover-bg hover:text-red-theme border-b border-border-tan last:border-b-0"
                                                              >
                                                                {masteryName}
                                                              </button>
                                                            ))
                                                          ) : (
                                                            <div className="px-2 py-2 text-xs text-text-secondary italic">
                                                              {availableMasteries.length === 0 
                                                                ? 'Aucune maîtrise disponible' 
                                                                : 'Toutes les maîtrises sont débloquées'}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>
                                                )}
                                                
                                                {compData.masteries.length === 0 && manager.getMasteryPoints(comp) === 0 && (
                                                  <div className="text-xs text-text-secondary italic">
                                                    Aucune maîtrise
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}