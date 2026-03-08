// Supabase-backed persistence layer for DeltaFish
import { supabase } from './supabase';
import type { Trip, FishCatch, TripConditions, TripFormData } from '../types';

// ============ TRIPS ============

export async function getTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('date_fished', { ascending: false });

  if (error) {
    console.error('Error fetching trips:', error);
    return [];
  }
  return data || [];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !trip) return null;

  // Fetch related data
  const [catchesRes, conditionsRes] = await Promise.all([
    supabase.from('fish_catches').select('*').eq('trip_id', id),
    supabase.from('trip_conditions').select('*').eq('trip_id', id).single(),
  ]);

  trip.fish_catches = catchesRes.data || [];
  trip.conditions = conditionsRes.data || undefined;

  return trip;
}

export async function saveTrip(formData: TripFormData): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const tripData = {
    user_id: user.id,
    date_fished: formData.date_fished,
    launch_location: formData.launch_location,
    start_time: formData.start_time,
    end_time: formData.end_time,
    water_temp_f: parseFloat(formData.water_temp_f),
    water_clarity_inches: parseFloat(formData.water_clarity_inches),
    vegetation_types: formData.vegetation_types,
    vegetation_density: formData.vegetation_density,
    areas_fished: formData.areas_fished,
    lures_used: formData.lures_used,
    lures_caught_fish: formData.lures_caught_fish,
    spawn_observations: formData.spawn_observations,
    observational_notes: formData.observational_notes,
    is_tournament: formData.is_tournament,
    tournament_placement: formData.tournament_placement ? parseInt(formData.tournament_placement) : null,
    tournament_weight_lbs: formData.tournament_weight_lbs ? parseFloat(formData.tournament_weight_lbs) : null,
    winning_pattern_notes: formData.winning_pattern_notes || null,
  };

  const { data, error } = await supabase
    .from('trips')
    .insert(tripData)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save trip: ${error.message}`);
  const tripId = data.id;

  // Save fish catches
  if (formData.fish_catches.length > 0) {
    const catches = formData.fish_catches.map(fc => ({
      trip_id: tripId,
      species: fc.species || 'Largemouth Bass',
      weight_lbs: fc.weight_lbs ? parseFloat(fc.weight_lbs) : null,
      lure_used: fc.lure_used,
      notes: fc.notes || null,
    }));

    const { error: catchError } = await supabase.from('fish_catches').insert(catches);
    if (catchError) console.error('Error saving catches:', catchError);
  }

  return tripId;
}

export async function deleteTrip(id: string): Promise<void> {
  // Cascading deletes handle fish_catches and trip_conditions
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete trip: ${error.message}`);
}

export async function getTripCount(): Promise<number> {
  const { count, error } = await supabase
    .from('trips')
    .select('*', { count: 'exact', head: true });

  if (error) return 0;
  return count || 0;
}

// ============ CONDITIONS ============

export async function saveConditions(
  tripId: string,
  conditions: Omit<TripConditions, 'id' | 'trip_id'>
): Promise<void> {
  const { error } = await supabase
    .from('trip_conditions')
    .insert({ trip_id: tripId, ...conditions });

  if (error) console.error('Error saving conditions:', error);
}

// ============ SETTINGS ============

export interface AppSettings {
  openai_api_key: string;
  default_launch_location: string;
  custom_lures: string[];
}

export async function getSettings(): Promise<AppSettings> {
  const defaults: AppSettings = { openai_api_key: '', default_launch_location: '', custom_lures: [] };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return defaults;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return defaults;

  return {
    openai_api_key: data.openai_api_key || '',
    default_launch_location: data.default_launch_location || '',
    custom_lures: data.custom_lures || [],
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      openai_api_key: settings.openai_api_key,
      default_launch_location: settings.default_launch_location,
      custom_lures: settings.custom_lures,
    }, { onConflict: 'user_id' });

  if (error) console.error('Error saving settings:', error);
}

// ============ BULK QUERIES ============

export async function getAllCatches(): Promise<FishCatch[]> {
  const { data, error } = await supabase
    .from('fish_catches')
    .select('*');

  if (error) {
    console.error('Error fetching catches:', error);
    return [];
  }
  return data || [];
}

export async function getAllConditions(): Promise<TripConditions[]> {
  const { data, error } = await supabase
    .from('trip_conditions')
    .select('*');

  if (error) {
    console.error('Error fetching conditions:', error);
    return [];
  }
  return data || [];
}

// ============ EXPORT ============

export async function exportTripsCSV(): Promise<string> {
  const trips = await getTrips();
  if (trips.length === 0) return '';

  const headers = [
    'date_fished', 'launch_location', 'start_time', 'end_time', 'water_temp_f',
    'water_clarity_inches', 'vegetation_types', 'vegetation_density', 'areas_fished',
    'lures_used', 'lures_caught_fish', 'spawn_observations', 'observational_notes',
    'is_tournament', 'tournament_placement', 'tournament_weight_lbs', 'winning_pattern_notes',
  ];

  const rows = trips.map(t => [
    t.date_fished, t.launch_location, t.start_time, t.end_time, t.water_temp_f,
    t.water_clarity_inches, (t.vegetation_types || []).join('; '), t.vegetation_density,
    (t.areas_fished || []).join('; '), (t.lures_used || []).join('; '),
    (t.lures_caught_fish || []).join('; '), t.spawn_observations, t.observational_notes,
    t.is_tournament, t.tournament_placement || '', t.tournament_weight_lbs || '',
    t.winning_pattern_notes || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export async function exportTripsJSON(): Promise<string> {
  const trips = await getTrips();
  // Fetch full details for each
  const fullTrips = await Promise.all(trips.map(t => getTrip(t.id)));
  return JSON.stringify(fullTrips.filter(Boolean), null, 2);
}
