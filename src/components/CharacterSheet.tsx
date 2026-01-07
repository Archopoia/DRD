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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white w-full max-w-[95vw] h-[95vh] rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Feuille de Personnage</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Fermer (C)
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Attributes Row - 8 columns */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Attributs (ATB)</h3>
            <div className="grid grid-cols-8 gap-2">
              {Object.values(Attribute).map((attr) => (
                <div key={attr} className="bg-gray-800 p-2 rounded">
                  <label className="block text-xs mb-1 text-center">
                    {getAttributeAbbreviation(attr)}
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={state.attributes[attr]}
                    onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value) || 0)}
                    className="w-full px-1 py-1 bg-gray-700 text-white rounded text-sm text-center"
                  />
                  <div className="text-xs text-gray-400 text-center mt-1">
                    {getAttributeName(attr)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Free Marks */}
          <section className="mb-4">
            <div className="bg-yellow-900 bg-opacity-50 p-2 rounded text-center">
              <span className="font-semibold">Marques Gratuites: </span>
              <span className="text-xl">{state.freeMarks}</span>
            </div>
          </section>

          {/* Aptitudes Section - 8 Columns Side by Side */}
          <section>
            <h3 className="text-xl font-semibold mb-3">Aptitudes, Actions et Compétences</h3>
            <div className="grid grid-cols-8 gap-2">
              {Object.values(Aptitude).map((aptitude) => {
                const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
                const level = state.aptitudeLevels[aptitude];
                const actions = getActionsForAptitude(aptitude);
                
                return (
                  <div key={aptitude} className="bg-gray-800 p-2 rounded border border-gray-700">
                    {/* Aptitude Header */}
                    <div className="mb-2 pb-2 border-b border-gray-600">
                      <div className="font-semibold text-sm text-center mb-1">
                        {getAptitudeName(aptitude)}
                      </div>
                      <div className="text-xs text-gray-400 text-center mb-1">
                        {getAttributeAbbreviation(atb1)}+3, {getAttributeAbbreviation(atb2)}+2, {getAttributeAbbreviation(atb3)}+1
                      </div>
                      <div className="text-lg font-bold text-center">
                        {level >= 0 ? '+' : ''}{level}
                      </div>
                    </div>

                    {/* Main Attribute Input */}
                    <div className="mb-2">
                      <label className="block text-xs mb-1 text-center">
                        {getAttributeName(atb1).toUpperCase()}
                      </label>
                      <input
                        type="number"
                        min="-50"
                        max="50"
                        value={state.attributes[atb1]}
                        onChange={(e) => handleAttributeChange(atb1, parseInt(e.target.value) || 0)}
                        className="w-full px-1 py-1 bg-gray-700 text-white rounded text-sm text-center"
                      />
                    </div>

                    {/* ATB Values Display */}
                    <div className="mb-2 text-xs space-y-1">
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
                    <div className="mb-2 pb-2 border-b border-gray-600">
                      {Object.values(Souffrance).map((souf) => {
                        const soufAttr = getSouffranceAttribute(souf);
                        // Check if this souffrance is tied to the main attribute (atb1)
                        if (soufAttr === atb1) {
                          const soufData = state.souffrances[souf];
                          const level = soufData.diceCount === 0 ? 0 :
                            soufData.diceCount <= 2 ? 1 :
                            soufData.diceCount <= 5 ? 2 :
                            soufData.diceCount <= 9 ? 3 :
                            soufData.diceCount <= 14 ? 4 : 5;
                          const totalMarks = soufData.marks.filter(m => m).length;
                          
                          return (
                            <div key={souf} className="text-xs bg-gray-700 p-1 rounded">
                              <div className="font-semibold mb-1">{getSouffranceName(souf)}</div>
                              <div className="mb-1">{soufData.diceCount} Dés | N{level} | {totalMarks}/10</div>
                              <input
                                type="number"
                                min="0"
                                value={soufData.diceCount}
                                onChange={(e) => {
                                  manager.setSouffranceDice(souf, parseInt(e.target.value) || 0);
                                  setState(manager.getState());
                                }}
                                className="w-full px-1 py-0.5 bg-gray-600 text-white rounded text-xs"
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
                          <div key={action} className="bg-gray-700 p-1 rounded text-xs">
                            <button
                              onClick={() => toggleAction(action)}
                              className="w-full text-left flex items-center justify-between mb-1"
                            >
                              <span className="font-medium">
                                {isExpanded ? '▼' : '▶'} {getActionName(action)}
                              </span>
                              <span className="text-gray-400">({getAttributeAbbreviation(linkedAttr)})</span>
                            </button>
                            
                            {isExpanded && (
                              <div className="mt-1 space-y-0.5">
                                {competences.map((comp) => {
                                  const compData = state.competences[comp];
                                  const isCompExpanded = expandedCompetences.has(comp);
                                  const level = manager.getCompetenceLevel(comp);
                                  const totalMarks = manager.getTotalMarks(comp);
                                  
                                  return (
                                    <div key={comp} className="bg-gray-600 p-1 rounded text-xs relative">
                                      {!compData.isRevealed ? (
                                        <button
                                          onClick={() => revealCompetence(comp)}
                                          className="text-blue-400 hover:text-blue-300 text-xs w-full text-left"
                                        >
                                          Révéler {getCompetenceName(comp)}?
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => toggleCompetence(comp)}
                                            className="w-full text-left flex items-center justify-between mb-0.5"
                                          >
                                            <span className="text-xs">
                                              {isCompExpanded ? '▼' : '▶'} {getCompetenceName(comp)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {compData.diceCount}D N{level} {totalMarks}/10
                                            </span>
                                          </button>
                                          
                                          {isCompExpanded && (
                                            <div className="ml-2 mt-0.5 space-y-0.5 relative">
                                              <div className="flex gap-1 items-center">
                                                <label className="text-xs">Dés:</label>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={compData.diceCount}
                                                  onChange={(e) => {
                                                    manager.setCompetenceDice(comp, parseInt(e.target.value) || 0);
                                                    setState(manager.getState());
                                                  }}
                                                  className="w-12 px-1 py-0.5 bg-gray-700 text-white rounded text-xs"
                                                />
                                              </div>
                                              
                                              {manager.isCompetenceEprouvee(comp) && (
                                                <button
                                                  onClick={() => {
                                                    manager.realizeCompetence(comp);
                                                    setState(manager.getState());
                                                  }}
                                                  className="px-1 py-0.5 bg-green-600 hover:bg-green-700 rounded text-xs w-full"
                                                >
                                                  Réaliser (+{level})
                                                </button>
                                              )}
                                              
                                              {/* Mastery Points Display */}
                                              <div className="text-xs mb-1">
                                                <span className="text-yellow-400 font-semibold">
                                                  Points MT: {manager.getMasteryPoints(comp)}
                                                </span>
                                              </div>
                                              
                                              {/* Masteries Section */}
                                              <div className="space-y-1">
                                                <div className="text-xs font-semibold text-gray-300">
                                                  Maîtrises:
                                                </div>
                                                
                                                {/* List of unlocked masteries */}
                                                {compData.masteries.map((mastery, masteryIdx) => {
                                                  const maxDice = level;
                                                  const canUpgrade = mastery.diceCount < maxDice && manager.getMasteryPoints(comp) > 0;
                                                  
                                                  return (
                                                    <div key={masteryIdx} className="bg-gray-700 p-1 rounded text-xs flex items-center justify-between">
                                                      <span className="flex-1">{mastery.name}</span>
                                                      <div className="flex items-center gap-1">
                                                        <span className="text-gray-400">{mastery.diceCount}D</span>
                                                        {canUpgrade && (
                                                          <button
                                                            onClick={() => {
                                                              manager.upgradeMastery(comp, mastery.name);
                                                              setState(manager.getState());
                                                            }}
                                                            className="px-1 py-0.5 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                                            title="Upgrade (+1 point)"
                                                          >
                                                            +1
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                
                                                {/* Unlock new mastery button */}
                                                {manager.getMasteryPoints(comp) > 0 && (
                                                  <div className="relative mastery-selection-container" style={{ zIndex: masterySelectionOpen === comp ? 1000 : 'auto' }}>
                                                    <button
                                                      onClick={() => setMasterySelectionOpen(masterySelectionOpen === comp ? null : comp)}
                                                      className="w-full px-1 py-0.5 bg-green-600 hover:bg-green-700 rounded text-xs text-center"
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
                                                      
                                                      // Debug logging
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
                                                          className="absolute mt-1 bg-gray-800 border-2 border-yellow-500 rounded shadow-2xl max-h-40 overflow-y-auto w-full min-w-[200px]" 
                                                          style={{ 
                                                            top: '100%', 
                                                            left: 0,
                                                            zIndex: 10000,
                                                            position: 'absolute',
                                                            backgroundColor: '#1f2937',
                                                            display: 'block'
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
                                                                className="w-full px-2 py-1 text-xs text-left hover:bg-gray-700 text-white block whitespace-nowrap"
                                                              >
                                                                {masteryName}
                                                              </button>
                                                            ))
                                                          ) : (
                                                            <div className="px-2 py-1 text-xs text-gray-400 italic">
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
                                                  <div className="text-xs text-gray-500 italic">
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
