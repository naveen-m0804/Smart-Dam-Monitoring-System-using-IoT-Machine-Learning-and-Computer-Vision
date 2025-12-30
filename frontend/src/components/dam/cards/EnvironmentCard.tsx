import { Thermometer, Droplet } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import type { Reading } from "@/lib/api";

interface EnvironmentCardProps {
  latest: Reading | null;
  history: Reading[];
  onClick?: () => void;
}

export function EnvironmentCard({ latest, history, onClick }: EnvironmentCardProps) {
  const temp = latest && typeof latest.temp === "number" ? latest.temp.toFixed(1) : null;
  const humidity = latest && typeof latest.humidity === "number" ? latest.humidity.toFixed(1) : null;

  const chartData = (history || []).map((r, idx) => ({
    idx,
    temp: r.temp,
    humidity: r.humidity,
  }));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border card-hover h-[320px] flex flex-col",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Environment</h3>
            <p className="text-xs text-muted-foreground">Temperature & Humidity</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div className="flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-muted-foreground">Temp</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {temp ?? "NA"}
              {temp && <span className="text-xs font-normal text-muted-foreground ml-0.5">°C</span>}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-water-secondary/10 border border-primary/20">
            <div className="flex items-center gap-1 mb-1">
              <Droplet className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground">Humidity</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {humidity ?? "NA"}
              {humidity && <span className="text-xs font-normal text-muted-foreground ml-0.5">%</span>}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  labelStyle={{ display: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="hsl(24, 94%, 50%)"
                  strokeWidth={2}
                  dot={false}
                  name="Temp °C"
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={2}
                  dot={false}
                  name="Humidity %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Not enough data for trend
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
