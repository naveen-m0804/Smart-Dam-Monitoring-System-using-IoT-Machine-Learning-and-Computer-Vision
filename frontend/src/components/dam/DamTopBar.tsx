import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

export function DamTopBar() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (isAdmin) {
      logout();
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="h-full px-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Smart Dam Automation System
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring and control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={isAdmin ? "outline" : "default"}
            size="sm"
            onClick={handleAuthClick}
            className="gap-2"
          >
            {isAdmin ? (
              <>
                <LogOut className="w-4 h-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Admin Login
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
