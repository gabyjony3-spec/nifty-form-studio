import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Phone, Building, Calendar, Globe, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  company_name: string | null;
  business_area: string | null;
  source: string | null;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  type: "lead" | "analysis";
  website_url?: string;
  overall_score?: number | null;
}

const AdminLeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetchAllLeads();

    // Realtime for both tables
    const leadsChannel = supabase
      .channel("admin-leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        console.log("Lead atualizado em tempo real");
        fetchAllLeads();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leads_analysis" }, () => {
        console.log("Lead analysis atualizado em tempo real");
        fetchAllLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, []);

  const fetchAllLeads = async () => {
    try {
      // Fetch from leads table
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch from leads_analysis table
      const { data: analysisData, error: analysisError } = await supabase
        .from("leads_analysis")
        .select("*")
        .order("created_at", { ascending: false });

      if (analysisError) throw analysisError;

      // Transform and combine leads
      const formattedLeads: Lead[] = (leadsData || []).map(lead => ({
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email,
        whatsapp: lead.whatsapp,
        company_name: lead.company_name,
        business_area: lead.business_area,
        source: lead.source,
        status: lead.status,
        created_at: lead.created_at,
        user_id: lead.user_id,
        type: "lead" as const,
      }));

      const formattedAnalysis: Lead[] = (analysisData || []).map(analysis => ({
        id: analysis.id,
        full_name: analysis.full_name,
        email: analysis.email || "",
        whatsapp: analysis.whatsapp,
        company_name: null,
        business_area: null,
        source: "landing_page_analysis",
        status: analysis.status,
        created_at: analysis.created_at,
        user_id: analysis.user_id,
        type: "analysis" as const,
        website_url: analysis.website_url,
        overall_score: analysis.overall_score,
      }));

      // Combine and sort by date
      const allLeads = [...formattedLeads, ...formattedAnalysis].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setLeads(allLeads);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "new":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "contacted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "converted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "lost":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "new":
        return "Novo";
      case "contacted":
        return "Contactado";
      case "converted":
        return "Convertido";
      case "lost":
        return "Perdido";
      default:
        return "Desconhecido";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Data desconhecida";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (lead.website_url?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "leads" && lead.type === "lead") ||
      (activeTab === "analysis" && lead.type === "analysis");

    return matchesSearch && matchesStatus && matchesTab;
  });

  const leadsCount = leads.filter(l => l.type === "lead").length;
  const analysisCount = leads.filter(l => l.type === "analysis").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Leads</h1>
        <Badge variant="outline" className="text-lg px-4 py-2 border-primary text-primary">
          {filteredLeads.length} Lead{filteredLeads.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Todos ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Leads ({leadsCount})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Análises ({analysisCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar por nome, email, empresa ou website..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-input border-border text-foreground"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-md bg-input border border-border text-foreground"
        >
          <option value="all">Todos os Status</option>
          <option value="new">Novos</option>
          <option value="contacted">Contactados</option>
          <option value="converted">Convertidos</option>
          <option value="lost">Perdidos</option>
        </select>
      </div>

      {filteredLeads.length === 0 ? (
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="bg-card border-border panel-shadow hover:border-primary/50 transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg text-foreground">
                      {lead.full_name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant="outline" 
                      className={lead.type === "analysis" 
                        ? "border-purple-500 text-purple-400" 
                        : "border-blue-500 text-blue-400"
                      }
                    >
                      {lead.type === "analysis" ? "Análise" : "Lead"}
                    </Badge>
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {lead.email || "Sem email"}
                </div>
                {lead.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {lead.whatsapp}
                  </div>
                )}
                {lead.company_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    {lead.company_name}
                  </div>
                )}
                {lead.website_url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a 
                      href={lead.website_url.startsWith("http") ? lead.website_url : `https://${lead.website_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary truncate text-cyan-400 underline cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lead.website_url}
                    </a>
                  </div>
                )}
                {lead.overall_score !== null && lead.overall_score !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className={`h-4 w-4 ${getScoreColor(lead.overall_score)}`} />
                    <span className={getScoreColor(lead.overall_score)}>
                      Score: {lead.overall_score}%
                    </span>
                  </div>
                )}
                {lead.source && (
                  <div className="text-xs text-muted-foreground">
                    Origem: <span className="text-primary">
                      {lead.source === "landing_page_analysis" ? "Landing Page Análise" : lead.source}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Calendar className="h-3 w-3" />
                  {formatDate(lead.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeadsPage;
