import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrips, getSettings, getAllCatches } from '../lib/storage';
import type { Trip, FishCatch } from '../types';
import type { AppSettings } from '../lib/storage';
import { PlusCircle, Mic, Fish, Trophy, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [catches, setCatches] = useState<FishCatch[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [t, c, s] = await Promise.all([getTrips(), getAllCatches(), getSettings()]);
      setTrips(t);
      setCatches(c);
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const stats = trips.length > 0 ? computeStats(trips, catches) : null;
  const lastTrip = trips.length > 0 ? trips.sort((a, b) => b.date_fished.localeCompare(a.date_fished))[0] : null;

  return (
    <div>
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/log"
          className="flex items-center gap-2 p-4 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="font-medium">Log Trip</span>
        </Link>
        <Link
          to="/log"
          state={{ voice: true }}
          className="flex items-center gap-2 p-4 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Mic className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Voice Log</span>
        </Link>
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="text-center py-12">
          <Fish className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Welcome to DeltaFish</h2>
          <p className="text-slate-500 mb-6">
            Start logging your California Delta trips to build your fishing intelligence.
          </p>
          <Link
            to="/log"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Log Your First Trip
          </Link>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard icon={Fish} label="Total Fish" value={stats.totalFish} color="blue" />
            <StatCard icon={TrendingUp} label="Total Weight" value={`${stats.totalWeight} lbs`} color="green" />
            <StatCard icon={Calendar} label="Trips This Year" value={stats.tripsThisYear} color="purple" />
            <StatCard icon={Trophy} label="Biggest Fish" value={`${stats.biggestFish} lbs`} color="amber" />
          </div>

          {stats.topLure && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-slate-500 mb-1">Top Producing Lure</h3>
              <p className="text-lg font-bold text-slate-800">{stats.topLure}</p>
              <p className="text-sm text-slate-500">{stats.topLureCount} fish caught</p>
            </div>
          )}

          {lastTrip && (
            <Link to={`/trips/${lastTrip.id}`} className="block bg-white border border-slate-200 rounded-xl p-4 mb-4 hover:shadow-sm transition-shadow">
              <h3 className="text-sm font-medium text-slate-500 mb-1">Last Trip</h3>
              <p className="text-base font-bold text-slate-800">{format(new Date(lastTrip.date_fished), 'MMMM d, yyyy')}</p>
              <p className="text-sm text-slate-600">{lastTrip.launch_location} &middot; {lastTrip.water_temp_f}&deg;F</p>
            </Link>
          )}

          {settings && !settings.openai_api_key && (
            <Link to="/settings" className="block bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">Set up Voice Logging</p>
              <p className="text-xs text-amber-600 mt-0.5">Add your OpenAI API key in Settings to enable voice trip logging</p>
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function computeStats(trips: Trip[], catches: FishCatch[]) {
  const totalFish = catches.length;
  const totalWeight = catches.reduce((sum, c) => sum + (c.weight_lbs || 0), 0);
  const biggestFish = catches.reduce((max, c) => Math.max(max, c.weight_lbs || 0), 0);

  const lureCounts: Record<string, number> = {};
  catches.forEach(c => {
    if (c.lure_used) {
      lureCounts[c.lure_used] = (lureCounts[c.lure_used] || 0) + 1;
    }
  });
  const topLure = Object.entries(lureCounts).sort((a, b) => b[1] - a[1])[0];

  const thisYear = new Date().getFullYear();
  const tripsThisYear = trips.filter(t => new Date(t.date_fished).getFullYear() === thisYear).length;

  return {
    totalTrips: trips.length,
    totalFish,
    totalWeight: Math.round(totalWeight * 10) / 10,
    biggestFish: Math.round(biggestFish * 10) / 10,
    topLure: topLure ? topLure[0] : null,
    topLureCount: topLure ? topLure[1] : 0,
    tripsThisYear,
  };
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
