import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const ADMIN_CACHE_KEY = "admin_status_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const checkingRef = useRef(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCachedAdminStatus = useCallback((userId: string) => {
    try {
      const cached = sessionStorage.getItem(ADMIN_CACHE_KEY);
      if (cached) {
        const { userId: cachedUserId, isAdmin, timestamp } = JSON.parse(cached);
        if (cachedUserId === userId && Date.now() - timestamp < CACHE_DURATION) {
          return isAdmin;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }, []);

  const setCachedAdminStatus = useCallback((userId: string, isAdmin: boolean) => {
    try {
      sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
        userId,
        isAdmin,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore cache errors
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("[AdminRoute] Loading timeout reached, forcing state");
        setLoading(false);
      }
    }, 5000);

    const checkAdmin = async () => {
      // Prevent concurrent checks
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        // Small debounce to prevent rapid fire checks
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mountedRef.current) return;

        if (!session) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check cache first
        const cachedStatus = getCachedAdminStatus(session.user.id);
        if (cachedStatus !== null) {
          setIsAdmin(cachedStatus);
          setLoading(false);
          checkingRef.current = false;
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!mountedRef.current) return;

        const adminStatus = !!roles;
        setIsAdmin(adminStatus);
        setCachedAdminStatus(session.user.id, adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        if (mountedRef.current) {
          setIsAdmin(false);
        }
      } finally {
        checkingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only recheck on significant auth events, with debounce
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        // Clear cache on sign out
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(ADMIN_CACHE_KEY);
        }
        setTimeout(() => checkAdmin(), 150);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [getCachedAdminStatus, setCachedAdminStatus]);

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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
