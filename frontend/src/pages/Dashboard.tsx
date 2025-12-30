import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  getWeather, 
  getValveStatus, 
  getReadings, 
  getVibrationLogs, 
  controlValve,
  type Reading,
  type ValveStatus,
  type Weather,
  type VibrationLog
} from "@/lib/api";
import { DamLayout } from "@/components/dam/DamLayout";
import { WaterLevelCard } from "@/components/dam/cards/WaterLevelCard";
import { RainfallCard } from "@/components/dam/cards/RainfallCard";
import { EnvironmentCard } from "@/components/dam/cards/EnvironmentCard";
import { VibrationCard } from "@/components/dam/cards/VibrationCard";
import { WeatherCard } from "@/components/dam/cards/WeatherCard";
import { LocationCard } from "@/components/dam/cards/LocationCard";
import { Activity, Droplets, Thermometer, Gauge } from "lucide-react";

export default function Dashboard() {
  const [latestReading, setLatestReading] = useState<Reading | null>(null);
  const [envHistory, setEnvHistory] = useState<Reading[]>([]);
  const [valveStatus, setValveStatus] = useState<ValveStatus | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [lastVibrationAlert, setLastVibrationAlert] = useState<VibrationLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadAll = async () => {
    try {
      const [readings, valve, weath, vibLogs] = await Promise.all([
        getReadings(),
        getValveStatus(),
        getWeather(),
        getVibrationLogs(),
      ]);

      if (Array.isArray(readings) && readings.length > 0) {
        setLatestReading(readings[0]);
        setEnvHistory(readings.slice(0, 20).reverse());
      }

      if (valve) setValveStatus(valve);
      if (weath) setWeather(weath);

      if (Array.isArray(vibLogs) && vibLogs.length > 0) {
        setLastVibrationAlert(vibLogs[0]);
      }

      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard data. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: string) => {
    if (!isAdmin) return;
    controlValve(mode, "NONE").catch(console.error);
  };

  const handleManualOpen = () => {
    if (!isAdmin) return;
    controlValve("MANUAL", "OPEN").catch(console.error);
  };

  const handleManualClose = () => {
    if (!isAdmin) return;
    controlValve("MANUAL", "CLOSE").catch(console.error);
  };

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 2000);
    return () => clearInterval(id);
  }, []);

  // Derived values
  const dist = typeof latestReading?.distance === "number" ? latestReading.distance : null;
  const pct = typeof latestReading?.percent === "number" ? latestReading.percent : null;

  const rainfallRaw = latestReading?.rainPredPercent ?? 
    latestReading?.rain_prediction ?? 
    latestReading?.rainfall ?? 
    latestReading?.rainPercent ?? 
    latestReading?.rain ?? 0;

  let rainfallPercent = 0;
  if (typeof rainfallRaw === "number") {
    rainfallPercent = rainfallRaw;
  } else if (typeof rainfallRaw === "string") {
    const parsed = parseFloat(rainfallRaw);
    rainfallPercent = Number.isNaN(parsed) ? 0 : parsed;
  }

  const currentVibration = !!latestReading?.vibration;
  const valveMode = valveStatus?.mode || "AUTO";

  // Quick stats for header
  const stats = [
    { 
      label: "Water Level", 
      value: pct !== null ? `${pct.toFixed(1)}%` : "NA", 
      icon: Droplets, 
      color: "text-primary" 
    },
    { 
      label: "Temperature", 
      value: latestReading?.temp != null ? `${latestReading.temp.toFixed(1)}°C` : "NA", 
      icon: Thermometer, 
      color: "text-orange-400" 
    },
    { 
      label: "Humidity", 
      value: latestReading?.humidity != null ? `${latestReading.humidity.toFixed(1)}%` : "NA", 
      icon: Gauge, 
      color: "text-success" 
    },
    { 
      label: "Vibration", 
      value: currentVibration ? "ALERT" : "Normal", 
      icon: Activity, 
      color: currentVibration ? "text-destructive" : "text-success" 
    },
  ];

  return (
    <DamLayout>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div 
            key={stat.label}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border animate-fade-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Main Grid - 3 columns, 2 rows */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 */}
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <WaterLevelCard
              distanceCm={dist}
              percent={pct}
              valveState={valveStatus?.state}
              reason={valveStatus?.reason}
              mode={valveMode}
              isAdmin={isAdmin}
              onModeChange={handleModeChange}
              onManualOpen={handleManualOpen}
              onManualClose={handleManualClose}
              onClick={isAdmin ? () => navigate("/logs/water-level") : undefined}
            />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <RainfallCard
              percent={rainfallPercent}
              timestamp={latestReading?.timestamp}
              onClick={isAdmin ? () => navigate("/logs/rainfall") : undefined}
            />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <EnvironmentCard
              latest={latestReading}
              history={envHistory}
              onClick={isAdmin ? () => navigate("/logs/env") : undefined}
            />
          </div>

          {/* Row 2 */}
          <div className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <VibrationCard
              currentVibration={currentVibration}
              lastAlert={lastVibrationAlert}
              onClick={isAdmin ? () => navigate("/logs/vibration") : undefined}
            />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <WeatherCard weather={weather} />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.6s" }}>
            <LocationCard />
          </div>
        </div>
      )}
    </DamLayout>
  );
}
