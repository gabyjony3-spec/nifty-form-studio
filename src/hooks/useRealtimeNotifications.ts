import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScoreImprovement {
  previousScore: number;
  newScore: number;
  improvements: string[];
}

export const useRealtimeNotifications = (userId: string | null) => {
  const { toast } = useToast();
  const previousScoresRef = useRef<Map<string, number>>(new Map());

  const handleNewLead = useCallback((payload: any) => {
    const lead = payload.new;
    toast({
      title: "🎯 Novo Lead Capturado!",
      description: `${lead.full_name} acabou de ser adicionado como lead.`,
      duration: 5000,
    });
  }, [toast]);

  const handleAutomationLog = useCallback((payload: any) => {
    const log = payload.new;
    const isSuccess = log.status === "sent" || log.status === "success";
    
    toast({
      title: isSuccess ? "✅ Automação Executada!" : "⚠️ Automação com Erro",
      description: `${log.type}: ${log.content?.substring(0, 50) || log.template_name || "Ação executada"}...`,
      variant: isSuccess ? "default" : "destructive",
      duration: 5000,
    });
  }, [toast]);

  // Handler for message status updates (delivered, read)
  const handleStatusUpdate = useCallback((payload: any) => {
    const log = payload.new;
    const oldStatus = payload.old?.status;
    
    // Only notify on status changes to delivered or read
    if (log.status === 'delivered' && oldStatus !== 'delivered') {
      toast({
        title: "📬 Mensagem Entregue",
        description: `Mensagem para ${log.recipient_phone || 'destinatário'} foi entregue com sucesso.`,
        duration: 4000,
      });
    }
    
    if (log.status === 'read' && oldStatus !== 'read') {
      toast({
        title: "👁️ Mensagem Lida",
        description: `Mensagem para ${log.recipient_phone || 'destinatário'} foi lida!`,
        duration: 4000,
      });
    }
  }, [toast]);

  // Handler for profile score improvements
  const handleScoreImprovement = useCallback((payload: any) => {
    const analysis = payload.new;
    const oldAnalysis = payload.old;
    
    if (!analysis?.score || !oldAnalysis?.score) return;
    
    const previousScore = oldAnalysis.score;
    const newScore = analysis.score;
    
    // Only notify if score improved
    if (newScore > previousScore) {
      const improvement = newScore - previousScore;
      const username = analysis.target_url?.split('/').pop() || 'seu perfil';
      
      // Determine improvement message based on change amount
      let celebrationEmoji = "📈";
      let title = "Score Melhorou!";
      
      if (improvement >= 15) {
        celebrationEmoji = "🚀";
        title = "Evolução Incrível!";
      } else if (improvement >= 10) {
        celebrationEmoji = "🎉";
        title = "Ótima Melhoria!";
      } else if (improvement >= 5) {
        celebrationEmoji = "⬆️";
        title = "Score Subiu!";
      }
      
      toast({
        title: `${celebrationEmoji} ${title}`,
        description: `O perfil ${username} subiu de ${previousScore} para ${newScore} pontos (+${improvement})`,
        duration: 8000,
      });
      
      // Store for potential future comparisons
      previousScoresRef.current.set(analysis.id, newScore);
    }
  }, [toast]);

  // Handler for new analysis completion
  const handleNewAnalysis = useCallback((payload: any) => {
    const analysis = payload.new;
    
    if (!analysis?.score) return;
    
    const username = analysis.target_url?.split('/').pop() || 'perfil';
    const score = analysis.score;
    
    let verdict = "Regular";
    let emoji = "📊";
    
    if (score >= 80) {
      verdict = "Excelente";
      emoji = "🌟";
    } else if (score >= 65) {
      verdict = "Bom";
      emoji = "✨";
    } else if (score < 50) {
      verdict = "Precisa Melhorar";
      emoji = "⚠️";
    }
    
    toast({
      title: `${emoji} Análise Concluída!`,
      description: `${username}: ${score}/100 - ${verdict}`,
      duration: 6000,
    });
  }, [toast]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new leads
    const leadsChannel = supabase
      .channel('realtime-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${userId}`,
        },
        handleNewLead
      )
      .subscribe();

    // Subscribe to automation logs (new messages)
    const automationChannel = supabase
      .channel('realtime-automation-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_logs',
          filter: `user_id=eq.${userId}`,
        },
        handleAutomationLog
      )
      .subscribe();

    // Subscribe to message status updates (delivered/read)
    const statusChannel = supabase
      .channel('realtime-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_logs',
          filter: `user_id=eq.${userId}`,
        },
        handleStatusUpdate
      )
      .subscribe();

    // Subscribe to profile score updates (improvements)
    const scoreChannel = supabase
      .channel('realtime-score-improvements')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'history_analysis',
          filter: `user_id=eq.${userId}`,
        },
        handleScoreImprovement
      )
      .subscribe();

    // Subscribe to new analysis completions
    const newAnalysisChannel = supabase
      .channel('realtime-new-analysis')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'history_analysis',
          filter: `user_id=eq.${userId}`,
        },
        handleNewAnalysis
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(automationChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(scoreChannel);
      supabase.removeChannel(newAnalysisChannel);
    };
  }, [userId, handleNewLead, handleAutomationLog, handleStatusUpdate, handleScoreImprovement, handleNewAnalysis]);
};

export default useRealtimeNotifications;
