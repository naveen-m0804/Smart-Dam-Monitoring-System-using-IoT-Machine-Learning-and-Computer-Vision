const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface Reading {
  timestamp: string;
  temp?: number;
  humidity?: number;
  distance?: number;
  percent?: number;
  water_percent?: number;
  vibration?: boolean;
  rainPredPercent?: number;
  rain_prediction?: number;
  rainfall?: number;
  rainPercent?: number;
  rain?: number;
}

export interface ValveStatus {
  state: string;
  reason: string;
  timestamp: string;
  mode: string;
}

export interface Weather {
  locationName: string;
  temperature: number | null;
  windspeed: number | null;
  humidity: number | null;
  time: string;
  weathercode: number | null;
}

export interface VibrationLog {
  timestamp: string;
  level?: string;
  nodeId?: string;
}

export interface WaterLevelLog {
  timestamp: string;
  distanceCm?: number;
  distance?: number;
  nodeId?: string;
}

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export async function getReadings(): Promise<Reading[]> {
  return fetchJSON<Reading[]>("/api/readings");
}

export async function getValveStatus(): Promise<ValveStatus> {
  return fetchJSON<ValveStatus>("/api/valve");
}

export async function getWeather(): Promise<Weather> {
  return fetchJSON<Weather>("/api/weather");
}

export async function getVibrationLogs(): Promise<VibrationLog[]> {
  return fetchJSON<VibrationLog[]>("/api/vibration/logs");
}

export async function getWaterLevelLogs(): Promise<WaterLevelLog[]> {
  return fetchJSON<WaterLevelLog[]>("/api/waterlevel/logs");
}

export async function controlValve(mode: string, command: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/valve/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, command }),
  });
  return res.json();
}
