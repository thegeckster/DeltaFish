// Local storage-based persistence for the app.
// This can be swapped for Supabase when the user sets up their project.

import { Trip, FishCatch, TripConditions, TripFormData } from '../types';

const TRIPS_KEY = 'deltafish_trips';
const CATCHES_KEY = 'deltafish_catches';
const CONDITIONS_KEY = 'deltafish_conditions';
const SETTINGS_KEY = 'deltafish_settings';

function generateId(): string {
  return crypto.randomUUID();
}

// Trips
export function getTrips(): Trip[] {
  const data = localStorage.getItem(TRIPS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getTrip(id: string): Trip | null {
  const trips = getTrips();
  const trip = trips.find(t => t.id === id) || null;
  if (trip) {
    trip.fish_catches = getCatchesForTrip(id);
    trip.conditions = getConditionsForTrip(id);
  }
  return trip;
}

export function saveTrip(formData: TripFormData): string {
  const trips = getTrips();
  const id = generateId();
  const trip: Trip = {
    id,
    created_at: new Date().toISOString(),
    user_id: 'local',
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

  trips.push(trip);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));

  // Save fish catches
  if (formData.fish_catches.length > 0) {
    const catches = getCatches();
    for (const fc of formData.fish_catches) {
      catches.push({
        id: generateId(),
        trip_id: id,
        species: fc.species || 'Largemouth Bass',
        weight_lbs: fc.weight_lbs ? parseFloat(fc.weight_lbs) : null,
        lure_used: fc.lure_used,
        notes: fc.notes || null,
      });
    }
    localStorage.setItem(CATCHES_KEY, JSON.stringify(catches));
  }

  return id;
}

export function deleteTrip(id: string): void {
  const trips = getTrips().filter(t => t.id !== id);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  
  const catches = getCatches().filter(c => c.trip_id !== id);
  localStorage.setItem(CATCHES_KEY, JSON.stringify(catches));
  
  const conditions = getAllConditions().filter(c => c.trip_id !== id);
  localStorage.setItem(CONDITIONS_KEY, JSON.stringify(conditions));
}

// Fish Catches
function getCatches(): FishCatch[] {
  const data = localStorage.getItem(CATCHES_KEY);
  return data ? JSON.parse(data) : [];
}

function getCatchesForTrip(tripId: string): FishCatch[] {
  return getCatches().filter(c => c.trip_id === tripId);
}

// Conditions
function getAllConditions(): TripConditions[] {
  const data = localStorage.getItem(CONDITIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function getConditionsForTrip(tripId: string): TripConditions | undefined {
  return getAllConditions().find(c => c.trip_id === tripId);
}

export function saveConditions(tripId: string, conditions: Omit<TripConditions, 'id' | 'trip_id'>): void {
  const all = getAllConditions();
  all.push({
    id: generateId(),
    trip_id: tripId,
    ...conditions,
  } as TripConditions);
  localStorage.setItem(CONDITIONS_KEY, JSON.stringify(all));
}

// Settings
export interface AppSettings {
  openai_api_key: string;
  default_launch_location: string;
  custom_lures: string[];
}

export function getSettings(): AppSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { openai_api_key: '', default_launch_location: '', custom_lures: [] };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Export
export function exportTripsCSV(): string {
  const trips = getTrips();
  if (trips.length === 0) return '';
  
  const headers = [
    'date_fished', 'launch_location', 'start_time', 'end_time', 'water_temp_f',
    'water_clarity_inches', 'vegetation_types', 'vegetation_density', 'areas_fished',
    'lures_used', 'lures_caught_fish', 'fish_count', 'total_weight_lbs',
    'spawn_observations', 'observational_notes', 'is_tournament',
    'tournament_placement', 'tournament_weight_lbs', 'winning_pattern_notes',
  ];
  
  const rows = trips.map(t => {
    const catches = getCatchesForTrip(t.id);
    const totalWeight = catches.reduce((sum, c) => sum + (c.weight_lbs || 0), 0);
    return [
      t.date_fished, t.launch_location, t.start_time, t.end_time, t.water_temp_f,
      t.water_clarity_inches, t.vegetation_types.join('; '), t.vegetation_density,
      t.areas_fished.join('; '), t.lures_used.join('; '), t.lures_caught_fish.join('; '),
      catches.length, totalWeight, t.spawn_observations, t.observational_notes,
      t.is_tournament, t.tournament_placement || '', t.tournament_weight_lbs || '',
      t.winning_pattern_notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportTripsJSON(): string {
  const trips = getTrips().map(t => ({
    ...t,
    fish_catches: getCatchesForTrip(t.id),
    conditions: getConditionsForTrip(t.id),
  }));
  return JSON.stringify(trips, null, 2);
}
