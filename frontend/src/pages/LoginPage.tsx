import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves, Lock, User, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(username.trim(), password);
    
    setLoading(false);
    
    if (!res.success) {
      setError(res.message || "Login failed");
      return;
    }

    navigate(from);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-water-deep to-background">
        {/* Animated water effect */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/30 to-transparent animate-water-flow" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-water-secondary/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-water-secondary flex items-center justify-center shadow-glow">
              <Waves className="w-9 h-9 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Smart Dam</h1>
              <p className="text-muted-foreground">Automation System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-foreground mb-4">
            Intelligent Water<br />Management
          </h2>
          <p className="text-lg text-muted-foreground max-w-md">
            Real-time monitoring, automated valve control, and predictive analytics 
            for modern dam infrastructure.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { label: "Water Level", value: "Monitoring" },
              { label: "Rainfall", value: "Prediction" },
              { label: "Vibration", value: "Detection" },
              { label: "Valve", value: "Control" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <p className="text-2xl font-bold text-primary">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-water-secondary flex items-center justify-center shadow-glow">
              <Waves className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Smart Dam</h1>
              <p className="text-xs text-muted-foreground">Automation System</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Admin Login</h2>
              <p className="text-muted-foreground mt-2">
                Enter your credentials to access admin features
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-10 h-12 bg-secondary border-border"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-secondary border-border"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-water-secondary hover:opacity-90 transition-opacity gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : (
                  <>
                    Login
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Demo credentials: <code className="px-2 py-0.5 rounded bg-secondary text-foreground">admin / admin123</code>
                </p>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <button 
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              ← Back to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
