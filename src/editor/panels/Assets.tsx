'use client';

import { useState } from 'react';
import * as THREE from 'three';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Competence, getCompetenceName } from '@/game/character/data/CompetenceData';
import { Attribute, getAttributeName } from '@/game/character/data/AttributeData';
import { Aptitude, getAptitudeName } from '@/game/character/data/AptitudeData';
import Prefabs from './Prefabs';
import { PrefabManager } from '@/game/ecs/prefab/PrefabManager';
import { EntityManager } from '@/game/ecs/EntityManager';
import { EntityFactory } from '@/game/ecs/factories/EntityFactory';
import { Entity } from '@/game/ecs/Entity';

interface AssetsProps {
  manager?: CharacterSheetManager;
  prefabManager?: PrefabManager | null;
  entityManager?: EntityManager | null;
  entityFactory?: EntityFactory | null;
  selectedObject?: THREE.Object3D | null;
  onPrefabInstantiated?: (entity: Entity) => void;
  onPrefabCreated?: () => void;
}

type AssetTab = 'prefabs' | 'game-data' | 'materials' | 'scripts';

/**
 * Assets Panel - Game asset browser (Unity/Creation Engine style)
 * Organized for action-RPG development (Daggerfall/Morrowind style)
 * 
 * Tabs:
 * - Prefabs: Reusable entity templates (NPCs, Items, Props, Environments)
 * - Game Data: Character sheet data (Competences, Attributes, Aptitudes)
 * - Materials: Materials and textures (placeholder for future)
 * - Scripts: Behavior scripts (placeholder for future)
 */
export default function Assets({ manager, prefabManager, entityManager, entityFactory, selectedObject, onPrefabInstantiated, onPrefabCreated }: AssetsProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('prefabs');
  const [searchQuery, setSearchQuery] = useState('');

  const competences = Object.values(Competence);
  const attributes = Object.values(Attribute);
  const aptitudes = Object.values(Aptitude);

  const filteredCompetences = competences.filter(c => 
    getCompetenceName(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttributes = attributes.filter(a =>
    getAttributeName(a).toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAptitudes = aptitudes.filter(a =>
    getAptitudeName(a).toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCompetenceInfo = (competence: Competence) => {
    if (!manager) return null;
    const comp = manager.getCompetence(competence);
    const level = manager.getCompetenceLevel(competence);
    const totalMarks = manager.getTotalMarks(competence);
    const requiredMarks = 100 - comp.eternalMarks;
    return { comp, level, totalMarks, requiredMarks };
  };

  const getAttributeValue = (attribute: Attribute) => {
    if (!manager) return null;
    const state = manager.getState();
    return state.attributes[attribute];
  };

  const getAptitudeLevel = (aptitude: Aptitude) => {
    if (!manager) return null;
    const state = manager.getState();
    return state.aptitudeLevels[aptitude];
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Toolbar with Tabs */}
      <div className="flex-shrink-0 border-b border-gray-700">
        {/* Tabs - Scrollable */}
        <div className="flex border-b border-gray-700 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('prefabs')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'prefabs'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <span>Prefabs</span>
          </button>
          <button
            onClick={() => setActiveTab('game-data')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'game-data'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Game Data</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
            title="Coming soon"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            <span>Materials</span>
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 text-xs font-mono flex-shrink-0 flex items-center justify-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
            title="Coming soon"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span>Scripts</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-gray-700 flex-shrink-0">
          <input
            type="text"
            placeholder={activeTab === 'prefabs' ? 'Search prefabs...' : activeTab === 'game-data' ? 'Search game data...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0">
        {/* Prefabs Tab - Primary asset browser */}
        {activeTab === 'prefabs' && (
          <Prefabs
            prefabManager={prefabManager}
            entityManager={entityManager}
            entityFactory={entityFactory}
            selectedObject={selectedObject}
            onPrefabInstantiated={onPrefabInstantiated}
            onPrefabCreated={onPrefabCreated}
          />
        )}

        {/* Game Data Tab - Character sheet data */}
        {activeTab === 'game-data' && (
          <div className="h-full flex flex-col">
            {/* Sub-tabs for game data */}
            <div className="flex border-b border-gray-700 mb-2 flex-shrink-0">
              <button
                className="px-3 py-1.5 text-xs font-mono flex-1 text-gray-400 hover:text-white hover:bg-gray-700/50 border-b-2 border-transparent hover:border-gray-600"
              >
                Compétences ({filteredCompetences.length})
              </button>
              <button
                className="px-3 py-1.5 text-xs font-mono flex-1 text-gray-400 hover:text-white hover:bg-gray-700/50 border-b-2 border-transparent hover:border-gray-600"
              >
                Attributes ({filteredAttributes.length})
              </button>
              <button
                className="px-3 py-1.5 text-xs font-mono flex-1 text-gray-400 hover:text-white hover:bg-gray-700/50 border-b-2 border-transparent hover:border-gray-600"
              >
                Aptitudes ({filteredAptitudes.length})
              </button>
            </div>

            {/* Competences */}
            <div className="space-y-1">
              {filteredCompetences.length === 0 ? (
                <div className="text-gray-500 text-xs font-mono py-4 text-center">
                  No competences found
                </div>
              ) : (
                filteredCompetences.map(competence => {
                  const info = getCompetenceInfo(competence);
                  return (
                    <div
                      key={competence}
                      className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono cursor-pointer"
                    >
                      <div className="text-white font-semibold">{getCompetenceName(competence)}</div>
                      <div className="text-gray-400 mt-1">{competence}</div>
                      {info && (
                        <div className="text-gray-500 mt-1 text-xs">
                          Level: {info.level} | Marks: {info.totalMarks}/{info.requiredMarks} | Degrees: {info.comp.degreeCount}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Attributes */}
            {filteredAttributes.length > 0 && (
              <div className="mt-4 space-y-1">
                <div className="text-gray-500 text-xs font-mono font-semibold mb-2">Attributes</div>
                {filteredAttributes.map(attribute => {
                  const value = getAttributeValue(attribute);
                  return (
                    <div
                      key={attribute}
                      className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono cursor-pointer"
                    >
                      <div className="text-white font-semibold">{getAttributeName(attribute)}</div>
                      <div className="text-gray-400 mt-1">{attribute}</div>
                      {value !== null && (
                        <div className="text-gray-500 mt-1 text-xs">Value: {value}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Aptitudes */}
            {filteredAptitudes.length > 0 && (
              <div className="mt-4 space-y-1">
                <div className="text-gray-500 text-xs font-mono font-semibold mb-2">Aptitudes</div>
                {filteredAptitudes.map(aptitude => {
                  const level = getAptitudeLevel(aptitude);
                  return (
                    <div
                      key={aptitude}
                      className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono cursor-pointer"
                    >
                      <div className="text-white font-semibold">{getAptitudeName(aptitude)}</div>
                      <div className="text-gray-400 mt-1">{aptitude}</div>
                      {level !== null && (
                        <div className="text-gray-500 mt-1 text-xs">Level: {level}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Materials Tab - Placeholder */}
        {activeTab === 'materials' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
              Materials & Textures
              <br />
              <span className="text-gray-600 mt-2 block">Coming soon</span>
              <span className="text-gray-600 text-xs mt-1 block">
                Material editor for creating and managing materials, textures, and shaders
              </span>
            </div>
          </div>
        )}

        {/* Scripts Tab - Placeholder */}
        {activeTab === 'scripts' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 text-xs font-mono text-center py-8 px-4">
              Behavior Scripts
              <br />
              <span className="text-gray-600 mt-2 block">Coming soon</span>
              <span className="text-gray-600 text-xs mt-1 block">
                Script editor for creating entity behaviors, interactions, and game logic
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
