import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Droplets, 
  Thermometer, 
  Activity, 
  CloudRain, 
  BarChart3,
  Waves,
  LogOut,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", adminOnly: false },
  { to: "/logs/water-level", icon: Droplets, label: "Water Level Log", adminOnly: true },
  { to: "/logs/env", icon: Thermometer, label: "Temp & Humidity", adminOnly: true },
  { to: "/logs/vibration", icon: Activity, label: "Vibration Log", adminOnly: true },
  { to: "/logs/rainfall", icon: CloudRain, label: "Rainfall Log", adminOnly: true },
  { to: "/logs/all", icon: BarChart3, label: "All Readings", adminOnly: true },
];

export function DamSidebar() {
  const location = useLocation();
  const { isAdmin, logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-water-secondary flex items-center justify-center shadow-glow">
            <Waves className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-sidebar animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground gradient-text">Smart Dam</h1>
          <p className="text-xs text-muted-foreground">Automation System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                isActive && "text-primary"
              )} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
            isAdmin 
              ? "bg-gradient-to-br from-primary to-water-secondary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}>
            {isAdmin ? <Shield className="w-5 h-5" /> : "G"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">
              {isAdmin ? "Admin" : "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Full Access" : "View Only"}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
