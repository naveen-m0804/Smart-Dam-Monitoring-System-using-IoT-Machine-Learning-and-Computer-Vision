import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Weather } from "@/lib/api";

interface WeatherCardProps {
  weather: Weather | null;
  onClick?: () => void;
}

function getWeatherInfo(code: number | null) {
  if (code === null || code === undefined) {
    return { label: "Unknown", icon: Cloud, theme: "default" };
  }
  if (code === 0) return { label: "Clear sky", icon: Sun, theme: "clear" };
  if ([1, 2].includes(code)) return { label: "Partly cloudy", icon: Cloud, theme: "cloudy" };
  if (code === 3) return { label: "Cloudy", icon: Cloud, theme: "cloudy" };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: CloudFog, theme: "foggy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", icon: CloudRain, theme: "rain" };
  if ([61, 63, 65, 66, 67].includes(code)) return { label: "Rain", icon: CloudRain, theme: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", icon: CloudSnow, theme: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Storm", icon: CloudLightning, theme: "storm" };
  return { label: "Weather", icon: Cloud, theme: "default" };
}

export function WeatherCard({ weather, onClick }: WeatherCardProps) {
  const temp = weather?.temperature != null ? weather.temperature.toFixed(1) : null;
  const wind = weather?.windspeed != null ? `${weather.windspeed.toFixed(1)} km/h` : "NA";
  const humidity = weather?.humidity != null ? `${weather.humidity.toFixed(0)}%` : "NA";
  const time = weather?.time || "";
  const code = weather?.weathercode ?? null;
  const info = getWeatherInfo(code);
  const WeatherIcon = info.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border card-hover h-[320px] flex flex-col",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

      <div className="p-6 flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <WeatherIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Weather</h3>
              <p className="text-xs text-muted-foreground">{weather?.locationName || "Chennai"}</p>
            </div>
          </div>
          {time && (
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {time}
            </span>
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {temp ?? "NA"}
                {temp && <span className="text-lg font-normal text-muted-foreground">°C</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{info.label}</p>
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <WeatherIcon className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
              <Wind className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-medium text-foreground">{wind}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
              <Droplets className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium text-foreground">{humidity}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
