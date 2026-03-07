export interface Trip {
  id: string;
  created_at: string;
  user_id: string;
  date_fished: string;
  launch_location: string;
  start_time: string;
  end_time: string;
  water_temp_f: number;
  water_clarity_inches: number;
  vegetation_types: string[];
  vegetation_density: string;
  areas_fished: string[];
  lures_used: string[];
  lures_caught_fish: string[];
  spawn_observations: string;
  observational_notes: string;
  is_tournament: boolean;
  tournament_placement: number | null;
  tournament_weight_lbs: number | null;
  winning_pattern_notes: string | null;
  // Joined data
  fish_catches?: FishCatch[];
  conditions?: TripConditions;
}

export interface FishCatch {
  id: string;
  trip_id: string;
  species: string;
  weight_lbs: number | null;
  lure_used: string;
  notes: string | null;
}

export interface TripConditions {
  id: string;
  trip_id: string;
  weather_hourly: any[];
  air_temp_start_f: number | null;
  air_temp_end_f: number | null;
  wind_speed_avg_mph: number | null;
  wind_direction: string | null;
  barometric_pressure_trend: string | null;
  barometric_pressure_start: number | null;
  barometric_pressure_end: number | null;
  tide_schedule: any[];
  tide_stage_dominant: string | null;
  tide_coefficient: number | null;
  moon_phase: string | null;
  moon_illumination_pct: number | null;
  rainfall_48hr_inches: number | null;
  spawn_phase_estimate: string | null;
}

export interface TripFormData {
  date_fished: string;
  launch_location: string;
  start_time: string;
  end_time: string;
  water_temp_f: string;
  water_clarity_inches: string;
  vegetation_types: string[];
  vegetation_density: string;
  areas_fished: string[];
  lures_used: string[];
  lures_caught_fish: string[];
  spawn_observations: string;
  observational_notes: string;
  is_tournament: boolean;
  tournament_placement: string;
  tournament_weight_lbs: string;
  winning_pattern_notes: string;
  fish_catches: FishCatchInput[];
}

export interface FishCatchInput {
  id: string;
  species: string;
  weight_lbs: string;
  lure_used: string;
  notes: string;
}

export const LAUNCH_LOCATIONS = [
  "Russo's Marina",
  "Holland Riverside Marina",
  "B&W Resort",
  "Ladd's Marina",
  "Bethel Island",
  "Discovery Bay",
  "Windmill Cove",
  "Brannan Island",
  "Frank's Tract",
  "Antioch Marina",
] as const;

export const VEGETATION_TYPES = [
  "Tules",
  "Hydrilla",
  "Hyacinth Mats",
  "Sparse Weeds",
  "Lily Pads",
  "Open/None",
] as const;

export const VEGETATION_DENSITIES = ["sparse", "moderate", "dense"] as const;

export const AREAS = [
  "Slough",
  "Marina",
  "Open Bank",
  "Points",
  "Inside Bends",
  "Rip-Rap",
  "Flooded Trees",
  "Docks",
  "Levee Breaks",
  "Main River",
] as const;

export const LURE_TYPES = [
  "Senko/Wacky Rig",
  "Texas Rig Worm",
  "Jig",
  "Spinnerbait",
  "Chatterbait",
  "Crankbait",
  "Jerkbait",
  "Topwater Frog",
  "Topwater Popper",
  "Swimbait",
  "Drop Shot",
  "Punch Rig",
  "Ned Rig",
  "Flipping Jig",
  "Buzzbait",
  "Alabama Rig",
] as const;

export const MOON_PHASES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
] as const;

export const SPAWN_PHASES = [
  "Winter",
  "Pre-Spawn",
  "Spawn",
  "Post-Spawn",
  "Summer",
  "Fall",
] as const;

export function emptyTripForm(): TripFormData {
  return {
    date_fished: new Date().toISOString().split("T")[0],
    launch_location: "",
    start_time: "06:00",
    end_time: "13:00",
    water_temp_f: "",
    water_clarity_inches: "",
    vegetation_types: [],
    vegetation_density: "",
    areas_fished: [],
    lures_used: [],
    lures_caught_fish: [],
    spawn_observations: "",
    observational_notes: "",
    is_tournament: false,
    tournament_placement: "",
    tournament_weight_lbs: "",
    winning_pattern_notes: "",
    fish_catches: [],
  };
}
