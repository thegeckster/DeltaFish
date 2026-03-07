import { Moon, Droplets, Wind, Thermometer, Waves } from 'lucide-react';
import { TripConditions } from '../../types';

interface ConditionsBadgesProps {
  conditions: TripConditions;
  compact?: boolean;
}

export default function ConditionsBadges({ conditions, compact }: ConditionsBadgesProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {conditions.tide_stage_dominant && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded text-xs">
            <Waves className="w-3 h-3" />
            {conditions.tide_stage_dominant}
          </span>
        )}
        {conditions.moon_phase && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
            <Moon className="w-3 h-3" />
            {conditions.moon_phase}
          </span>
        )}
        {conditions.spawn_phase_estimate && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
            {conditions.spawn_phase_estimate}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {conditions.air_temp_start_f != null && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
          <Thermometer className="w-4 h-4 text-orange-600" />
          <div>
            <p className="text-xs text-orange-600 font-medium">Air Temp</p>
            <p className="text-sm text-slate-800">{conditions.air_temp_start_f}°F → {conditions.air_temp_end_f}°F</p>
          </div>
        </div>
      )}
      {conditions.wind_speed_avg_mph != null && (
        <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg">
          <Wind className="w-4 h-4 text-sky-600" />
          <div>
            <p className="text-xs text-sky-600 font-medium">Wind</p>
            <p className="text-sm text-slate-800">{conditions.wind_speed_avg_mph} mph {conditions.wind_direction}</p>
          </div>
        </div>
      )}
      {conditions.barometric_pressure_trend && (
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <div className="w-4 h-4 text-purple-600 text-center font-bold text-xs">hPa</div>
          <div>
            <p className="text-xs text-purple-600 font-medium">Pressure</p>
            <p className="text-sm text-slate-800 capitalize">{conditions.barometric_pressure_trend}</p>
          </div>
        </div>
      )}
      {conditions.tide_stage_dominant && (
        <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg">
          <Waves className="w-4 h-4 text-cyan-600" />
          <div>
            <p className="text-xs text-cyan-600 font-medium">Tide</p>
            <p className="text-sm text-slate-800 capitalize">{conditions.tide_stage_dominant} ({conditions.tide_coefficient} ft range)</p>
          </div>
        </div>
      )}
      {conditions.moon_phase && (
        <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
          <Moon className="w-4 h-4 text-indigo-600" />
          <div>
            <p className="text-xs text-indigo-600 font-medium">Moon</p>
            <p className="text-sm text-slate-800">{conditions.moon_phase} ({conditions.moon_illumination_pct}%)</p>
          </div>
        </div>
      )}
      {conditions.rainfall_48hr_inches != null && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Droplets className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-medium">48hr Rain</p>
            <p className="text-sm text-slate-800">{conditions.rainfall_48hr_inches}" total</p>
          </div>
        </div>
      )}
    </div>
  );
}
