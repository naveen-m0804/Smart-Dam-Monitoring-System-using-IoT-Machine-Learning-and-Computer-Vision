import { Droplets, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaterLevelCardProps {
  distanceCm: number | null;
  percent: number | null;
  valveState?: string;
  reason?: string;
  mode?: string;
  isAdmin?: boolean;
  onModeChange?: (mode: string) => void;
  onManualOpen?: () => void;
  onManualClose?: () => void;
  onClick?: () => void;
}

export function WaterLevelCard({
  distanceCm,
  percent,
  valveState,
  reason,
  mode,
  isAdmin,
  onModeChange,
  onManualOpen,
  onManualClose,
  onClick,
}: WaterLevelCardProps) {
  const safePercent = typeof percent === "number" && !Number.isNaN(percent)
    ? Math.max(0, Math.min(100, percent))
    : null;

  const distanceText = typeof distanceCm === "number" && !Number.isNaN(distanceCm)
    ? distanceCm.toFixed(1)
    : "NA";

  const isManual = mode === "MANUAL";
  const isOpen = valveState === "OPEN";

  const getWaterColor = () => {
    if (safePercent === null) return "from-primary/20 to-water-secondary/20";
    if (safePercent >= 80) return "from-destructive to-destructive/80";
    if (safePercent >= 60) return "from-warning to-warning/80";
    return "from-primary to-water-secondary";
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border card-hover h-[320px] flex flex-col",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-primary to-water-secondary" />
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Water Level</h3>
              <p className="text-xs text-muted-foreground">& Valve Control</p>
            </div>
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            isOpen 
              ? "bg-success/10 text-success border border-success/20" 
              : "bg-secondary text-secondary-foreground"
          )}>
            {valveState || "UNKNOWN"}
          </div>
        </div>

        {/* Water Tank Visualization */}
        <div className="flex gap-4 flex-1">
          {/* Tank */}
          <div className="relative w-16 h-28 rounded-lg bg-secondary/50 border-2 border-border overflow-hidden flex-shrink-0">
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t transition-all duration-1000",
                getWaterColor()
              )}
              style={{ height: safePercent !== null ? `${safePercent}%` : "0%" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground drop-shadow-lg">
                {safePercent !== null ? `${safePercent.toFixed(0)}%` : "NA"}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="p-2 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-1 mb-0.5">
                <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Distance</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {distanceText} {distanceText !== "NA" && <span className="text-xs font-normal text-muted-foreground">cm</span>}
              </p>
            </div>

            {isAdmin && onModeChange && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onModeChange("AUTO"); }}
                  className={cn(
                    "flex-1 py-1 px-2 rounded text-xs font-medium transition-all",
                    mode === "AUTO"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  )}
                >
                  AUTO
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onModeChange("MANUAL"); }}
                  className={cn(
                    "flex-1 py-1 px-2 rounded text-xs font-medium transition-all",
                    mode === "MANUAL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  )}
                >
                  MANUAL
                </button>
              </div>
            )}

            <div className="text-xs">
              <span className="text-muted-foreground">Reason: </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium",
                reason === "HIGH_WATER" ? "bg-destructive/10 text-destructive" :
                reason === "VIBRATION" ? "bg-warning/10 text-warning" :
                "bg-success/10 text-success"
              )}>
                {reason || "SAFE_LEVEL"}
              </span>
            </div>

            {isAdmin && isManual && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onManualOpen?.(); }}
                  className="flex-1 py-1 rounded bg-success/10 text-success border border-success/20 hover:bg-success/20 text-xs font-medium"
                >
                  Open
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onManualClose?.(); }}
                  className="flex-1 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
