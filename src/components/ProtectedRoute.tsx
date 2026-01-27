import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const AUTH_CACHE_KEY = "auth_status_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const checkingRef = useRef(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("[ProtectedRoute] Loading timeout reached, forcing state");
        setLoading(false);
      }
    }, 5000);

    const checkAuth = async () => {
      // Prevent concurrent checks
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        // Small debounce to prevent rapid fire checks
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;

        const authenticated = !!session;
        setIsAuthenticated(authenticated);
        
        // Cache auth status
        try {
          if (session) {
            sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
              userId: session.user.id,
              timestamp: Date.now()
            }));
          }
        } catch (e) {
          // Ignore cache errors
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        if (mountedRef.current) {
          setIsAuthenticated(false);
        }
      } finally {
        checkingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only recheck on significant auth events, with debounce
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Clear cache on sign out
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(AUTH_CACHE_KEY);
        }
        setTimeout(() => checkAuth(), 150);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
