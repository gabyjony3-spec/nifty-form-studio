import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminAlert {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: any;
  read: boolean;
  created_at: string;
}

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Real-time subscription
    const channel = supabase
      .channel("admin_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_alerts" },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Erro ao carregar alertas");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;
      setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (error) {
      toast.error("Erro ao marcar como lido");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .update({ read: true })
        .eq("read", false);

      if (error) throw error;
      setAlerts(alerts.map(a => ({ ...a, read: true })));
      toast.success("Todos os alertas marcados como lidos");
    } catch (error) {
      toast.error("Erro ao marcar alertas");
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("admin_alerts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setAlerts(alerts.filter(a => a.id !== id));
      toast.success("Alerta removido");
    } catch (error) {
      toast.error("Erro ao remover alerta");
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rescue_plan":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Aviso</Badge>;
      case "success":
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case "new_subscription":
        return <Badge className="bg-primary">Nova Assinatura</Badge>;
      case "new_lead":
        return <Badge className="bg-blue-500">Novo Lead</Badge>;
      case "rescue_plan":
        return <Badge className="bg-red-500">Plano de Resgate</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Alertas do Sistema</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} alerta${unreadCount > 1 ? 's' : ''} não lido${unreadCount > 1 ? 's' : ''}`
                : "Todos os alertas lidos"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todos como lidos
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum alerta no momento</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      alert.read 
                        ? "bg-muted/30 border-border" 
                        : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getAlertBadge(alert.type)}
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(alert.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold">{alert.title}</h4>
                        {alert.message && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {!alert.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAlertsPage;
