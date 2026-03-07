import { TripFormData, FishCatchInput } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
  errors: Record<string, string>;
}

export default function StepCatches({ data, onChange, errors }: Props) {
  const addCatch = () => {
    const newCatch: FishCatchInput = {
      id: crypto.randomUUID(),
      species: 'Largemouth Bass',
      weight_lbs: '',
      lure_used: data.lures_caught_fish[0] || data.lures_used[0] || '',
      notes: '',
    };
    onChange({ fish_catches: [...data.fish_catches, newCatch] });
  };

  const updateCatch = (id: string, updates: Partial<FishCatchInput>) => {
    onChange({
      fish_catches: data.fish_catches.map(fc =>
        fc.id === id ? { ...fc, ...updates } : fc
      ),
    });
  };

  const removeCatch = (id: string) => {
    onChange({ fish_catches: data.fish_catches.filter(fc => fc.id !== id) });
  };

  const totalWeight = data.fish_catches.reduce(
    (sum, fc) => sum + (fc.weight_lbs ? parseFloat(fc.weight_lbs) : 0),
    0
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Catches</h2>
      <div className="flex gap-4 mb-4 text-sm text-slate-500">
        <span>{data.fish_catches.length} fish</span>
        {totalWeight > 0 && <span>{totalWeight.toFixed(1)} lbs total</span>}
      </div>

      <div className="space-y-3">
        {data.fish_catches.map((fc, i) => (
          <div key={fc.id} className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Fish #{i + 1}</span>
              <button
                type="button"
                onClick={() => removeCatch(fc.id)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Species</label>
                <input
                  type="text"
                  value={fc.species}
                  onChange={e => updateCatch(fc.id, { species: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fc.weight_lbs}
                  onChange={e => updateCatch(fc.id, { weight_lbs: e.target.value })}
                  placeholder="optional"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            {data.lures_used.length > 0 && (
              <div className="mt-2">
                <label className="text-xs text-slate-500">Lure</label>
                <select
                  value={fc.lure_used}
                  onChange={e => updateCatch(fc.id, { lure_used: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select lure</option>
                  {data.lures_used.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCatch}
        className="mt-3 w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add Fish
      </button>
    </div>
  );
}
