import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Instagram, Mail, MessageSquare, Pencil, Trash2, Power, Megaphone, Eye, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AutomationDialog } from "@/components/automation/AutomationDialog";
import { WhatsAppConfigModal } from "@/components/automation/WhatsAppConfigModal";
import MetaAdsConfigModal from "@/components/automation/MetaAdsConfigModal";
import { ActivityHistoryModal } from "@/components/automation/ActivityHistoryModal";
import { useAutomationLogs } from "@/hooks/useAutomationLogs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Automation {
  id: string;
  type: string;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  action_type: string;
  action_value: string | null;
  is_active: boolean;
  messages_sent: number;
  response_rate: number;
  conversions: number;
}

const AutomationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(null);
  const [whatsappConfigOpen, setWhatsappConfigOpen] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [metaAdsModalOpen, setMetaAdsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false);
  
  // Get automation logs for stats
  const { stats: logStats } = useAutomationLogs();
  useEffect(() => {
    fetchAutomations();
    fetchAdCampaigns();
    setupRealtimeSubscription();
    
    // Check for new campaign from navigation state
    if (location.state?.newCampaign && location.state?.openModal) {
      setSelectedCampaign(location.state.newCampaign);
      setMetaAdsModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchAutomations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAutomations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAdCampaigns(data || []);
    } catch (error: any) {
      console.error("Error fetching ad campaigns:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("automations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automations",
        },
        () => {
          fetchAutomations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleAutomation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("automations")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Automação ${!currentStatus ? "ativada" : "desativada"}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!automationToDelete) return;

    try {
      const { error } = await supabase
        .from("automations")
        .delete()
        .eq("id", automationToDelete);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Automação excluída",
      });
      setDeleteDialogOpen(false);
      setAutomationToDelete(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case "instagram_dm":
        return <Instagram className="h-5 w-5 text-primary" />;
      case "whatsapp":
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case "email":
        return <Mail className="h-5 w-5 text-primary" />;
      default:
        return <Zap className="h-5 w-5 text-primary" />;
    }
  };

  const getAutomationTypeName = (type: string) => {
    switch (type) {
      case "instagram_dm":
        return "Instagram DM";
      case "whatsapp":
        return "WhatsApp";
      case "email":
        return "Email Marketing";
      case "meta_ads":
        return "Meta Ads Campaign";
      default:
        return type;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativa</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em Análise</Badge>;
      case "paused":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pausada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando automações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Automações</h1>
          {/* Log stats badges */}
          {logStats.total > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                {logStats.read} lidos
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {logStats.pending} pendentes
              </Badge>
              {logStats.failed > 0 && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                  {logStats.failed} falhou
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Activity History Button */}
          <Button
            variant="outline"
            onClick={() => setActivityHistoryOpen(true)}
            className="relative"
          >
            <History className="mr-2 h-4 w-4" />
            Histórico
            {logStats.total > 0 && (
              <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground">
                {logStats.total}
              </Badge>
            )}
          </Button>
          
          {/* WhatsApp Config Button */}
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/integrations")}
            className="relative"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Configurar WhatsApp
            {/* Pulsing green indicator when configured */}
            {whatsappConfigured && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </Button>
          
          <Button
            onClick={() => {
              setSelectedAutomation(null);
              setDialogOpen(true);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-neon"
          >
            <Zap className="mr-2 h-4 w-4" />
            Nova Automação
          </Button>
        </div>
      </div>

      {automations.length === 0 ? (
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma automação criada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie sua primeira automação para começar a otimizar seus processos
            </p>
            <Button
              onClick={() => {
                setSelectedAutomation(null);
                setDialogOpen(true);
              }}
              className="glow-neon"
            >
              <Zap className="mr-2 h-4 w-4" />
              Criar Primeira Automação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Meta Ads Campaigns Section */}
          {adCampaigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Campanhas Meta Ads
                <Badge variant="outline" className="text-primary border-primary ml-2">Beta</Badge>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {adCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-card border-border panel-shadow hover:glow-soft transition-smooth">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-5 w-5 text-primary" />
                          <CardTitle className="text-foreground text-lg">Meta Ads</CardTitle>
                        </div>
                        {getCampaignStatusBadge(campaign.status)}
                      </div>
                      <CardDescription className="text-muted-foreground line-clamp-1">
                        {campaign.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground truncate">
                          {campaign.website_url}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Orçamento</div>
                            <div className="font-semibold text-foreground">€{campaign.daily_budget}/dia</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Objetivo</div>
                            <div className="font-semibold text-foreground">{campaign.objective}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setMetaAdsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Regular Automations */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => (
              <Card
                key={automation.id}
                className="bg-card border-border panel-shadow hover:glow-soft transition-smooth relative overflow-visible"
              >
                {automation.is_active && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="absolute inline-flex h-5 w-5 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAutomationIcon(automation.type)}
                      <CardTitle className="text-foreground text-lg">
                        {getAutomationTypeName(automation.type)}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        automation.is_active
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {automation.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {automation.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Enviadas</div>
                        <div className="font-semibold text-foreground">{automation.messages_sent || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa</div>
                        <div className="font-semibold text-foreground">{automation.response_rate || 0}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Conversões</div>
                        <div className="font-semibold text-foreground">{automation.conversions || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => toggleAutomation(automation.id, automation.is_active)} className="flex-1">
                        <Power className="h-4 w-4 mr-1" />
                        {automation.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedAutomation(automation); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAutomationToDelete(automation.id); setDeleteDialogOpen(true); }} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AutomationDialog open={dialogOpen} onOpenChange={setDialogOpen} automation={selectedAutomation} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WhatsAppConfigModal open={whatsappConfigOpen} onOpenChange={setWhatsappConfigOpen} />
      
      <MetaAdsConfigModal 
        open={metaAdsModalOpen} 
        onOpenChange={setMetaAdsModalOpen} 
        campaign={selectedCampaign}
        onSuccess={() => fetchAdCampaigns()}
      />
      
      <ActivityHistoryModal 
        open={activityHistoryOpen} 
        onOpenChange={setActivityHistoryOpen} 
      />
    </div>
  );
};

export default AutomationPage;
