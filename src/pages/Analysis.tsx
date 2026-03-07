import { useMemo } from 'react';
import { getTrips } from '../lib/storage';
import { BarChart3 } from 'lucide-react';

export default function Analysis() {
  const trips = useMemo(() => getTrips(), []);

  if (trips.length < 3) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-700 mb-1">Not Enough Data Yet</h2>
        <p className="text-sm text-slate-500">
          Log at least 3 trips to start seeing patterns and analysis.
        </p>
        <p className="text-sm text-slate-400 mt-2">{trips.length}/3 trips logged</p>
      </div>
    );
  }

  // Pattern detection
  const catches = JSON.parse(localStorage.getItem('deltafish_catches') || '[]');
  const conditions = JSON.parse(localStorage.getItem('deltafish_conditions') || '[]');

  const tripStats = trips.map(t => {
    const tc = catches.filter((c: any) => c.trip_id === t.id);
    const cond = conditions.find((c: any) => c.trip_id === t.id);
    return {
      ...t,
      fishCount: tc.length,
      totalWeight: tc.reduce((s: number, c: any) => s + (c.weight_lbs || 0), 0),
      conditions: cond,
    };
  });

  // Lure effectiveness
  const lureStats: Record<string, { caught: number; trips: number }> = {};
  trips.forEach(t => {
    t.lures_used.forEach(l => {
      if (!lureStats[l]) lureStats[l] = { caught: 0, trips: 0 };
      lureStats[l].trips++;
    });
    t.lures_caught_fish.forEach(l => {
      if (lureStats[l]) lureStats[l].caught++;
    });
  });

  const lureEfficiency = Object.entries(lureStats)
    .map(([lure, stats]) => ({
      lure,
      catchRate: Math.round((stats.caught / stats.trips) * 100),
      trips: stats.trips,
    }))
    .sort((a, b) => b.catchRate - a.catchRate);

  // Monthly breakdown
  const monthlyStats: Record<string, { trips: number; fish: number; weight: number }> = {};
  tripStats.forEach(t => {
    const month = t.date_fished.substring(0, 7);
    if (!monthlyStats[month]) monthlyStats[month] = { trips: 0, fish: 0, weight: 0 };
    monthlyStats[month].trips++;
    monthlyStats[month].fish += t.fishCount;
    monthlyStats[month].weight += t.totalWeight;
  });

  // Best conditions patterns
  const patterns: Record<string, { fish: number; trips: number; pattern: string }> = {};
  tripStats.forEach(t => {
    if (t.fishCount === 0) return;
    t.lures_caught_fish.forEach(lure => {
      const clarityBand = t.water_clarity_inches <= 6 ? 'Muddy' :
        t.water_clarity_inches <= 18 ? 'Stained' :
        t.water_clarity_inches <= 36 ? 'Clear' : 'Very Clear';
      const tempBand = t.water_temp_f < 55 ? 'Cold' :
        t.water_temp_f < 65 ? 'Cool' :
        t.water_temp_f < 75 ? 'Warm' : 'Hot';
      const tide = t.conditions?.tide_stage_dominant || 'unknown';
      
      const key = `${lure}|${clarityBand}|${tempBand}|${tide}`;
      const label = `${lure} + ${clarityBand} + ${tempBand} + ${tide} tide`;
      
      if (!patterns[key]) patterns[key] = { fish: 0, trips: 0, pattern: label };
      patterns[key].fish += t.fishCount;
      patterns[key].trips++;
    });
  });

  const topPatterns = Object.values(patterns)
    .filter(p => p.trips >= 1)
    .sort((a, b) => (b.fish / b.trips) - (a.fish / a.trips))
    .slice(0, 5);

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Analysis</h2>

      {/* Lure Effectiveness */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Lure Effectiveness</h3>
        <div className="space-y-2">
          {lureEfficiency.slice(0, 8).map(l => (
            <div key={l.lure} className="flex items-center gap-2">
              <span className="text-sm text-slate-700 w-32 truncate">{l.lure}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${l.catchRate}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-16 text-right">{l.catchRate}% ({l.trips})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Patterns */}
      {topPatterns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Producing Patterns</h3>
          <div className="space-y-2">
            {topPatterns.map((p, i) => (
              <div key={i} className="p-2 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700">{p.pattern}</p>
                <p className="text-xs text-slate-500">{(p.fish / p.trips).toFixed(1)} fish/trip avg over {p.trips} trip(s)</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Monthly Summary</h3>
        <div className="space-y-1">
          {Object.entries(monthlyStats).sort((a, b) => b[0].localeCompare(a[0])).map(([month, stats]) => (
            <div key={month} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-sm text-slate-600">{month}</span>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{stats.trips} trips</span>
                <span>{stats.fish} fish</span>
                <span>{stats.weight.toFixed(1)} lbs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
