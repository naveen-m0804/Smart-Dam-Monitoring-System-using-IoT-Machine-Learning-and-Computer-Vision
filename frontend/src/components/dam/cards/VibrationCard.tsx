import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VibrationLog } from "@/lib/api";

interface VibrationCardProps {
  currentVibration: boolean;
  lastAlert: VibrationLog | null;
  onClick?: () => void;
}

export function VibrationCard({ currentVibration, lastAlert, onClick }: VibrationCardProps) {
  const isAlert = !!currentVibration;
  const lastText = lastAlert?.timestamp || "No recent vibration alerts";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border card-hover h-[320px] flex flex-col transition-all duration-300",
        isAlert 
          ? "border-destructive/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]" 
          : "border-border",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className={cn(
        "h-1",
        isAlert 
          ? "bg-gradient-to-r from-red-500 to-orange-500" 
          : "bg-gradient-to-r from-amber-400 to-yellow-500"
      )} />

      {isAlert && (
        <div className="absolute inset-0 bg-destructive/5 animate-pulse" />
      )}

      <div className="p-6 flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isAlert ? "bg-destructive/10" : "bg-warning/10"
          )}>
            <Activity className={cn(
              "w-5 h-5",
              isAlert ? "text-destructive animate-pulse" : "text-warning"
            )} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Vibration Status</h3>
            <p className="text-xs text-muted-foreground">Dam structure stability</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex-1 flex flex-col justify-center">
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-xl border transition-colors",
            isAlert 
              ? "bg-destructive/10 border-destructive/30" 
              : "bg-success/10 border-success/30"
          )}>
            <div className="relative">
              <div className={cn(
                "w-4 h-4 rounded-full",
                isAlert ? "bg-destructive" : "bg-success"
              )} />
              {isAlert && (
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-destructive animate-pulse-ring" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isAlert ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="text-lg font-bold text-destructive">ALERT</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-lg font-bold text-success">NORMAL</span>
                </>
              )}
            </div>
          </div>

          {/* Last Alert */}
          <div className="mt-4 p-3 rounded-lg bg-secondary/30">
            <span className="text-xs text-muted-foreground">Last alert: </span>
            <span className="text-sm text-foreground">{lastText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
