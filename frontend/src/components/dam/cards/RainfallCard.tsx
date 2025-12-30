import { CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

interface RainfallCardProps {
  percent?: number;
  timestamp?: string;
  onClick?: () => void;
}

export function RainfallCard({ percent = 0, timestamp, onClick }: RainfallCardProps) {
  const safePercent = percent === null || percent === undefined || Number.isNaN(percent)
    ? 0
    : Math.max(0, Math.min(100, percent));

  const getLabel = () => {
    if (safePercent >= 70) return { text: "Very High", color: "text-destructive" };
    if (safePercent >= 40) return { text: "High", color: "text-warning" };
    if (safePercent >= 20) return { text: "Moderate", color: "text-primary" };
    return { text: "Low", color: "text-success" };
  };

  const label = getLabel();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border card-hover h-[320px] flex flex-col",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-500" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Rainfall Prediction</h3>
            {timestamp && (
              <p className="text-xs text-muted-foreground">{timestamp}</p>
            )}
          </div>
        </div>

        {/* Circular Progress */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#rainGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(safePercent / 100) * 264} 264`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="rainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(199, 89%, 48%)" />
                  <stop offset="100%" stopColor="hsl(187, 85%, 43%)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{safePercent.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="text-center mt-2">
          <span className={cn("text-sm font-medium", label.color)}>
            {label.text}
          </span>
          <span className="text-muted-foreground text-sm"> chance of rainfall</span>
        </div>
      </div>
    </div>
  );
}
