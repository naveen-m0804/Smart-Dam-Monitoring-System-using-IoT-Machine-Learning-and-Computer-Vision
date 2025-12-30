import { useEffect, useState } from "react";
import { DamLayout } from "@/components/dam/DamLayout";
import { getReadings, getVibrationLogs, getWaterLevelLogs, type Reading, type VibrationLog, type WaterLevelLog } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Droplets, Thermometer, Activity, CloudRain, BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LogsPageProps {
  type: "water-level" | "vibration" | "env" | "rainfall" | "all";
}

export default function LogsPage({ type }: LogsPageProps) {
  const [rows, setRows] = useState<(Reading | VibrationLog | WaterLevelLog)[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const config = {
    "water-level": { title: "Water Level Log", icon: Droplets, color: "text-primary" },
    "vibration": { title: "Vibration Log", icon: Activity, color: "text-warning" },
    "env": { title: "Temperature & Humidity Log", icon: Thermometer, color: "text-success" },
    "rainfall": { title: "Rainfall Log", icon: CloudRain, color: "text-primary" },
    "all": { title: "All Readings", icon: BarChart3, color: "text-muted-foreground" },
  };

  const currentConfig = config[type];

  const load = async () => {
    try {
      setLoading(true);
      let data: (Reading | VibrationLog | WaterLevelLog)[] = [];

      if (type === "water-level") {
        data = await getWaterLevelLogs();
      } else if (type === "vibration") {
        data = await getVibrationLogs();
      } else {
        data = await getReadings();
      }

      setRows(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type]);

  const renderHeader = () => {
    switch (type) {
      case "water-level":
        return (
          <TableRow>
            <TableHead className="text-foreground">Timestamp</TableHead>
            <TableHead className="text-foreground">Distance (cm)</TableHead>
            <TableHead className="text-foreground">Water Level (%)</TableHead>
            <TableHead className="text-foreground">Node</TableHead>
          </TableRow>
        );
      case "vibration":
        return (
          <TableRow>
            <TableHead className="text-foreground">Timestamp</TableHead>
            <TableHead className="text-foreground">Level</TableHead>
            <TableHead className="text-foreground">Node</TableHead>
          </TableRow>
        );
      case "rainfall":
        return (
          <TableRow>
            <TableHead className="text-foreground">Timestamp</TableHead>
            <TableHead className="text-foreground">Temp (°C)</TableHead>
            <TableHead className="text-foreground">Humidity (%)</TableHead>
            <TableHead className="text-foreground">Rainfall (%)</TableHead>
          </TableRow>
        );
      default:
        return (
          <TableRow>
            <TableHead className="text-foreground">Timestamp</TableHead>
            <TableHead className="text-foreground">Temp (°C)</TableHead>
            <TableHead className="text-foreground">Humidity (%)</TableHead>
          </TableRow>
        );
    }
  };

  const renderRow = (row: Reading | VibrationLog | WaterLevelLog, idx: number) => {
    const reading = row as Reading;
    const vibLog = row as VibrationLog;
    const waterLog = row as WaterLevelLog;

    switch (type) {
      case "water-level":
        return (
          <TableRow key={idx} className="border-border hover:bg-secondary/50">
            <TableCell className="text-muted-foreground">{waterLog.timestamp || "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{waterLog.distanceCm ?? waterLog.distance ?? "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{waterLog.percent ?? waterLog.waterLevel ?? "NA"}</TableCell>
            <TableCell className="text-muted-foreground">{waterLog.nodeId || "NA"}</TableCell>
          </TableRow>
        );
      case "vibration":
        return (
          <TableRow key={idx} className="border-border hover:bg-secondary/50">
            <TableCell className="text-muted-foreground">{vibLog.timestamp || "NA"}</TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-sm">
                {vibLog.level || "NA"}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{vibLog.nodeId || "NA"}</TableCell>
          </TableRow>
        );
      case "rainfall":
        const rainValue = reading.rainPredPercent ?? reading.rain_prediction ?? reading.rainfall ?? reading.rainPercent ?? reading.rain ?? "NA";
        return (
          <TableRow key={idx} className="border-border hover:bg-secondary/50">
            <TableCell className="text-muted-foreground">{reading.timestamp || "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{reading.temp ?? "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{reading.humidity ?? "NA"}</TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                {typeof rainValue === "number" ? rainValue.toFixed(1) : rainValue}%
              </span>
            </TableCell>
          </TableRow>
        );
      default:
        return (
          <TableRow key={idx} className="border-border hover:bg-secondary/50">
            <TableCell className="text-muted-foreground">{reading.timestamp || "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{reading.temp ?? "NA"}</TableCell>
            <TableCell className="font-medium text-foreground">{reading.humidity ?? "NA"}</TableCell>
          </TableRow>
        );
    }
  };

  const IconComponent = currentConfig.icon;

  return (
    <DamLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center ${currentConfig.color}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentConfig.title}</h1>
              <p className="text-sm text-muted-foreground">{rows.length} records</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground">Loading logs...</p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <IconComponent className="w-12 h-12 mb-4 opacity-50" />
            <p>No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/50">
                {renderHeader()}
              </TableHeader>
              <TableBody>
                {rows.map(renderRow)}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DamLayout>
  );
}
