import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wifi, WifiOff, Clock, Monitor, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserPresence {
  id: string;
  user_id: string;
  status: string;
  last_seen_at: string;
  current_page: string | null;
  device_info: {
    userAgent?: string;
    language?: string;
    platform?: string;
  } | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export default function UserPresencePage() {
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select(`
          *,
          profile:profiles!user_presence_user_id_fkey(full_name, email, avatar_url)
        `)
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      // Transform data to match expected structure
      const transformed = (data || []).map((item: any) => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
      }));

      setPresences(transformed);
    } catch (error) {
      console.error("Error fetching presences:", error);
      // Fetch without join if foreign key doesn't exist
      const { data } = await supabase
        .from("user_presence")
        .select("*")
        .order("last_seen_at", { ascending: false });
      
      setPresences((data || []) as UserPresence[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresences();

    // Realtime subscription
    const channel = supabase
      .channel("presence-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        () => fetchPresences()
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPresences, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const onlineCount = presences.filter(p => p.status === 'online').length;
  const awayCount = presences.filter(p => p.status === 'away').length;
  const offlineCount = presences.filter(p => p.status === 'offline').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </Badge>
        );
      case 'away':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Clock className="h-3 w-3 mr-1" />
            Ausente
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        );
    }
  };

  const getPageLabel = (page: string | null) => {
    if (!page) return "Desconhecido";
    
    const labels: Record<string, string> = {
      "/dashboard": "Vendas",
      "/dashboard/radar": "Radar de Nicho",
      "/dashboard/leads": "Leads",
      "/dashboard/automation": "Automação",
      "/dashboard/analysis": "Análise",
      "/dashboard/reports": "Relatórios",
      "/dashboard/settings": "Configurações",
      "/dashboard/profile": "Perfil",
    };
    
    return labels[page] || page;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Utilizadores Online</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Utilizadores Online</h1>
        <Badge variant="outline" className="text-sm">
          Atualiza em tempo real
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-950/30 to-green-900/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400/80">Online Agora</p>
                <p className="text-3xl font-bold text-green-400">{onlineCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-950/30 to-yellow-900/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400/80">Ausentes</p>
                <p className="text-3xl font-bold text-yellow-400">{awayCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-950/30 to-gray-900/10 border-gray-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400/80">Offline</p>
                <p className="text-3xl font-bold text-gray-400">{offlineCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                <WifiOff className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presence List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Todos os Utilizadores ({presences.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presences.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum utilizador registado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {presences.map((presence) => (
                <div
                  key={presence.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${
                      presence.status === 'online' ? 'bg-green-500 animate-pulse' :
                      presence.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    
                    <div className="flex items-center gap-3">
                      {presence.profile?.avatar_url ? (
                        <img
                          src={presence.profile.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium text-foreground">
                          {presence.profile?.full_name || "Utilizador"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {presence.profile?.email || presence.user_id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {presence.current_page && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        {getPageLabel(presence.current_page)}
                      </div>
                    )}
                    
                    {presence.device_info?.platform && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        {presence.device_info.platform}
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(presence.last_seen_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                    
                    {getStatusBadge(presence.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
