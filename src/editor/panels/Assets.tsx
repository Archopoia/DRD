'use client';

import { useState } from 'react';
import { CharacterSheetManager } from '@/game/character/CharacterSheetManager';
import { Competence, getCompetenceName } from '@/game/character/data/CompetenceData';
import { Attribute, getAttributeName } from '@/game/character/data/AttributeData';
import { Aptitude, getAptitudeName } from '@/game/character/data/AptitudeData';

interface AssetsProps {
  manager?: CharacterSheetManager;
}

type AssetTab = 'competences' | 'attributes' | 'aptitudes';

/**
 * Assets Panel - Shows game resources like competences, attributes, and aptitudes
 */
export default function Assets({ manager }: AssetsProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('competences');
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
      {/* Search Bar */}
      <div className="p-2 border-b border-gray-700 flex-shrink-0">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveTab('competences')}
          className={`px-4 py-2 text-xs font-mono flex-1 ${
            activeTab === 'competences'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Compétences ({filteredCompetences.length})
        </button>
        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-2 text-xs font-mono flex-1 ${
            activeTab === 'attributes'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Attributes ({filteredAttributes.length})
        </button>
        <button
          onClick={() => setActiveTab('aptitudes')}
          className={`px-4 py-2 text-xs font-mono flex-1 ${
            activeTab === 'aptitudes'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Aptitudes ({filteredAptitudes.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === 'competences' && (
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
                    className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono"
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
        )}

        {activeTab === 'attributes' && (
          <div className="space-y-1">
            {filteredAttributes.length === 0 ? (
              <div className="text-gray-500 text-xs font-mono py-4 text-center">
                No attributes found
              </div>
            ) : (
              filteredAttributes.map(attribute => {
                const value = getAttributeValue(attribute);
                return (
                  <div
                    key={attribute}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono"
                  >
                    <div className="text-white font-semibold">{getAttributeName(attribute)}</div>
                    <div className="text-gray-400 mt-1">{attribute}</div>
                    {value !== null && (
                      <div className="text-blue-400 mt-1 text-xs">
                        Value: {value}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'aptitudes' && (
          <div className="space-y-1">
            {filteredAptitudes.length === 0 ? (
              <div className="text-gray-500 text-xs font-mono py-4 text-center">
                No aptitudes found
              </div>
            ) : (
              filteredAptitudes.map(aptitude => {
                const level = getAptitudeLevel(aptitude);
                return (
                  <div
                    key={aptitude}
                    className="p-2 bg-gray-700 rounded hover:bg-gray-650 text-xs font-mono"
                  >
                    <div className="text-white font-semibold">{getAptitudeName(aptitude)}</div>
                    <div className="text-gray-400 mt-1">{aptitude}</div>
                    {level !== null && (
                      <div className="text-green-400 mt-1 text-xs">
                        Level: {level}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

