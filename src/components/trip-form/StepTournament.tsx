import { TripFormData } from '../../types';
import FormField from '../ui/FormField';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
}

export default function StepTournament({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Tournament Info</h2>

      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <button
          type="button"
          onClick={() => onChange({ is_tournament: !data.is_tournament })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            data.is_tournament ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              data.is_tournament ? 'translate-x-5' : ''
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">This was a tournament</span>
      </div>

      {data.is_tournament && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Placement">
              <input
                type="number"
                value={data.tournament_placement}
                onChange={e => onChange({ tournament_placement: e.target.value })}
                placeholder="e.g., 3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <FormField label="Total Weight (lbs)">
              <input
                type="number"
                step="0.1"
                value={data.tournament_weight_lbs}
                onChange={e => onChange({ tournament_weight_lbs: e.target.value })}
                placeholder="e.g., 18.5"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          <FormField label="Winning Pattern Notes" hint="What did the winner do differently?">
            <textarea
              value={data.winning_pattern_notes}
              onChange={e => onChange({ winning_pattern_notes: e.target.value })}
              rows={3}
              placeholder="e.g., Winner punched hyacinth mats in Frank's Tract on incoming tide, 22.4 lbs"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
