import { TripFormData, AREAS, LURE_TYPES } from '../../types';
import ChipSelect from '../ui/ChipSelect';

interface Props {
  data: TripFormData;
  onChange: (data: Partial<TripFormData>) => void;
  errors: Record<string, string>;
}

export default function StepFishingDetails({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Fishing Details</h2>

      <div className="mb-5">
        <ChipSelect
          label="Areas Fished"
          options={AREAS}
          selected={data.areas_fished}
          onChange={areas => onChange({ areas_fished: areas })}
        />
        {errors.areas_fished && <p className="mt-1 text-xs text-red-500">{errors.areas_fished}</p>}
      </div>

      <div className="mb-5">
        <ChipSelect
          label="Lures Used"
          options={LURE_TYPES}
          selected={data.lures_used}
          onChange={lures => onChange({ lures_used: lures })}
          allowCustom
        />
        {errors.lures_used && <p className="mt-1 text-xs text-red-500">{errors.lures_used}</p>}
      </div>

      {data.lures_used.length > 0 && (
        <div>
          <ChipSelect
            label="Lures That Caught Fish"
            options={data.lures_used}
            selected={data.lures_caught_fish}
            onChange={lures => onChange({ lures_caught_fish: lures })}
          />
        </div>
      )}
    </div>
  );
}
