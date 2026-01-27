import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserCompany } from "@/hooks/useUserCompany";
import { useSubscription } from "@/hooks/useSubscription";

interface WhatsAppCreditsCardProps {
  compact?: boolean;
}

export function WhatsAppCreditsCard({ compact = false }: WhatsAppCreditsCardProps) {
  const [messagesSent, setMessagesSent] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { activeCompany, loading: companyLoading } = useUserCompany();
  const { isLifetime, isElite } = useSubscription();

  const loadMessagesCount = useCallback(async () => {
    if (!activeCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      // Count messages sent from automation_logs by company_id
      const { count: sentCount } = await supabase
        .from("automation_logs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", activeCompany.id)
        .eq("type", "whatsapp")
        .in("status", ["sent", "delivered", "read"]);

      setMessagesSent(sentCount || 0);
    } catch (error) {
      console.error("Error loading messages count:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    if (!companyLoading && activeCompany?.id) {
      loadMessagesCount();
    } else if (!companyLoading && !activeCompany) {
      setLoading(false);
    }
  }, [activeCompany?.id, companyLoading, loadMessagesCount]);

  // Realtime subscription for automation_logs by company
  useEffect(() => {
    if (!activeCompany?.id) return;

    console.log('[WhatsAppCreditsCard] Setting up Realtime subscription for company:', activeCompany.id);

    const channel = supabase
      .channel('whatsapp-credits-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_logs',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log('[WhatsAppCreditsCard] Realtime INSERT received:', payload);
          const newLog = payload.new as { type: string; status: string };
          
          if (newLog.type === 'whatsapp' && ['sent', 'delivered', 'read'].includes(newLog.status || '')) {
            setMessagesSent(prev => prev + 1);
            console.log('[WhatsAppCreditsCard] Incremented messagesSent');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_logs',
          filter: `company_id=eq.${activeCompany.id}`
        },
        (payload) => {
          console.log('[WhatsAppCreditsCard] Realtime UPDATE received:', payload);
          const oldStatus = (payload.old as { status?: string })?.status;
          const newStatus = (payload.new as { status: string }).status;
          const newType = (payload.new as { type: string }).type;
          
          // If status changed from pending to sent/delivered/read, increment counter
          if (newType === 'whatsapp' && 
              oldStatus === 'pending' && 
              ['sent', 'delivered', 'read'].includes(newStatus)) {
            setMessagesSent(prev => prev + 1);
            console.log('[WhatsAppCreditsCard] Status changed to sent, incremented messagesSent');
          }
        }
      )
      .subscribe((status) => {
        console.log('[WhatsAppCreditsCard] Realtime subscription status:', status);
      });

    return () => {
      console.log('[WhatsAppCreditsCard] Removing Realtime channel');
      supabase.removeChannel(channel);
    };
  }, [activeCompany?.id]);

  // Use isLifetime or isElite from hook instead of local state
  const hasLifetimeAccess = isLifetime || isElite;
  
  // Calculate based on company data - override for lifetime users
  const creditsRemaining = activeCompany?.whatsapp_credits || 0;
  const planName = hasLifetimeAccess ? 'Vitalício' :
                   activeCompany?.plan === 'pro' ? 'Pro' : 
                   activeCompany?.plan === 'business' ? 'Business' : 
                   activeCompany?.plan === 'trial' ? 'Trial' : 'Básico';
  const maxCredits = hasLifetimeAccess || activeCompany?.plan === 'business' ? 999999 : 
                     activeCompany?.plan === 'pro' ? 200 : 
                     activeCompany?.plan === 'trial' ? 10 : 50;
  
  const usagePercentage = maxCredits === 999999 ? 0 : Math.min((messagesSent / maxCredits) * 100, 100);
  const isUnlimited = maxCredits === 999999 || hasLifetimeAccess;
  const isLow = !isUnlimited && creditsRemaining < maxCredits * 0.2;

  if (loading || companyLoading) {
    return (
      <Card className={`bg-card border-border ${compact ? '' : 'panel-shadow'}`}>
        <CardContent className="p-4">
          <div className="animate-pulse h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!activeCompany) {
    return (
      <Card className={`bg-card border-border ${compact ? '' : 'panel-shadow'}`}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Empresa não configurada
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <MessageSquare className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">WhatsApp</span>
            <span className={`text-sm font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>
              {isUnlimited ? "∞" : `${messagesSent}/${creditsRemaining}`}
            </span>
          </div>
          {!isUnlimited && (
            <Progress value={usagePercentage} className="h-1 mt-1" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border panel-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Mensagens WhatsApp
        </CardTitle>
        <Zap className={`h-4 w-4 ${isLow ? 'text-destructive' : 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
            {isUnlimited ? "∞" : messagesSent}
          </span>
          {!isUnlimited && (
            <span className="text-sm text-muted-foreground">enviadas</span>
          )}
        </div>
        
        {!isUnlimited && (
          <>
            <Progress 
              value={usagePercentage} 
              className={`h-2 mb-3 ${usagePercentage > 80 ? '[&>div]:bg-destructive' : ''}`} 
            />
            <p className="text-xs text-muted-foreground mb-2">
              {creditsRemaining} crédito{creditsRemaining !== 1 ? 's' : ''} disponíve{creditsRemaining !== 1 ? 'is' : 'l'}
            </p>
          </>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {activeCompany.name} • Plano {planName}
          </span>
          {isLow && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => navigate("/dashboard/pricing")}
            >
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
        
        {isUnlimited && (
          <p className="text-xs text-green-500 mt-2">
            ✨ Mensagens ilimitadas incluídas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
