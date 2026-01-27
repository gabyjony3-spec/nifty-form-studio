import { useState, useEffect } from "react";
import { Bell, AlertTriangle, UserCheck, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdminAlert {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
  data: any;
}

export function AdminNotificationBell() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    
    // Subscribe to realtime admin alerts
    const channel = supabase
      .channel("admin-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_alerts",
        },
        (payload) => {
          const newAlert = payload.new as AdminAlert;
          setAlerts((prev) => [newAlert, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show toast for new alert based on type
          const isHighPriority = newAlert.type === "error" || newAlert.type === "intervention";
          toast({
            title: newAlert.title,
            description: newAlert.message || undefined,
            variant: isHighPriority ? "destructive" : "default",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from("admin_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error loading admin alerts:", error);
      return;
    }

    setAlerts(data || []);
    setUnreadCount(data?.filter((a) => !a.read).length || 0);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_alerts")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("admin_alerts")
      .update({ read: true })
      .eq("read", false);

    if (!error) {
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error":
      case "intervention":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "new_lead":
        return <UserCheck className="h-4 w-4 text-green-400" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "conversion":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-red-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "error":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Erro</Badge>;
      case "intervention":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">Urgente</Badge>;
      case "new_lead":
        return <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0">Lead</Badge>;
      case "message":
        return <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0">Msg</Badge>;
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-red-400 hover:text-red-300 hover:bg-red-950/50"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-gray-900 border-red-900/50"
      >
        <DropdownMenuLabel className="flex items-center justify-between text-red-300">
          <span>Alertas do Sistema</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-red-400 hover:text-red-300"
              onClick={markAllAsRead}
            >
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-red-900/30" />
        <ScrollArea className="h-[350px]">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-red-300/50 text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Sem alertas
            </div>
          ) : (
            alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-red-900/20",
                  !alert.read && "bg-red-950/30",
                  alert.type === "error" || alert.type === "intervention" 
                    ? "border-l-2 border-l-red-500" 
                    : ""
                )}
                onClick={() => markAsRead(alert.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {getTypeIcon(alert.type)}
                  <span className="font-medium text-sm flex-1 text-red-100">
                    {alert.title}
                  </span>
                  {getTypeBadge(alert.type)}
                  {!alert.read && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                {alert.message && (
                  <p className="text-xs text-red-300/70 pl-6 line-clamp-2">
                    {alert.message}
                  </p>
                )}
                <span className="text-xs text-red-400/50 pl-6">
                  {formatDistanceToNow(new Date(alert.created_at), {
                    addSuffix: true,
                    locale: pt,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
