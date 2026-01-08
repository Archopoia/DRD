'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Attribute, getAttributeName, getAttributeAbbreviation } from '@/game/character/data/AttributeData';
import { Aptitude, getAptitudeName, getAptitudeAttributes } from '@/game/character/data/AptitudeData';
import { Action, getActionName, getActionAptitude, getActionLinkedAttribute } from '@/game/character/data/ActionData';
import { Competence, getCompetenceName, getCompetenceAction } from '@/game/character/data/CompetenceData';
import { Souffrance, getSouffranceName, getSouffranceAttribute, getResistanceCompetenceName } from '@/game/character/data/SouffranceData';
import { getMasteries } from '@/game/character/data/MasteryRegistry';
import { getLevelName, getLevelFromDiceCount } from '@/lib/utils';
import DiceInput from './ui/DiceInput';
import ProgressBar from './ui/ProgressBar';
import ExpandableSection from './ui/ExpandableSection';
import Tooltip from './ui/Tooltip';

interface CharacterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  manager?: CharacterSheetManager; // Optional: if provided, use this manager instead of creating a new one
}

/**
 * Custom hook to manage character sheet state updates
 * Simplifies the pattern of manager.setX() + setState(manager.getState())
 */
function useCharacterSheet(manager: CharacterSheetManager) {
  const [state, setState] = useState(manager.getState());

  const updateState = () => {
    setState(manager.getState());
  };

  return { state, updateState };
}

export default function CharacterSheet({ isOpen, onClose, manager: externalManager }: CharacterSheetProps) {
  const [internalManager] = useState(() => new CharacterSheetManager());
  const manager = externalManager || internalManager;
  const { state, updateState } = useCharacterSheet(manager);
  
  // Update state periodically when using external manager (to sync with game state)
  useEffect(() => {
    if (!externalManager) return;
    
    // Poll for updates every 100ms when sheet is open
    const interval = setInterval(() => {
      updateState();
    }, 100);
    
    return () => clearInterval(interval);
  }, [externalManager, updateState]);
  const [expandedActions, setExpandedActions] = useState<Set<Action>>(new Set());
  const [expandedCompetences, setExpandedCompetences] = useState<Set<Competence>>(new Set());
  const [masterySelectionOpen, setMasterySelectionOpen] = useState<Competence | null>(null);
  const [flippedAptitudes, setFlippedAptitudes] = useState<Set<Aptitude>>(new Set());
  const [masteryDropdownPosition, setMasteryDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const masteryButtonRefs = useRef<Map<Competence, HTMLButtonElement>>(new Map());

  // Update dropdown position on scroll/resize and close on outside click
  useEffect(() => {
    if (!masterySelectionOpen || !masteryDropdownPosition) return;
    
    const updatePosition = () => {
      const buttonEl = masteryButtonRefs.current.get(masterySelectionOpen!);
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        setMasteryDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both the button and the dropdown portal
      const dropdownElement = document.querySelector('[data-mastery-dropdown]');
      if (
        !target.closest('.mastery-selection-container') && 
        !(dropdownElement && dropdownElement.contains(target))
      ) {
        setMasterySelectionOpen(null);
        setMasteryDropdownPosition(null);
      }
    };
    
    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [masterySelectionOpen, masteryDropdownPosition]);

  if (!isOpen) return null;

  const handleAttributeChange = (attr: Attribute, value: number) => {
    manager.setAttribute(attr, value);
    updateState();
  };

  const toggleSet = <T,>(set: Set<T>, item: T): Set<T> => {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    return newSet;
  };

  const toggleAction = (action: Action) => {
    setExpandedActions(toggleSet(expandedActions, action));
  };

  const toggleCompetence = (comp: Competence) => {
    setExpandedCompetences(toggleSet(expandedCompetences, comp));
  };

  const toggleAptitudeFlip = (aptitude: Aptitude) => {
    setFlippedAptitudes(toggleSet(flippedAptitudes, aptitude));
  };

  const revealCompetence = (comp: Competence) => {
    manager.revealCompetence(comp);
    updateState();
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
        <div className="character-sheet-content flex-1 overflow-y-auto overflow-x-visible p-8 relative z-10" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>

          {/* Aptitudes Section - 8 Columns Side by Side */}
          <section className="mt-8 relative flex gap-4 items-start">
            {/* Vertical title on the left - letter by letter */}
            <div className="flex flex-col items-center justify-start gap-0.5 pt-2 flex-shrink-0" style={{ width: '30px', alignSelf: 'stretch' }}>
              {Array.from("Aptitudes Souffrances Actions Compétences".toUpperCase()).map((char, index) => (
                char === ' ' ? (
                  <div key={index} className="h-1" />
                ) : (
                  <div 
                    key={index} 
                    className="font-medieval text-sm text-text-dark font-bold"
                    style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)', lineHeight: '1.1' }}
                  >
                    {char}
                  </div>
                )
              ))}
            </div>
            <div className="flex gap-0 flex-1 items-start" style={{ minWidth: 0 }}>
                {Object.values(Aptitude).map((aptitude) => {
                const [atb1, atb2, atb3] = getAptitudeAttributes(aptitude);
                const level = state.aptitudeLevels[aptitude];
                const actions = getActionsForAptitude(aptitude);
                
                const isFlipped = flippedAptitudes.has(aptitude);
                
                return (
                  <div 
                    key={aptitude}
                    className="relative flex flex-col"
                    style={{
                      perspective: '1000px',
                      flex: isFlipped ? '0 0 6.25%' : '1 1 12.5%',
                      minWidth: '0',
                      transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Souffrance Bar - At the top of each column, fills from bottom upward */}
                    {(() => {
                        // Find the souffrance linked to the primary attribute (atb1) of this aptitude
                        const linkedSouffrance = Object.values(Souffrance).find(
                          (souf) => getSouffranceAttribute(souf) === atb1
                        );
                        
                        if (linkedSouffrance) {
                          const soufData = state.souffrances[linkedSouffrance];
                          const diceCount = soufData?.diceCount || 0;
                          const maxDS = 26; // Max DS before death
                          
                          // Colors matching the platform colors (converted to hex)
                          const souffranceColors: Record<Souffrance, string> = {
                            [Souffrance.BLESSURES]: '#ff0000',    // Red - physical wounds
                            [Souffrance.FATIGUES]: '#ff8800',     // Orange - exhaustion
                            [Souffrance.ENTRAVES]: '#ffff00',     // Yellow - impediments
                            [Souffrance.DISETTES]: '#00ff00',     // Green - hunger/thirst
                            [Souffrance.ADDICTIONS]: '#00ffff',   // Cyan - dependencies
                            [Souffrance.MALADIES]: '#0088ff',     // Light Blue - diseases
                            [Souffrance.FOLIES]: '#8800ff',       // Purple - mental disorders
                            [Souffrance.RANCOEURS]: '#ff00ff',    // Magenta - resentments
                          };
                          
                          const barColor = souffranceColors[linkedSouffrance];
                          
                          // Calculate height percentage, but ensure minimum visibility
                          const barHeightPercent = Math.min(100, (diceCount / maxDS) * 100);
                          
                          // Use fixed pixel height for small values to ensure visibility
                          // For larger values, use percentage
                          const useFixedHeight = diceCount > 0 && barHeightPercent < 5;
                          const barHeight = useFixedHeight ? `${Math.max(20, diceCount * 4)}px` : `${barHeightPercent}%`;
                          
                          return (
                            <div
                              className="relative w-full overflow-hidden"
                              style={{
                                height: '40px', // Fixed height for the bar container
                                minHeight: '40px',
                                backgroundColor: 'transparent',
                                marginBottom: '0.5rem',
                              }}
                            >
                              {/* Bar that grows from bottom upward */}
                              <div
                                className="absolute bottom-0 left-0 right-0 w-full"
                                style={{
                                  height: barHeight,
                                  backgroundColor: barColor,
                                  opacity: diceCount > 0 ? 0.85 : 0,
                                  zIndex: 1,
                                  transition: 'height 0.3s ease-out, opacity 0.3s ease-out',
                                  pointerEvents: 'none',
                                  minHeight: diceCount > 0 ? '2px' : '0px',
                                }}
                              >
                                {/* DS Count displayed in the bar */}
                                {diceCount > 0 && (
                                  <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                      color: '#ffffff',
                                      textShadow: '2px 2px 4px rgba(0, 0, 0, 1), -1px -1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.8)',
                                      fontWeight: 'bold',
                                      fontSize: diceCount >= 10 ? '0.7rem' : '0.75rem',
                                      fontFamily: 'monospace',
                                      zIndex: 2,
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {diceCount}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                    <div
                      className="relative w-full flex-1"
                      style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        minHeight: '100%',
                      }}
                    >
                      {/* Front Face */}
                      <div 
                        className="bg-hover-bg border-2 border-border-tan rounded-lg p-3 transition-all duration-300 hover:bg-parchment-light hover:border-gold-glow relative"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {/* Aptitude Name with Modifier - Name on left, Modifier on right */}
                        <div 
                          className="mb-2 pb-2 border-b-2 border-border-dark cursor-pointer relative z-10"
                          onClick={() => toggleAptitudeFlip(aptitude)}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medieval text-xs font-bold text-red-theme uppercase tracking-wide">
                              {getAptitudeName(aptitude)}
                            </div>
                            <div className="font-medieval text-2xl font-bold text-text-dark" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)' }}>
                              {level >= 0 ? '+' : ''}{level}
                            </div>
                          </div>
                        </div>

                    {/* Attributes Section */}
                    <div className="flex gap-2 mb-3 pb-3 border-b-2 border-border-dark relative z-10" style={{ backgroundColor: 'transparent' }}>
                      {/* Attributes */}
                      <div className="flex-1 flex items-center justify-around gap-1">
                        {/* Attribute 1 - Emp */}
                        <Tooltip
                          content={`${getAttributeName(atb1)}: ${Math.floor(state.attributes[atb1] * 6 / 10)} (6/10)`}
                          position="top"
                          delay={200}
                        >
                          <div className="flex flex-col items-center cursor-help">
                            <label className="font-medieval text-xs font-bold text-red-theme uppercase tracking-wide">
                              {getAttributeAbbreviation(atb1)}
                            </label>
                            <div className="flex justify-center items-center gap-1 mt-1">
                              <DiceInput
                                value={state.attributes[atb1]}
                                onChange={(value) => handleAttributeChange(atb1, value)}
                                min={-50}
                                max={50}
                                size="md"
                              />
                              <span className="font-medieval text-xs text-text-dark">
                                {Math.floor(state.attributes[atb1] * 6 / 10)}
                              </span>
                            </div>
                          </div>
                        </Tooltip>
                        {/* Plus sign */}
                        <span className="font-medieval text-lg font-bold text-text-dark self-center">+</span>
                        {/* Attribute 2 - Vol */}
                        <Tooltip
                          content={getAttributeName(atb2)}
                          position="top"
                          delay={200}
                        >
                          <div className="flex flex-col items-center cursor-help">
                            <span className="font-medieval text-xs font-bold text-red-theme tracking-wide">
                              {getAttributeAbbreviation(atb2).charAt(0) + getAttributeAbbreviation(atb2).slice(1).toLowerCase()}
                            </span>
                            <span className="font-semibold text-xs text-center mt-1">{Math.floor(state.attributes[atb2] * 3 / 10)}</span>
                          </div>
                        </Tooltip>
                        {/* Plus sign */}
                        <span className="font-medieval text-lg font-bold text-text-dark self-center">+</span>
                        {/* Attribute 3 - Per */}
                        <Tooltip
                          content={getAttributeName(atb3)}
                          position="top"
                          delay={200}
                        >
                          <div className="flex flex-col items-center cursor-help">
                            <span className="font-medieval text-xs font-bold text-red-theme tracking-wide">
                              {getAttributeAbbreviation(atb3).toLowerCase()}
                            </span>
                            <span className="font-semibold text-xs text-center mt-1">{Math.floor(state.attributes[atb3] * 1 / 10)}</span>
                          </div>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Souffrance - Right under aptitude, above actions */}
                    <div className="mb-3 -mx-3">
                      {Object.values(Souffrance).map((souf) => {
                        const soufAttr = getSouffranceAttribute(souf);
                        if (soufAttr === atb1) {
                          const soufData = state.souffrances[souf];
                          const level = getLevelFromDiceCount(soufData.diceCount);
                          const totalMarks = soufData.marks.filter(m => m).length;
                          
                          return (
                            <div key={souf} className="text-xs bg-red-theme-alpha border-2 border-border-dark rounded p-2" style={{
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                            }}>
                              <div className="font-bold text-text-cream mb-1 flex items-center gap-1">
                                <DiceInput
                                  value={soufData.diceCount}
                                  onChange={(value) => {
                                    manager.setSouffranceDice(souf, value);
                                    updateState();
                                  }}
                                  min={0}
                                  size="sm"
                                />
                                <span>{getResistanceCompetenceName(souf)}</span>
                              </div>
                              <div className="grid grid-cols-[1rem_1fr] items-center gap-1">
                                <span className="text-xs font-medieval font-semibold text-text-cream whitespace-nowrap">N{level}</span>
                                <ProgressBar value={totalMarks} max={100} height="sm" label={getLevelName(level)} level={level} />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Actions (3 per Aptitude) */}
                    <div className="space-y-0" style={{ marginLeft: '-1.75rem', paddingLeft: '1.25rem' }}>
                      {actions.map((action, actionIdx) => {
                        const competences = getCompetencesForAction(action);
                        const isExpanded = expandedActions.has(action);
                        const linkedAttr = getActionLinkedAttribute(action);
                        
                        return (
                          <div key={action} className="relative">
                            {actionIdx > 0 && (
                              <div className="border-t border-border-tan my-1"></div>
                            )}
                            <div 
                              className="text-xs relative rounded-md px-2 py-1 my-1 overflow-hidden"
                              style={{
                                position: 'relative',
                              }}
                            >
                              {/* Main background with fade to transparent at edges */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(to right, transparent 0%, rgba(221, 202, 146, 0.1) 15%, rgba(221, 202, 146, 0.15) 25%, rgba(221, 202, 146, 0.15) 75%, rgba(221, 202, 146, 0.1) 85%, transparent 100%)',
                                  pointerEvents: 'none',
                                  borderRadius: 'inherit',
                                }}
                              />
                              {/* Vertical fade overlay */}
                              <div 
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'linear-gradient(to bottom, transparent 0%, rgba(221, 202, 146, 0.1) 20%, rgba(221, 202, 146, 0.15) 40%, rgba(221, 202, 146, 0.15) 60%, rgba(221, 202, 146, 0.1) 80%, transparent 100%)',
                                  pointerEvents: 'none',
                                  borderRadius: 'inherit',
                                }}
                              />
                              <div style={{ position: 'relative', zIndex: 1 }}>
                              <ExpandableSection
                                isExpanded={isExpanded}
                                onToggle={() => toggleAction(action)}
                                title={
                                  <div className="flex justify-between items-center w-full">
                                    <span>{getActionName(action).toUpperCase()}</span>
                                    <span className="text-text-secondary">({getAttributeAbbreviation(linkedAttr)})</span>
                                  </div>
                                }
                                contentClassName="mt-1 space-y-0.5 pl-2 border-l-2 border-border-tan"
                              >
                              {competences.map((comp) => {
                                const compData = state.competences[comp];
                                const isCompExpanded = expandedCompetences.has(comp);
                                const level = manager.getCompetenceLevel(comp);
                                const totalMarks = manager.getTotalMarks(comp);
                                
                                return (
                                  <div key={comp} className="text-xs relative">
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
                                        <div className="mb-1">
                                          <ExpandableSection
                                            isExpanded={isCompExpanded}
                                            onToggle={() => toggleCompetence(comp)}
                                            arrowPosition="right"
                                            title={
                                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                  <DiceInput
                                                    value={compData.diceCount}
                                                    onChange={(value) => {
                                                      manager.setCompetenceDice(comp, value);
                                                      updateState();
                                                    }}
                                                    min={0}
                                                    size="sm"
                                                  />
                                                </div>
                                                <span className="text-xs">{getCompetenceName(comp)}</span>
                                              </div>
                                            }
                                            headerFooter={
                                              <div className="grid grid-cols-[1rem_1fr] items-center gap-1">
                                                <span className="text-xs font-medieval font-semibold text-text-dark whitespace-nowrap">N{level}</span>
                                                <ProgressBar value={totalMarks} max={100} height="sm" label={getLevelName(level)} level={level} />
                                              </div>
                                            }
                                            headerClassName="mb-1"
                                            contentClassName="space-y-1"
                                          >
                                            {manager.isCompetenceEprouvee(comp) && (
                                              <button
                                                onClick={() => {
                                                  manager.realizeCompetence(comp);
                                                  updateState();
                                                }}
                                                className="w-full px-2 py-2 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark hover:-translate-y-0.5"
                                                style={{
                                                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                }}
                                              >
                                                Réaliser (+{level})
                                              </button>
                                            )}
                                            
                                            {/* Masteries Section */}
                                            <div className="space-y-1 mt-2">
                                              {/* Unlock button when there are existing masteries */}
                                              {compData.masteries.length > 0 && manager.getMasteryPoints(comp) > 0 && (() => {
                                                const availableMasteries = getMasteries(comp);
                                                const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                const unselectedMasteries = availableMasteries.filter(
                                                  masteryName => !unlockedMasteryNames.includes(masteryName)
                                                );
                                                const hasUnselectedMasteries = unselectedMasteries.length > 0;
                                                
                                                return (
                                                  <div className="flex items-center justify-between mb-2">
                                                    {hasUnselectedMasteries ? (
                                                      <span 
                                                        className="text-text-secondary italic text-xs cursor-pointer hover:text-text-dark transition-colors"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const wasOpen = masterySelectionOpen === comp;
                                                          setMasterySelectionOpen(wasOpen ? null : comp);
                                                          
                                                          if (!wasOpen) {
                                                            const buttonEl = masteryButtonRefs.current.get(comp);
                                                            const rect = buttonEl ? buttonEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                                            setMasteryDropdownPosition({
                                                              top: rect.bottom + 4,
                                                              left: rect.left,
                                                              width: rect.width
                                                            });
                                                          } else {
                                                            setMasteryDropdownPosition(null);
                                                          }
                                                        }}
                                                      >
                                                        Apprendre Maîtrise
                                                      </span>
                                                    ) : (
                                                      <span className="text-text-secondary italic text-xs">Toutes connues</span>
                                                    )}
                                                    <button
                                                      ref={(el) => {
                                                        if (el) masteryButtonRefs.current.set(comp, el);
                                                        else masteryButtonRefs.current.delete(comp);
                                                      }}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const wasOpen = masterySelectionOpen === comp;
                                                        setMasterySelectionOpen(wasOpen ? null : comp);
                                                        
                                                        if (!wasOpen) {
                                                          const buttonEl = masteryButtonRefs.current.get(comp);
                                                          if (buttonEl) {
                                                            const rect = buttonEl.getBoundingClientRect();
                                                            setMasteryDropdownPosition({
                                                              top: rect.bottom + 4,
                                                              left: rect.left,
                                                              width: rect.width
                                                            });
                                                          }
                                                        } else {
                                                          setMasteryDropdownPosition(null);
                                                        }
                                                      }}
                                                      className="px-2 py-1 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark cursor-pointer"
                                                      style={{
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                      }}
                                                    >
                                                      {manager.getMasteryPoints(comp)}
                                                    </button>
                                                  </div>
                                                );
                                              })()}
                                              
                                              {/* List of unlocked masteries */}
                                              {compData.masteries.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                  {compData.masteries.map((mastery, masteryIdx) => {
                                                    const maxDice = level;
                                                    const canUpgrade = mastery.diceCount < maxDice && manager.getMasteryPoints(comp) > 0;
                                                    
                                                    return (
                                                      <div key={masteryIdx} className="text-xs flex items-center justify-between">
                                                        <span className="flex-1"><span className="mr-1">•</span>{mastery.name}</span>
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-text-secondary text-xs">{mastery.diceCount}D</span>
                                                          {canUpgrade && (
                                                            <Tooltip
                                                              content="Upgrade (+1 point)"
                                                              position="top"
                                                              delay={200}
                                                            >
                                                              <button
                                                                onClick={() => {
                                                                  manager.upgradeMastery(comp, mastery.name);
                                                                  updateState();
                                                                }}
                                                                className="px-2 py-1 bg-blue-600 text-white border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark"
                                                              >
                                                                +1
                                                              </button>
                                                            </Tooltip>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                              
                                              {/* Mastery selection dropdown - rendered via portal to escape overflow */}
                                              {masterySelectionOpen === comp && masteryDropdownPosition && typeof window !== 'undefined' && (() => {
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
                                                
                                                return createPortal(
                                                  <div 
                                                    data-mastery-dropdown
                                                    className="fixed bg-parchment-dark border-2 border-gold-glow rounded shadow-2xl max-h-40 overflow-y-auto min-w-[200px] z-[10001]"
                                                    style={{
                                                      top: `${masteryDropdownPosition.top}px`,
                                                      left: `${masteryDropdownPosition.left}px`,
                                                      width: `${Math.max(masteryDropdownPosition.width, 200)}px`,
                                                      boxShadow: '0 0 0 1px #643030, 0 0 0 2px #ffebc6, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 0 1px #ceb68d'
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                  >
                                                    {unselectedMasteries.length > 0 ? (
                                                      unselectedMasteries.map((masteryName) => (
                                                        <button
                                                          key={masteryName}
                                                          type="button"
                                                          onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                          }}
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            manager.unlockMastery(comp, masteryName);
                                                            if (process.env.NODE_ENV === 'development') {
                                                              console.log('Unlock mastery:', {
                                                                competence: getCompetenceName(comp),
                                                                mastery: masteryName,
                                                                success: true,
                                                                pointsBefore: manager.getMasteryPoints(comp) + 1,
                                                                pointsAfter: manager.getMasteryPoints(comp)
                                                              });
                                                            }
                                                            updateState();
                                                            setMasterySelectionOpen(null);
                                                            setMasteryDropdownPosition(null);
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
                                                  </div>,
                                                  document.body
                                                );
                                              })()}
                                              
                                              {/* No masteries section */}
                                              {compData.masteries.length === 0 && (() => {
                                                const availableMasteries = getMasteries(comp);
                                                const unlockedMasteryNames = compData.masteries.map(m => m.name);
                                                const unselectedMasteries = availableMasteries.filter(
                                                  masteryName => !unlockedMasteryNames.includes(masteryName)
                                                );
                                                const hasUnselectedMasteries = unselectedMasteries.length > 0;
                                                
                                                return (
                                                  <div className="text-xs flex items-center justify-between">
                                                    {manager.getMasteryPoints(comp) > 0 ? (
                                                      <>
                                                        {hasUnselectedMasteries ? (
                                                          <span 
                                                            className="text-text-secondary italic cursor-pointer hover:text-text-dark transition-colors"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const wasOpen = masterySelectionOpen === comp;
                                                              setMasterySelectionOpen(wasOpen ? null : comp);
                                                              
                                                              if (!wasOpen) {
                                                                // Use button position for dropdown if available
                                                                const buttonEl = masteryButtonRefs.current.get(comp);
                                                                const rect = buttonEl ? buttonEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                                                                setMasteryDropdownPosition({
                                                                  top: rect.bottom + 4,
                                                                  left: rect.left,
                                                                  width: rect.width
                                                                });
                                                              } else {
                                                                setMasteryDropdownPosition(null);
                                                              }
                                                            }}
                                                          >
                                                            Apprendre Maîtrise
                                                          </span>
                                                        ) : (
                                                          <span className="text-text-secondary italic">Toutes connues</span>
                                                        )}
                                                        <button
                                                          ref={(el) => {
                                                            if (el) masteryButtonRefs.current.set(comp, el);
                                                            else masteryButtonRefs.current.delete(comp);
                                                          }}
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            const wasOpen = masterySelectionOpen === comp;
                                                            setMasterySelectionOpen(wasOpen ? null : comp);
                                                            
                                                            if (!wasOpen) {
                                                              const buttonEl = masteryButtonRefs.current.get(comp);
                                                              if (buttonEl) {
                                                                const rect = buttonEl.getBoundingClientRect();
                                                                setMasteryDropdownPosition({
                                                                  top: rect.bottom + 4,
                                                                  left: rect.left,
                                                                  width: rect.width
                                                                });
                                                              }
                                                            } else {
                                                              setMasteryDropdownPosition(null);
                                                            }
                                                          }}
                                                          className="px-2 py-1 bg-green-theme text-text-cream border border-border-dark rounded font-medieval font-semibold text-xs transition-all duration-300 hover:bg-hover-bg hover:text-text-dark cursor-pointer"
                                                          style={{
                                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                          }}
                                                        >
                                                          {manager.getMasteryPoints(comp)}
                                                        </button>
                                                      </>
                                                    ) : (
                                                      <span className="text-text-secondary italic">Aucune maîtrise</span>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            </div>
                                          </ExpandableSection>
                                        </div>
                                        {/* Bottom border after each Compétence */}
                                        <div className="border-t border-border-tan mt-2 pt-2"></div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                              </ExpandableSection>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                      </div>
                      
                      {/* Back Face */}
                      <div
                        className="absolute inset-0 bg-red-theme-alpha border-2 border-border-dark rounded-lg p-3"
                        style={{
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        {/* Aptitude Name - Same position, gold color */}
                        <div 
                          className="mb-2 pb-2 border-b-2 border-border-dark cursor-pointer"
                          onClick={() => toggleAptitudeFlip(aptitude)}
                        >
                          <div className="font-medieval text-xs font-bold uppercase tracking-wide text-center" style={{ color: '#ffebc6' }}>
                            {getAptitudeName(aptitude)}
                          </div>
                        </div>
                        {/* Back content - you can add anything here */}
                        <div className="text-text-cream text-xs text-center">
                          {/* Add back side content here if needed */}
                        </div>
                      </div>
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
