import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrips } from '../lib/storage';
import { Fish, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';

export default function MyTrips() {
  const allTrips = useMemo(() => getTrips().sort((a, b) => b.date_fished.localeCompare(a.date_fished)), []);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'fish' | 'weight'>('date');

  const trips = useMemo(() => {
    let filtered = allTrips;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.launch_location.toLowerCase().includes(q) ||
        t.lures_used.some(l => l.toLowerCase().includes(q)) ||
        t.areas_fished.some(a => a.toLowerCase().includes(q)) ||
        (t.observational_notes || '').toLowerCase().includes(q)
      );
    }

    const catches = JSON.parse(localStorage.getItem('deltafish_catches') || '[]');
    const tripStats: Record<string, { count: number; weight: number }> = {};
    catches.forEach((c: any) => {
      if (!tripStats[c.trip_id]) tripStats[c.trip_id] = { count: 0, weight: 0 };
      tripStats[c.trip_id].count++;
      tripStats[c.trip_id].weight += c.weight_lbs || 0;
    });

    if (sortBy === 'fish') {
      filtered = [...filtered].sort((a, b) => (tripStats[b.id]?.count || 0) - (tripStats[a.id]?.count || 0));
    } else if (sortBy === 'weight') {
      filtered = [...filtered].sort((a, b) => (tripStats[b.id]?.weight || 0) - (tripStats[a.id]?.weight || 0));
    }

    return filtered.map(t => ({
      ...t,
      fishCount: tripStats[t.id]?.count || 0,
      totalWeight: Math.round((tripStats[t.id]?.weight || 0) * 10) / 10,
    }));
  }, [allTrips, search, sortBy]);

  if (allTrips.length === 0) {
    return (
      <div className="text-center py-12">
        <Fish className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-700 mb-1">No trips yet</h2>
        <p className="text-sm text-slate-500 mb-4">Log your first trip to see it here</p>
        <Link to="/log" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          Log a Trip
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">{allTrips.length} Trips</h2>
        <div className="flex gap-1">
          {(['date', 'fish', 'weight'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sortBy === s ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s === 'date' ? 'Date' : s === 'fish' ? 'Fish' : 'Weight'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search trips..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {trips.map(trip => (
          <Link
            key={trip.id}
            to={`/trips/${trip.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-slate-800 text-sm">
                    {format(new Date(trip.date_fished), 'MMM d, yyyy')}
                  </span>
                  {trip.is_tournament && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      Tournament
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{trip.launch_location}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{trip.fishCount} fish</span>
                  {trip.totalWeight > 0 && <span>{trip.totalWeight} lbs</span>}
                  <span>{trip.water_temp_f}°F</span>
                  {trip.lures_caught_fish.length > 0 && (
                    <span className="truncate">{trip.lures_caught_fish[0]}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 ml-2 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
