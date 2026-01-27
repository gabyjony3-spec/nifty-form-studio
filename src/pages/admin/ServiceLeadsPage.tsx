import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  MoreVertical,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  RefreshCw,
  Filter,
  Users,
  Loader2,
  Briefcase,
  GraduationCap,
  DollarSign,
  Target,
  Mail,
  Globe,
  Bell,
  Check,
  X,
  ChevronUp,
} from "lucide-react";

interface ServiceLead {
  id: string;
  nome: string | null;
  whatsapp: string | null;
  objetivo: string | null;
  investimento: string | null;
  status: string | null;
  aula_atual: number | null;
  created_at: string;
}

interface LeadServico {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  servico: string;
  status: string;
  origem: string;
  user_id: string;
  data_criacao: string;
}

const statusLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Novo: { label: "Novo", icon: <Clock className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  Contactado: { label: "Contactado", icon: <Phone className="h-3 w-3" />, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  Qualificado: { label: "Qualificado", icon: <CheckCircle className="h-3 w-3" />, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  Convertido: { label: "Convertido", icon: <CheckCircle className="h-3 w-3" />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  aprovado: { label: "Aprovado", icon: <CheckCircle className="h-3 w-3" />, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  pendente: { label: "Pendente", icon: <Clock className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

export default function ServiceLeadsPage() {
  const [leads, setLeads] = useState<ServiceLead[]>([]);
  const [leadsServicos, setLeadsServicos] = useState<LeadServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("questionario");
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const { toast } = useToast();
  const initialLoadDone = useRef(false);

  // Force clear cache on mount
  useEffect(() => {
    console.log("[CACHE] Clearing cached data on mount...");
    setLeads([]);
    setLeadsServicos([]);
    localStorage.removeItem("service_leads_cache");
    sessionStorage.removeItem("service_leads_cache");
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    // Force clear state before fetching
    setLeads([]);
    setLeadsServicos([]);
    
    try {
      const timestamp = Date.now();
      console.log(`[${timestamp}] Fetching fresh data from database...`);
      
      // Fetch service_leads (questionário) - force no cache with abortSignal
      let query1 = supabase
        .from("service_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query1 = query1.eq("status", statusFilter);
      }

      // Fetch leads_servicos (API) - force no cache
      let query2 = supabase
        .from("leads_servicos")
        .select("*")
        .order("data_criacao", { ascending: false });

      if (statusFilter !== "all") {
        query2 = query2.eq("status", statusFilter);
      }

      const [result1, result2] = await Promise.all([query1, query2]);

      if (result1.error) throw result1.error;
      if (result2.error) throw result2.error;

      console.log(`[${timestamp}] ✅ Fetched ${result1.data?.length || 0} service_leads, ${result2.data?.length || 0} leads_servicos`);

      setLeads((result1.data as ServiceLead[]) || []);
      setLeadsServicos((result2.data as LeadServico[]) || []);
      
      toast({
        title: "✅ Dados sincronizados",
        description: `${result1.data?.length || 0} leads do questionário, ${result2.data?.length || 0} leads da API`,
      });
    } catch (error: any) {
      console.error("Erro ao buscar leads:", error);
      toast({
        title: "Erro ao carregar leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  };

  const clearCacheAndRefresh = async () => {
    console.log("[CACHE] Forcing complete cache clear...");
    localStorage.clear();
    sessionStorage.clear();
    setLeads([]);
    setLeadsServicos([]);
    toast({
      title: "🧹 Cache limpo",
      description: "Buscando dados frescos do servidor...",
    });
    await fetchLeads();
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onqu4wMzO09HNxbu0pJeMgoB/gYWMlZ6os7vDys/Q0M3HvbGlm5GKhoWHjJScoaqzusPJz9HP0MzFu7ColpCKh4aIjZSeoqq0u8PJz9HP0MzHvbSpmZKMiIeIjJOcoqq0u8PJz9HP0MzHvbSpmZKMiIeIjJOcoqq0u8PJz9HP0MzHvbSpmZKMiIeIjJOcoqq0u8PJz9HP0MzHvbSpmZKMiIeIjJOcoqq0u8PJz9HP0MzHvbSpmZKMiIeIjJOcoqq0u8PJz9HPz8zHvbSpmZKMiIeIjJOcoqq0u8PI");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  useEffect(() => {
    fetchLeads();

    console.log("[REALTIME] Setting up service_leads channel...");

    // Realtime subscription for service_leads with critical INSERT notification
    const channel1 = supabase
      .channel("service_leads_realtime_v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_leads" },
        (payload) => {
          console.log("[REALTIME] INSERT detected on service_leads:", payload);
          const newLead = payload.new as ServiceLead;
          setLeads((prev) => [newLead, ...prev]);
          
          // Show CRITICAL toast notification for new lead
          if (initialLoadDone.current) {
            playNotificationSound();
            toast({
              title: "🚨 NOVO REGISTRO!",
              description: `${newLead.nome || "Um cliente"} aguarda aprovação!`,
              variant: "destructive",
              duration: 10000,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_leads" },
        (payload) => {
          console.log("[REALTIME] UPDATE detected on service_leads:", payload);
          const updatedLead = payload.new as ServiceLead;
          setLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "service_leads" },
        (payload) => {
          console.log("[REALTIME] DELETE detected on service_leads:", payload);
          const deletedId = (payload.old as any).id;
          setLeads((prev) => prev.filter((l) => l.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log("[REALTIME] service_leads channel status:", status);
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("disconnected");
        }
      });

    console.log("[REALTIME] Setting up leads_servicos channel...");

    // Realtime subscription for leads_servicos
    const channel2 = supabase
      .channel("leads_servicos_realtime_v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads_servicos" },
        (payload) => {
          console.log("[REALTIME] INSERT detected on leads_servicos:", payload);
          const newLead = payload.new as LeadServico;
          setLeadsServicos((prev) => [newLead, ...prev]);
          
          if (initialLoadDone.current) {
            playNotificationSound();
            toast({
              title: "🚨 NOVO LEAD API!",
              description: `${newLead.nome} aguarda aprovação via ${newLead.origem}!`,
              variant: "destructive",
              duration: 10000,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads_servicos" },
        (payload) => {
          console.log("[REALTIME] UPDATE detected on leads_servicos:", payload);
          const updatedLead = payload.new as LeadServico;
          setLeadsServicos((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads_servicos" },
        (payload) => {
          console.log("[REALTIME] DELETE detected on leads_servicos:", payload);
          const deletedId = (payload.old as any).id;
          setLeadsServicos((prev) => prev.filter((l) => l.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log("[REALTIME] leads_servicos channel status:", status);
      });

    return () => {
      console.log("[REALTIME] Cleaning up channels...");
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [statusFilter]);

  const updateLeadStatus = async (leadId: string, newStatus: string, table: "service_leads" | "leads_servicos") => {
    try {
      const { error } = await (supabase as any)
        .from(table)
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Lead marcado como ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAulaStatus = async (leadId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "aprovado" ? "pendente" : "aprovado";
    await updateLeadStatus(leadId, newStatus, "service_leads");
  };

  const updateAulaAtual = async (leadId: string, aula: number) => {
    try {
      const { error } = await (supabase as any)
        .from("service_leads")
        .update({ aula_atual: aula })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Aula atualizada",
        description: `Progresso atualizado para Aula ${aula}`,
      });
    } catch (error: any) {
      console.error("Erro ao atualizar aula:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const nome = lead.nome || "";
    const whatsapp = lead.whatsapp || "";
    const matchesSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whatsapp.includes(searchTerm);
    return matchesSearch;
  });

  const filteredLeadsServicos = leadsServicos.filter((lead) => {
    const matchesSearch =
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.telefone && lead.telefone.includes(searchTerm));
    return matchesSearch;
  });

  const stats = {
    totalQuestionario: leads.length,
    novosQuestionario: leads.filter((l) => l.status === "Novo").length,
    totalApi: leadsServicos.length,
    novosApi: leadsServicos.filter((l) => l.status === "Novo").length,
    qualificados: leads.filter((l) => l.status === "Qualificado").length + leadsServicos.filter((l) => l.status === "Qualificado").length,
    convertidos: leads.filter((l) => l.status === "Convertido").length + leadsServicos.filter((l) => l.status === "Convertido").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Leads de Serviços
          </h1>
          <p className="text-muted-foreground">
            Gerencie os leads do portal de vendas e da academia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Realtime Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
            realtimeStatus === "connected" 
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
              : realtimeStatus === "connecting"
              ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}>
            <Bell className={`h-4 w-4 ${realtimeStatus === "connected" ? "animate-pulse" : ""}`} />
            <span>
              {realtimeStatus === "connected" && "🟢 Tempo Real Ativo"}
              {realtimeStatus === "connecting" && "🟡 Conectando..."}
              {realtimeStatus === "disconnected" && "🔴 Desconectado"}
            </span>
          </div>
          <Button onClick={clearCacheAndRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Limpar Cache
          </Button>
          <Button onClick={fetchLeads} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards with Gradient Border */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gradient-border-card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalQuestionario + stats.totalApi}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="gradient-border-card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.novosQuestionario + stats.novosApi}</p>
              <p className="text-xs text-muted-foreground">Novos</p>
            </div>
          </div>
        </div>
        <div className="gradient-border-card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.qualificados}</p>
              <p className="text-xs text-muted-foreground">Qualificados</p>
            </div>
          </div>
        </div>
        <div className="gradient-border-card-hover p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.convertidos}</p>
              <p className="text-xs text-muted-foreground">Convertidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="gradient-border-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="questionario" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Questionário ({filteredLeads.length})
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Globe className="h-4 w-4" />
            Academia API ({filteredLeadsServicos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Questionário */}
        <TabsContent value="questionario">
          <div className="gradient-border-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum lead do questionário encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Investimento</TableHead>
                    <TableHead>Aula Atual</TableHead>
                    <TableHead>Status Aula</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{lead.nome || "-"}</div>
                      </TableCell>
                      <TableCell>
                        {lead.whatsapp ? (
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {lead.whatsapp}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          {lead.objetivo || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {lead.investimento || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <span className="font-medium">Aula {lead.aula_atual || 1}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-primary/20"
                            onClick={() => updateAulaAtual(lead.id, (lead.aula_atual || 1) + 1)}
                            title="Avançar aula"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={lead.status === "aprovado" ? "default" : "outline"}
                            className={`h-7 gap-1 ${
                              lead.status === "aprovado" 
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                            onClick={() => {
                              if (lead.status !== "aprovado") {
                                toggleAulaStatus(lead.id, lead.status);
                              }
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant={lead.status !== "aprovado" ? "default" : "outline"}
                            className={`h-7 gap-1 ${
                              lead.status !== "aprovado" 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "border-red-500/50 text-red-400 hover:bg-red-500/20"
                            }`}
                            onClick={() => {
                              if (lead.status === "aprovado") {
                                toggleAulaStatus(lead.id, lead.status);
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                            Negar
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.status && statusLabels[lead.status] ? (
                          <Badge
                            variant="outline"
                            className={`${statusLabels[lead.status].color} gap-1`}
                          >
                            {statusLabels[lead.status].icon}
                            {statusLabels[lead.status].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
                            <Clock className="h-3 w-3" />
                            {lead.status || "Novo"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {format(new Date(lead.created_at), "HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lead.whatsapp && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${lead.whatsapp!.replace(/\D/g, "")}`,
                                    "_blank"
                                  )
                                }
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Abrir WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Contactado", "service_leads")}>
                              <Phone className="h-4 w-4 mr-2" />
                              Marcar Contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Qualificado", "service_leads")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar Qualificado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Convertido", "service_leads")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                              Marcar Convertido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateAulaAtual(lead.id, (lead.aula_atual || 1) + 1)}>
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Avançar Aula
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab: Academia API */}
        <TabsContent value="api">
          <div className="gradient-border-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLeadsServicos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum lead da API encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeadsServicos.map((lead) => (
                    <TableRow key={lead.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{lead.nome}</div>
                        <div className="text-xs text-muted-foreground">ID: {lead.user_id}</div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {lead.telefone ? (
                          <a
                            href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {lead.telefone}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          {lead.servico}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {lead.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {statusLabels[lead.status] ? (
                          <Badge
                            variant="outline"
                            className={`${statusLabels[lead.status].color} gap-1`}
                          >
                            {statusLabels[lead.status].icon}
                            {statusLabels[lead.status].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
                            <Clock className="h-3 w-3" />
                            {lead.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(lead.data_criacao), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {format(new Date(lead.data_criacao), "HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lead.telefone && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${lead.telefone!.replace(/\D/g, "")}`,
                                    "_blank"
                                  )
                                }
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Abrir WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${lead.email}`, "_blank")}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Contactado", "leads_servicos")}>
                              <Phone className="h-4 w-4 mr-2" />
                              Marcar Contactado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Qualificado", "leads_servicos")}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar Qualificado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "Convertido", "leads_servicos")}>
                              <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                              Marcar Convertido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
