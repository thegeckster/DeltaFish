import { getSettings } from './storage';
import type { TripFormData, FishCatchInput } from '../types';

const PARSE_SYSTEM_PROMPT = `You are a fishing trip data parser for California Delta bass fishing. Extract structured data from the transcript of a fisherman describing their trip. Return a JSON object with these fields (use null for anything not mentioned):
{
  "date_fished": "YYYY-MM-DD or null",
  "launch_location": "string or null",
  "start_time": "HH:MM (24hr) or null",
  "end_time": "HH:MM (24hr) or null",
  "water_temp_f": number or null,
  "water_clarity_inches": number or null,
  "vegetation_types": ["array of strings"],
  "vegetation_density": "sparse/moderate/dense or null",
  "areas_fished": ["array of strings"],
  "lures_used": ["array of strings"],
  "lures_caught_fish": ["array of strings"],
  "fish_catches": [{"species": "string", "weight_lbs": number or null, "lure_used": "string"}],
  "spawn_observations": "string or null",
  "observational_notes": "string or null",
  "is_tournament": boolean,
  "tournament_placement": number or null,
  "tournament_weight_lbs": number or null,
  "winning_pattern_notes": "string or null"
}

Common California Delta launch locations: Russo's Marina, Holland Riverside Marina, B&W Resort, Ladd's Marina, Bethel Island, Discovery Bay, Windmill Cove, Brannan Island, Frank's Tract, Antioch Marina.

Common lure names to normalize to: Senko/Wacky Rig, Texas Rig Worm, Jig, Spinnerbait, Chatterbait, Crankbait, Jerkbait, Topwater Frog, Topwater Popper, Swimbait, Drop Shot, Punch Rig, Ned Rig, Flipping Jig, Buzzbait, Alabama Rig.

Common area types to normalize to: Slough, Marina, Open Bank, Points, Inside Bends, Rip-Rap, Flooded Trees, Docks, Levee Breaks, Main River.

Vegetation types to normalize to: Tules, Hydrilla, Hyacinth Mats, Sparse Weeds, Lily Pads, Open/None.

If the fisherman says "senko" normalize to "Senko/Wacky Rig". If they say "worm" or "t-rig" normalize to "Texas Rig Worm". If they say "frog" normalize to "Topwater Frog". Use your best judgment for similar normalizations.

For water clarity, if they say "stained" estimate 10-12 inches. "Muddy" estimate 4-6 inches. "Clear" estimate 24-30 inches. "Chocolate" estimate 2-3 inches.

If they mention a weight like "three pounder" or "three pound fish", record weight_lbs as 3.0.

Return ONLY valid JSON, no markdown formatting, no code fences.`;

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const settings = await getSettings();
  if (!settings.openai_api_key) {
    throw new Error('OpenAI API key not configured. Go to Settings to add it.');
  }

  const formData = new FormData();
  const ext = audioBlob.type.includes('mp4') ? 'mp4' :
              audioBlob.type.includes('webm') ? 'webm' : 'wav';
  formData.append('file', audioBlob, `recording.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openai_api_key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Whisper API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}

export async function parseTranscript(transcript: string): Promise<Partial<TripFormData>> {
  const settings = await getSettings();
  if (!settings.openai_api_key) {
    throw new Error('OpenAI API key not configured.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openai_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PARSE_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `GPT API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from GPT');

  const parsed = JSON.parse(content);

  // Convert to TripFormData format
  const fishCatches: FishCatchInput[] = (parsed.fish_catches || []).map((fc: any) => ({
    id: crypto.randomUUID(),
    species: fc.species || 'Largemouth Bass',
    weight_lbs: fc.weight_lbs?.toString() || '',
    lure_used: fc.lure_used || '',
    notes: '',
  }));

  return {
    date_fished: parsed.date_fished || new Date().toISOString().split('T')[0],
    launch_location: parsed.launch_location || '',
    start_time: parsed.start_time || '',
    end_time: parsed.end_time || '',
    water_temp_f: parsed.water_temp_f?.toString() || '',
    water_clarity_inches: parsed.water_clarity_inches?.toString() || '',
    vegetation_types: parsed.vegetation_types || [],
    vegetation_density: parsed.vegetation_density || '',
    areas_fished: parsed.areas_fished || [],
    lures_used: parsed.lures_used || [],
    lures_caught_fish: parsed.lures_caught_fish || [],
    spawn_observations: parsed.spawn_observations || '',
    observational_notes: parsed.observational_notes || '',
    is_tournament: parsed.is_tournament || false,
    tournament_placement: parsed.tournament_placement?.toString() || '',
    tournament_weight_lbs: parsed.tournament_weight_lbs?.toString() || '',
    winning_pattern_notes: parsed.winning_pattern_notes || '',
    fish_catches: fishCatches,
  };
}
