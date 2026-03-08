import { getTrips, getAllCatches, getAllConditions, getSettings } from './storage';
import type { Trip, FishCatch, TripConditions } from '../types';

const SYSTEM_PROMPT = `You are DeltaFish AI — a California Delta largemouth bass fishing advisor. You have access to this angler's complete trip history below. Use it to give specific, data-backed recommendations.

When the angler asks where to go, what to throw, or how to approach an upcoming trip:
- Reference specific past trips that are relevant (by date, location, conditions)
- Identify patterns in their data: what lures work in what conditions, which spots produce in which seasons
- Factor in seasonality, water temp trends, spawn timing, tide patterns, and moon phase if the data supports it
- Be specific: say "Senko in stained water around Franks Tract produced 4 fish on March 8th" not "try soft plastics"
- If they mention upcoming conditions (date, weather, water temp), match to similar historical trips
- Be honest when data is limited — say "you only have 2 trips in this temp range, but..."

Keep responses conversational and practical. This is a buddy giving fishing advice, not a textbook. No corporate speak. Be direct.

California Delta context you should know:
- The Delta is a tidal fishery — tide stage matters a lot
- Key areas: Frank's Tract, Bethel Island, Discovery Bay, Old River, Middle River, various sloughs
- Largemouth bass spawn roughly Feb-May depending on water temp (60-72°F range)
- Tule banks, hydrilla, hyacinth mats, and rip-rap are key structure
- Common tournament launches: Russo's Marina, Holland Riverside, B&W Resort, Ladd's Marina

ANGLER'S TRIP HISTORY:
{TRIP_DATA}

Current date: {CURRENT_DATE}
Total trips logged: {TRIP_COUNT}`;

function buildTripSummary(trips: Trip[], catches: FishCatch[], conditions: TripConditions[]): string {
  if (trips.length === 0) return 'No trips logged yet.';

  const catchMap: Record<string, FishCatch[]> = {};
  catches.forEach(c => {
    if (!catchMap[c.trip_id]) catchMap[c.trip_id] = [];
    catchMap[c.trip_id].push(c);
  });

  const condMap: Record<string, TripConditions> = {};
  conditions.forEach(c => { condMap[c.trip_id] = c; });

  return trips.map(t => {
    const tc = catchMap[t.id] || [];
    const cond = condMap[t.id];
    const totalWeight = tc.reduce((s, c) => s + (c.weight_lbs || 0), 0);

    let summary = `--- Trip: ${t.date_fished} ---
Launch: ${t.launch_location}
Time: ${t.start_time}-${t.end_time}
Water: ${t.water_temp_f}°F, ${t.water_clarity_inches}" clarity
Vegetation: ${t.vegetation_types.join(', ')} (${t.vegetation_density})
Areas: ${t.areas_fished.join(', ')}
Lures used: ${t.lures_used.join(', ')}
Lures that caught fish: ${t.lures_caught_fish.length > 0 ? t.lures_caught_fish.join(', ') : 'none'}
Catches: ${tc.length} fish, ${totalWeight.toFixed(1)} lbs total`;

    if (tc.length > 0) {
      summary += '\n  Fish: ' + tc.map(c =>
        `${c.species} ${c.weight_lbs ? c.weight_lbs + 'lbs' : 'no weight'} on ${c.lure_used}`
      ).join('; ');
    }

    if (cond) {
      const parts: string[] = [];
      if (cond.air_temp_start_f) parts.push(`Air: ${cond.air_temp_start_f}-${cond.air_temp_end_f}°F`);
      if (cond.wind_speed_avg_mph) parts.push(`Wind: ${cond.wind_speed_avg_mph}mph ${cond.wind_direction || ''}`);
      if (cond.barometric_pressure_trend) parts.push(`Baro: ${cond.barometric_pressure_trend}`);
      if (cond.tide_stage_dominant) parts.push(`Tide: ${cond.tide_stage_dominant}`);
      if (cond.moon_phase) parts.push(`Moon: ${cond.moon_phase} (${cond.moon_illumination_pct}%)`);
      if (cond.rainfall_48hr_inches) parts.push(`Rain 48hr: ${cond.rainfall_48hr_inches}"`);
      if (cond.spawn_phase_estimate) parts.push(`Spawn: ${cond.spawn_phase_estimate}`);
      if (parts.length > 0) summary += '\n  Conditions: ' + parts.join(', ');
    }

    if (t.spawn_observations) summary += `\n  Spawn obs: ${t.spawn_observations}`;
    if (t.observational_notes) summary += `\n  Notes: ${t.observational_notes}`;
    if (t.is_tournament) {
      summary += `\n  TOURNAMENT — Place: #${t.tournament_placement || '?'}, Weight: ${t.tournament_weight_lbs || '?'} lbs`;
      if (t.winning_pattern_notes) summary += `, Winning pattern: ${t.winning_pattern_notes}`;
    }

    return summary;
  }).join('\n\n');
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  const settings = await getSettings();
  if (!settings.openai_api_key) {
    throw new Error('OpenAI API key not configured. Go to Settings to add it.');
  }

  // Fetch all trip data
  const [trips, catches, conditions] = await Promise.all([
    getTrips(),
    getAllCatches(),
    getAllConditions(),
  ]);

  const tripSummary = buildTripSummary(trips, catches, conditions);
  const systemPrompt = SYSTEM_PROMPT
    .replace('{TRIP_DATA}', tripSummary)
    .replace('{CURRENT_DATE}', new Date().toISOString().split('T')[0])
    .replace('{TRIP_COUNT}', trips.length.toString());

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openai_api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}
