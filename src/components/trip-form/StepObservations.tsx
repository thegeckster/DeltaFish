import { TripFormData } from '../../types';
import FormField from '../ui/FormField';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
}

export default function StepObservations({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Observations</h2>

      <FormField label="Spawn Observations" hint="What did you see related to spawning activity?">
        <textarea
          value={data.spawn_observations}
          onChange={e => onChange({ spawn_observations: e.target.value })}
          rows={3}
          placeholder="e.g., Saw 3 beds in 2ft near tule line, fish staging on outside edges, males very aggressive"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </FormField>

      <FormField label="General Notes" hint="Anything notable about conditions, bait, patterns, anomalies">
        <textarea
          value={data.observational_notes}
          onChange={e => onChange({ observational_notes: e.target.value })}
          rows={4}
          placeholder="e.g., Mud lines on incoming tide, shad flipping on points early, bite died after wind switched to SW, recent rain had water stained up in back of sloughs"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </FormField>
    </div>
  );
}
