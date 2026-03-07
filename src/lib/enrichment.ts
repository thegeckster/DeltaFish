import { format, subDays } from 'date-fns';

const OAKLEY_LAT = 37.9974;
const OAKLEY_LON = -121.7125;
const NOAA_STATION = '9415020'; // Antioch

export async function enrichTrip(dateFished: string, startTime: string, endTime: string, waterTempF: number) {
  const [weather, tides, moon, rainfall] = await Promise.allSettled([
    fetchWeather(dateFished, startTime, endTime),
    fetchTides(dateFished),
    calculateMoonPhase(dateFished),
    fetchRainfall(dateFished),
  ]);

  const weatherData = weather.status === 'fulfilled' ? weather.value : null;
  const tideData = tides.status === 'fulfilled' ? tides.value : null;
  const moonData = moon.status === 'fulfilled' ? moon.value : null;
  const rainfallData = rainfall.status === 'fulfilled' ? rainfall.value : null;

  return {
    weather_hourly: weatherData?.hourly || [],
    air_temp_start_f: weatherData?.airTempStart ?? null,
    air_temp_end_f: weatherData?.airTempEnd ?? null,
    wind_speed_avg_mph: weatherData?.windSpeedAvg ?? null,
    wind_direction: weatherData?.windDirection ?? null,
    barometric_pressure_trend: weatherData?.pressureTrend ?? null,
    barometric_pressure_start: weatherData?.pressureStart ?? null,
    barometric_pressure_end: weatherData?.pressureEnd ?? null,
    tide_schedule: tideData?.schedule || [],
    tide_stage_dominant: tideData?.dominantStage ?? null,
    tide_coefficient: tideData?.coefficient ?? null,
    moon_phase: moonData?.phase ?? null,
    moon_illumination_pct: moonData?.illumination ?? null,
    rainfall_48hr_inches: rainfallData ?? null,
    spawn_phase_estimate: estimateSpawnPhase(dateFished, waterTempF),
  };
}

async function fetchWeather(date: string, startTime: string, endTime: string) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${OAKLEY_LAT}&longitude=${OAKLEY_LON}&start_date=${date}&end_date=${date}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  
  const res = await fetch(url);
  if (!res.ok) {
    // Try forecast API for recent dates
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${OAKLEY_LAT}&longitude=${OAKLEY_LON}&start_date=${date}&end_date=${date}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) throw new Error('Weather fetch failed');
    return parseWeatherResponse(await forecastRes.json(), startTime, endTime);
  }
  return parseWeatherResponse(await res.json(), startTime, endTime);
}

function parseWeatherResponse(data: any, startTime: string, endTime: string) {
  const hourly = data.hourly;
  if (!hourly) return null;

  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  const temps: number[] = [];
  const winds: number[] = [];
  const windDirs: number[] = [];
  const pressures: number[] = [];
  const hourlyData: any[] = [];

  for (let h = startHour; h <= endHour && h < hourly.time.length; h++) {
    temps.push(hourly.temperature_2m[h]);
    winds.push(hourly.wind_speed_10m[h]);
    windDirs.push(hourly.wind_direction_10m[h]);
    pressures.push(hourly.surface_pressure[h]);
    hourlyData.push({
      time: hourly.time[h],
      temp_f: hourly.temperature_2m[h],
      wind_mph: hourly.wind_speed_10m[h],
      wind_dir: hourly.wind_direction_10m[h],
      pressure_hpa: hourly.surface_pressure[h],
      precip_in: hourly.precipitation[h],
    });
  }

  const pressureStartInHg = pressures[0] / 33.8639;
  const pressureEndInHg = pressures[pressures.length - 1] / 33.8639;
  const pressureDiff = pressureEndInHg - pressureStartInHg;

  const avgWindDir = windDirs.reduce((a, b) => a + b, 0) / windDirs.length;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirIndex = Math.round(avgWindDir / 45) % 8;

  return {
    hourly: hourlyData,
    airTempStart: temps[0] ?? null,
    airTempEnd: temps[temps.length - 1] ?? null,
    windSpeedAvg: winds.length ? Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10 : null,
    windDirection: directions[dirIndex],
    pressureTrend: pressureDiff > 0.02 ? 'rising' : pressureDiff < -0.02 ? 'falling' : 'stable',
    pressureStart: Math.round(pressureStartInHg * 100) / 100,
    pressureEnd: Math.round(pressureEndInHg * 100) / 100,
  };
}

async function fetchTides(date: string) {
  const dateStr = date.replace(/-/g, '');
  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${dateStr}&end_date=${dateStr}&station=${NOAA_STATION}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&format=json&interval=hilo`;
  
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('Tide fetch failed');
  const data = await res.json();
  
  if (!data.predictions || data.predictions.length === 0) {
    return { schedule: [], dominantStage: null, coefficient: null };
  }

  const predictions = data.predictions.map((p: any) => ({
    time: p.t,
    height_ft: parseFloat(p.v),
    type: p.type === 'H' ? 'high' : 'low',
  }));

  const highs = predictions.filter((p: any) => p.type === 'high');
  const lows = predictions.filter((p: any) => p.type === 'low');
  
  let coefficient = null;
  if (highs.length > 0 && lows.length > 0) {
    const maxHigh = Math.max(...highs.map((h: any) => h.height_ft));
    const minLow = Math.min(...lows.map((l: any) => l.height_ft));
    coefficient = Math.round((maxHigh - minLow) * 100) / 100;
  }

  // Determine dominant stage (simplified)
  let dominantStage = 'mixed';
  if (predictions.length >= 2) {
    const first = predictions[0];
    const second = predictions[1];
    if (first.type === 'low' && second.type === 'high') dominantStage = 'incoming';
    else if (first.type === 'high' && second.type === 'low') dominantStage = 'outgoing';
  }

  return { schedule: predictions, dominantStage, coefficient };
}

function calculateMoonPhase(date: string) {
  const d = new Date(date);
  const referenceNewMoon = new Date(2000, 0, 6, 18, 14); // Jan 6, 2000
  const synodicMonth = 29.53058770576;
  
  const diffMs = d.getTime() - referenceNewMoon.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cyclePosition = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  
  let phase: string;
  let illumination: number;
  
  if (cyclePosition < 1.85) { phase = 'New Moon'; illumination = 0; }
  else if (cyclePosition < 7.38) { phase = 'Waxing Crescent'; illumination = Math.round((cyclePosition - 1.85) / 5.53 * 50); }
  else if (cyclePosition < 11.07) { phase = 'First Quarter'; illumination = 50; }
  else if (cyclePosition < 14.76) { phase = 'Waxing Gibbous'; illumination = 50 + Math.round((cyclePosition - 11.07) / 3.69 * 50); }
  else if (cyclePosition < 16.61) { phase = 'Full Moon'; illumination = 100; }
  else if (cyclePosition < 22.14) { phase = 'Waning Gibbous'; illumination = 100 - Math.round((cyclePosition - 16.61) / 5.53 * 50); }
  else if (cyclePosition < 25.83) { phase = 'Last Quarter'; illumination = 50; }
  else { phase = 'Waning Crescent'; illumination = Math.round((29.53 - cyclePosition) / 3.70 * 50); }

  return { phase, illumination };
}

async function fetchRainfall(date: string) {
  const d = new Date(date);
  const startDate = format(subDays(d, 2), 'yyyy-MM-dd');
  const endDate = format(subDays(d, 1), 'yyyy-MM-dd');
  
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${OAKLEY_LAT}&longitude=${OAKLEY_LON}&start_date=${startDate}&end_date=${endDate}&hourly=precipitation&precipitation_unit=inch`;
  
  const res = await fetch(url);
  if (!res.ok) {
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${OAKLEY_LAT}&longitude=${OAKLEY_LON}&start_date=${startDate}&end_date=${endDate}&hourly=precipitation&precipitation_unit=inch`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok) return 0;
    const data = await forecastRes.json();
    return data.hourly?.precipitation?.reduce((a: number, b: number) => a + b, 0) ?? 0;
  }
  
  const data = await res.json();
  const total = data.hourly?.precipitation?.reduce((a: number, b: number) => a + b, 0) ?? 0;
  return Math.round(total * 100) / 100;
}

function estimateSpawnPhase(date: string, waterTemp: number): string {
  const month = new Date(date).getMonth() + 1;
  
  if (month >= 10 && month <= 11) return 'Fall';
  if (month === 12 || month <= 2) {
    return waterTemp < 55 ? 'Winter' : 'Pre-Spawn';
  }
  if (waterTemp < 55) return month === 3 ? 'Pre-Spawn' : 'Winter';
  if (waterTemp >= 55 && waterTemp <= 62) return 'Pre-Spawn';
  if (waterTemp >= 63 && waterTemp <= 72) return 'Spawn';
  if (waterTemp >= 73 && waterTemp <= 78) return 'Post-Spawn';
  return 'Summer';
}
