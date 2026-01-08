'use client';

import { Souffrance, getSouffranceName, getSouffranceAttribute, getResistanceCompetenceName } from '@/game/character/data/SouffranceData';
import { SouffranceHealthSystem, HealthState, SequeleType } from '@/game/character/SouffranceHealthSystem';
import { Attribute, getAttributeAbbreviation } from '@/game/character/data/AttributeData';

interface SouffranceHealthBarsProps {
  healthSystem: SouffranceHealthSystem;
}

/**
 * Health Bar Component displaying all 8 Souffrance types
 * Shows individual bars for each souffrance type and total health state
 */
export default function SouffranceHealthBars({ healthSystem }: SouffranceHealthBarsProps) {
  const totalSouffrance = healthSystem.getTotalSouffrance();
  const healthState = healthSystem.getHealthState();
  const healthStateDesc = healthSystem.getHealthStateDescription();

  // Get color for health state
  const getHealthStateColor = (state: HealthState): string => {
    switch (state) {
      case HealthState.NORMAL:
        return 'text-green-500';
      case HealthState.RAGE:
        return 'text-yellow-500';
      case HealthState.UNCONSCIOUS:
        return 'text-orange-500';
      case HealthState.DEFEATED:
        return 'text-red-600';
      case HealthState.DEATH:
        return 'text-red-900';
      default:
        return 'text-gray-500';
    }
  };

  // Get color for souffrance level
  const getSouffranceBarColor = (diceCount: number): string => {
    if (diceCount >= 26) return 'bg-red-900';
    if (diceCount >= 21) return 'bg-red-700';
    if (diceCount >= 15) return 'bg-red-500';
    if (diceCount >= 10) return 'bg-orange-500';
    if (diceCount >= 6) return 'bg-yellow-500';
    if (diceCount >= 3) return 'bg-yellow-300';
    if (diceCount >= 1) return 'bg-green-300';
    return 'bg-gray-200';
  };

  // Get séquelle label
  const getSequeleLabel = (sequeleType: SequeleType): string => {
    switch (sequeleType) {
      case SequeleType.NONE:
        return '';
      case SequeleType.PASSAGERE:
        return 'Passagère';
      case SequeleType.DURABLE:
        return 'Durable';
      case SequeleType.PERMANENTE:
        return 'Permanente';
      case SequeleType.FATALE:
        return 'Fatale';
      case SequeleType.VAINCU:
        return 'Vaincu';
      case SequeleType.MORT:
        return 'Mort';
      default:
        return '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Total Health State */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">État de Santé</h3>
          <span className={`text-sm font-semibold ${getHealthStateColor(healthState)}`}>
            {healthStateDesc}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
            {/* Total health bar (inverse - more suffering = less health) */}
            {/* Max is 26 (death), so we show health as (26 - total) / 26 */}
            <div
              className={`h-full transition-all duration-300 ${
                totalSouffrance >= 26
                  ? 'bg-red-900'
                  : totalSouffrance >= 21
                  ? 'bg-red-700'
                  : totalSouffrance >= 15
                  ? 'bg-orange-500'
                  : totalSouffrance >= 10
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, ((26 - totalSouffrance) / 26) * 100))}%`,
              }}
            />
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {totalSouffrance}/26 DS
          </span>
        </div>
      </div>

      {/* Individual Souffrance Bars */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">
          Résistances aux Souffrances (8 types)
          <span className="text-xs text-gray-500 ml-2">(R[Souffrance] = resistance competence, DS = actual damage)</span>
        </h4>
        {Object.values(Souffrance).map((souffrance) => {
          const souffranceDice = healthSystem.getAllSouffranceDice();
          const diceCount = souffranceDice[souffrance];
          const attribute = getSouffranceAttribute(souffrance);
          const attributeAbbr = getAttributeAbbreviation(attribute);
          const sequeleType = healthSystem.getSequeleType(souffrance);
          const sequeleLabel = getSequeleLabel(sequeleType);
          const level = healthSystem.getSouffranceLevel(souffrance);

          // Calculate bar width (0-26 dice, shown as 0-100%)
          const barWidth = Math.min(100, (diceCount / 26) * 100);

          return (
            <div
              key={souffrance}
              className="bg-gray-800 rounded p-2 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {getResistanceCompetenceName(souffrance)}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">({attributeAbbr})</span>
                  {sequeleLabel && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-200">
                      {sequeleLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {level > 0 && (
                    <span className="text-xs text-gray-400" title="Resistance competence level">
                      Niv {level}
                    </span>
                  )}
                  <span className="text-xs font-mono text-gray-300" title="Actual souffrance damage dice">
                    {diceCount} DS {getSouffranceName(souffrance)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getSouffranceBarColor(diceCount)}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {/* Threshold markers */}
                <div className="flex gap-0.5">
                  {/* Markers at 3, 10, 15, 21, 26 thresholds */}
                  <div
                    className={`w-0.5 h-3 ${
                      diceCount >= 3 ? 'bg-yellow-400' : 'bg-gray-600'
                    }`}
                    title="3 DS - Passagère"
                  />
                  <div
                    className={`w-0.5 h-3 ${
                      diceCount >= 10 ? 'bg-orange-400' : 'bg-gray-600'
                    }`}
                    title="10 DS - Permanente"
                  />
                  <div
                    className={`w-0.5 h-3 ${
                      diceCount >= 15 ? 'bg-red-400' : 'bg-gray-600'
                    }`}
                    title="15 DS - Fatale"
                  />
                  <div
                    className={`w-0.5 h-3 ${
                      diceCount >= 21 ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                    title="21 DS - Vaincu"
                  />
                  <div
                    className={`w-0.5 h-3 ${
                      diceCount >= 26 ? 'bg-red-900' : 'bg-gray-600'
                    }`}
                    title="26 DS - Mort"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Health State Effects Info */}
      {(healthState === HealthState.RAGE ||
        healthState === HealthState.UNCONSCIOUS ||
        healthState === HealthState.DEFEATED ||
        healthState === HealthState.DEATH) && (
        <div
          className={`rounded-lg p-3 border ${
            healthState === HealthState.RAGE
              ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200'
              : healthState === HealthState.UNCONSCIOUS
              ? 'bg-orange-900/20 border-orange-700 text-orange-200'
              : healthState === HealthState.DEFEATED
              ? 'bg-red-900/20 border-red-700 text-red-200'
              : 'bg-red-950/30 border-red-900 text-red-300'
          }`}
        >
          <div className="text-sm font-semibold mb-1">Effets de l'État</div>
          <div className="text-xs">
            {healthState === HealthState.RAGE && (
              <p>
                <strong>Rage:</strong> Vous devez faire un jet de 1d6 &gt; Niv de Rage pour agir contre l'instinct.
                Sur échec, action instinctive (DS convertis en Dés Positifs pour cette action).
              </p>
            )}
            {healthState === HealthState.UNCONSCIOUS && (
              <p>
                <strong>Évanouissement/Démence:</strong> Vous devez faire un jet de 1d6 &gt; Niv d'Évanouissement pour agir.
                Sur échec, inconscient ou fou.
              </p>
            )}
            {healthState === HealthState.DEFEATED && (
              <p>
                <strong>Vaincu:</strong> Coma ou Folie. Situation de Défaite.
              </p>
            )}
            {healthState === HealthState.DEATH && (
              <p>
                <strong>Mort ou Perdu:</strong> Mort physique ou perte totale de l'identité.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

