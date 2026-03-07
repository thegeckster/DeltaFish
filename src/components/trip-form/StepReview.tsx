import { TripFormData } from '../../types';

interface Props {
  data: TripFormData;
  errors: Record<string, string>;
}

export default function StepReview({ data, errors }: Props) {
  const hasErrors = Object.keys(errors).length > 0;
  const totalWeight = data.fish_catches.reduce(
    (sum, fc) => sum + (fc.weight_lbs ? parseFloat(fc.weight_lbs) : 0),
    0
  );

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Review Trip</h2>

      {hasErrors && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700 mb-1">Missing required fields:</p>
          <ul className="text-sm text-red-600 list-disc pl-4">
            {Object.values(errors).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <ReviewSection title="Basics">
          <ReviewRow label="Date" value={data.date_fished} />
          <ReviewRow label="Launch" value={data.launch_location} />
          <ReviewRow label="Time" value={`${data.start_time} - ${data.end_time}`} />
        </ReviewSection>

        <ReviewSection title="Water Conditions">
          <ReviewRow label="Temp" value={data.water_temp_f ? `${data.water_temp_f}°F` : ''} />
          <ReviewRow label="Clarity" value={data.water_clarity_inches ? `${data.water_clarity_inches}"` : ''} />
          <ReviewRow label="Vegetation" value={data.vegetation_types.join(', ')} />
          <ReviewRow label="Density" value={data.vegetation_density} />
        </ReviewSection>

        <ReviewSection title="Fishing">
          <ReviewRow label="Areas" value={data.areas_fished.join(', ')} />
          <ReviewRow label="Lures Used" value={data.lures_used.join(', ')} />
          <ReviewRow label="Caught On" value={data.lures_caught_fish.join(', ')} />
        </ReviewSection>

        <ReviewSection title={`Catches (${data.fish_catches.length} fish, ${totalWeight.toFixed(1)} lbs)`}>
          {data.fish_catches.map((fc, i) => (
            <ReviewRow
              key={fc.id}
              label={`Fish #${i + 1}`}
              value={`${fc.species}${fc.weight_lbs ? ` — ${fc.weight_lbs} lbs` : ''} on ${fc.lure_used || 'N/A'}`}
            />
          ))}
          {data.fish_catches.length === 0 && (
            <p className="text-sm text-slate-400 italic">No catches recorded</p>
          )}
        </ReviewSection>

        {data.is_tournament && (
          <ReviewSection title="Tournament">
            <ReviewRow label="Placement" value={data.tournament_placement || 'N/A'} />
            <ReviewRow label="Weight" value={data.tournament_weight_lbs ? `${data.tournament_weight_lbs} lbs` : 'N/A'} />
            {data.winning_pattern_notes && (
              <ReviewRow label="Winner" value={data.winning_pattern_notes} />
            )}
          </ReviewSection>
        )}

        {(data.spawn_observations || data.observational_notes) && (
          <ReviewSection title="Observations">
            {data.spawn_observations && <ReviewRow label="Spawn" value={data.spawn_observations} />}
            {data.observational_notes && <ReviewRow label="Notes" value={data.observational_notes} />}
          </ReviewSection>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const missing = !value;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={missing ? 'text-red-400 italic' : 'text-slate-800 text-right max-w-[60%]'}>
        {missing ? 'Missing' : value}
      </span>
    </div>
  );
}
