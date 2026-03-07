import { TripFormData, VEGETATION_TYPES, VEGETATION_DENSITIES } from '../../types';
import FormField from '../ui/FormField';
import ChipSelect from '../ui/ChipSelect';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
  errors: Record<string, string>;
}

export default function StepWaterConditions({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Water Conditions</h2>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Water Temp" required error={errors.water_temp_f} hint="Degrees F">
          <div className="relative">
            <input
              type="number"
              value={data.water_temp_f}
              onChange={e => onChange({ water_temp_f: e.target.value })}
              placeholder="62"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">°F</span>
          </div>
        </FormField>

        <FormField label="Water Clarity" required error={errors.water_clarity_inches} hint="Visibility in inches">
          <div className="relative">
            <input
              type="number"
              value={data.water_clarity_inches}
              onChange={e => onChange({ water_clarity_inches: e.target.value })}
              placeholder="12"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-slate-400 text-sm">in</span>
          </div>
        </FormField>
      </div>

      <div className="mt-4">
        <ChipSelect
          label="Vegetation Types"
          options={VEGETATION_TYPES}
          selected={data.vegetation_types}
          onChange={veg => onChange({ vegetation_types: veg })}
        />
        {errors.vegetation_types && <p className="mt-1 text-xs text-red-500">{errors.vegetation_types}</p>}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Vegetation Density
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="flex gap-2">
          {VEGETATION_DENSITIES.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ vegetation_density: d })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                data.vegetation_density === d
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {errors.vegetation_density && <p className="mt-1 text-xs text-red-500">{errors.vegetation_density}</p>}
      </div>
    </div>
  );
}
