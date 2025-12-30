import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-water-secondary flex items-center justify-center mx-auto mb-8 shadow-glow">
          <Waves className="w-10 h-10 text-primary-foreground" />
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Back to Dashboard */}
        <Link to="/">
          <Button className="gap-2 bg-gradient-to-r from-primary to-water-secondary hover:opacity-90">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
