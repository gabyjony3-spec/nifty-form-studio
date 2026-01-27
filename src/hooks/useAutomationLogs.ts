import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  automation_id: string | null;
  type: string;
  status: string;
  content: string | null;
  error_message: string | null;
  external_message_id: string | null;
  recipient_phone: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  lead?: {
    full_name: string;
    email: string;
  } | null;
  automation?: {
    name: string;
    type: string;
  } | null;
}

export interface LogStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export function useAutomationLogs(automationId?: string) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('automation_logs')
        .select(`
          *,
          automation:automations(name, type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (automationId) {
        query = query.eq('automation_id', automationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const logsData = (data || []) as AutomationLog[];
      setLogs(logsData);

      // Calculate stats
      const newStats: LogStats = {
        total: logsData.length,
        pending: logsData.filter(l => l.status === 'pending').length,
        sent: logsData.filter(l => l.status === 'sent').length,
        delivered: logsData.filter(l => l.status === 'delivered').length,
        read: logsData.filter(l => l.status === 'read').length,
        failed: logsData.filter(l => l.status === 'failed').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching automation logs:', error);
    } finally {
      setLoading(false);
    }
  }, [automationId]);

  useEffect(() => {
    fetchLogs();

    // Set up realtime subscription
    const channel = supabase
      .channel('automation_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_logs',
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  return { logs, stats, loading, refetch: fetchLogs };
}
