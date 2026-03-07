import { TripFormData, LAUNCH_LOCATIONS } from '../../types';
import FormField from '../ui/FormField';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
  errors: Record<string, string>;
}

export default function StepBasics({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Trip Basics</h2>
      
      <FormField label="Date Fished" required error={errors.date_fished}>
        <input
          type="date"
          value={data.date_fished}
          onChange={e => onChange({ date_fished: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>

      <FormField label="Launch Location" required error={errors.launch_location}>
        <select
          value={data.launch_location}
          onChange={e => onChange({ launch_location: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Select a launch...</option>
          {LAUNCH_LOCATIONS.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
          <option value="__custom">Other (type your own)</option>
        </select>
        {data.launch_location === '__custom' && (
          <input
            type="text"
            placeholder="Enter launch location"
            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => onChange({ launch_location: e.target.value })}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start Time" required error={errors.start_time}>
          <input
            type="time"
            value={data.start_time}
            onChange={e => onChange({ start_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        <FormField label="End Time" required error={errors.end_time}>
          <input
            type="time"
            value={data.end_time}
            onChange={e => onChange({ end_time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </div>
    </div>
  );
}
