import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const AWAY_TIMEOUT = 300000; // 5 minutes

export function usePresence() {
  const location = useLocation();
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePresence = useCallback(async (status: 'online' | 'away' | 'offline') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('update_user_presence', {
        _status: status,
        _current_page: location.pathname,
        _device_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        }
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [location.pathname]);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear away timeout
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }
    
    // Set new away timeout
    awayTimeoutRef.current = setTimeout(() => {
      updatePresence('away');
    }, AWAY_TIMEOUT);
    
    // Update to online if we were away
    updatePresence('online');
  }, [updatePresence]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      updatePresence('away');
    } else {
      handleActivity();
    }
  }, [handleActivity, updatePresence]);

  const handleBeforeUnload = useCallback(() => {
    // Use sendBeacon for reliable offline update
    const user = supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_user_presence`,
          JSON.stringify({
            _status: 'offline',
            _current_page: location.pathname
          })
        );
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    // Initial presence update
    updatePresence('online');

    // Start heartbeat
    heartbeatRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const status = timeSinceLastActivity > AWAY_TIMEOUT ? 'away' : 'online';
      updatePresence(status);
    }, HEARTBEAT_INTERVAL);

    // Activity listeners
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Before unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Cleanup
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Mark offline on unmount
      updatePresence('offline');
    };
  }, [updatePresence, handleActivity, handleVisibilityChange, handleBeforeUnload]);

  // Update presence when page changes
  useEffect(() => {
    updatePresence('online');
  }, [location.pathname, updatePresence]);

  return null;
}
