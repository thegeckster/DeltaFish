import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTrip, deleteTrip } from '../lib/storage';
import { ArrowLeft, Trash2, MapPin, Clock, Thermometer, Eye, Fish } from 'lucide-react';
import { format } from 'date-fns';
import ConditionsBadges from '../components/ui/ConditionsBadges';

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trip = useMemo(() => id ? getTrip(id) : null, [id]);

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Trip not found</p>
        <Link to="/trips" className="text-blue-600 text-sm mt-2 inline-block">Back to trips</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Delete this trip? This cannot be undone.')) {
      deleteTrip(trip.id);
      navigate('/trips');
    }
  };

  const totalWeight = (trip.fish_catches || []).reduce((sum, c) => sum + (c.weight_lbs || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handleDelete} className="text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">
          {format(new Date(trip.date_fished), 'EEEE, MMMM d, yyyy')}
        </h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span>{trip.launch_location}</span>
          <Clock className="w-3.5 h-3.5 ml-2" />
          <span>{trip.start_time} - {trip.end_time}</span>
        </div>
        {trip.is_tournament && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
            Tournament — {trip.tournament_placement ? `#${trip.tournament_placement}` : 'Placed'} {trip.tournament_weight_lbs ? `(${trip.tournament_weight_lbs} lbs)` : ''}
          </div>
        )}
      </div>

      {/* Water Conditions */}
      <Section title="Water Conditions">
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon={Thermometer} label="Water Temp" value={`${trip.water_temp_f}°F`} />
          <InfoItem icon={Eye} label="Clarity" value={`${trip.water_clarity_inches}"`} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {trip.vegetation_types.map(v => (
            <span key={v} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{v}</span>
          ))}
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs capitalize">{trip.vegetation_density}</span>
        </div>
      </Section>

      {/* Fishing Details */}
      <Section title="Fishing Details">
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {trip.areas_fished.map(a => (
              <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{a}</span>
            ))}
          </div>
        </div>
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">Lures Used</p>
          <div className="flex flex-wrap gap-1.5">
            {trip.lures_used.map(l => (
              <span
                key={l}
                className={`px-2 py-0.5 rounded text-xs ${
                  trip.lures_caught_fish.includes(l)
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {l} {trip.lures_caught_fish.includes(l) && '✓'}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Catches */}
      <Section title={`Catches (${(trip.fish_catches || []).length} fish, ${totalWeight.toFixed(1)} lbs)`}>
        {(trip.fish_catches || []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">No catches recorded</p>
        ) : (
          <div className="space-y-2">
            {(trip.fish_catches || []).map((fc, i) => (
              <div key={fc.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Fish className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-700">{fc.species}</span>
                </div>
                <div className="text-right">
                  {fc.weight_lbs && <span className="text-sm font-medium text-slate-800">{fc.weight_lbs} lbs</span>}
                  {fc.lure_used && <span className="text-xs text-slate-400 ml-2">on {fc.lure_used}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Environmental Conditions */}
      {trip.conditions && (
        <Section title="Environmental Conditions">
          <ConditionsBadges conditions={trip.conditions} />
        </Section>
      )}

      {/* Observations */}
      {(trip.spawn_observations || trip.observational_notes) && (
        <Section title="Observations">
          {trip.spawn_observations && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-0.5">Spawn</p>
              <p className="text-sm text-slate-700">{trip.spawn_observations}</p>
            </div>
          )}
          {trip.observational_notes && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Notes</p>
              <p className="text-sm text-slate-700">{trip.observational_notes}</p>
            </div>
          )}
        </Section>
      )}

      {/* Tournament */}
      {trip.is_tournament && trip.winning_pattern_notes && (
        <Section title="Winning Pattern">
          <p className="text-sm text-slate-700">{trip.winning_pattern_notes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
