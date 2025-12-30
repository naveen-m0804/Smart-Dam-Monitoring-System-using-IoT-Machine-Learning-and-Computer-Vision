import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  gps?: { lat: number; lng: number };
  onClick?: () => void;
}

export function LocationCard({ gps, onClick }: LocationCardProps) {
  const hasGps = gps && typeof gps.lat === "number" && typeof gps.lng === "number";
  const lat = hasGps ? gps.lat : 13.0827;
  const lng = hasGps ? gps.lng : 80.2707;

  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border card-hover h-[320px] flex flex-col",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-500" />

      {/* Map */}
      <div className="relative flex-1 overflow-hidden">
        <iframe
          title="Dam Location"
          src={mapUrl}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ filter: "grayscale(30%) contrast(1.1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Dam Location</h3>
              <p className="text-xs text-muted-foreground">
                {hasGps ? "Live GPS" : "Chennai, India"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
            <Navigation className="w-3 h-3" />
            <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
