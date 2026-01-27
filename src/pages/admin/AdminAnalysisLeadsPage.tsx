import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  MessageCircle, 
  Search,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useWhatsAppSend } from "@/hooks/useWhatsAppSend";

interface LeadAnalysis {
  id: string;
  full_name: string;
  whatsapp: string;
  email: string | null;
  website_url: string;
  overall_score: number | null;
  seo_score: number | null;
  speed_score: number | null;
  conversion_score: number | null;
  structure_score: number | null;
  message_sent: boolean;
  status: string;
  created_at: string;
}

const AdminAnalysisLeadsPage = () => {
  const [leads, setLeads] = useState<LeadAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sendingToLead, setSendingToLead] = useState<string | null>(null);
  
  const { sendMessage, openWhatsAppWeb } = useWhatsAppSend();
  
  // Metrics
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  useEffect(() => {
    fetchLeads();
    fetchMetrics();
    
    // Realtime subscription
    const channel = supabase
      .channel('leads_analysis_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads_analysis' },
        () => {
          fetchLeads();
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as LeadAnalysis[]) || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Total website analyses
      const { count: analysesCount } = await supabase
        .from('website_analysis')
        .select('*', { count: 'exact', head: true });

      // Total leads from analysis
      const { count: leadsCount } = await supabase
        .from('leads_analysis')
        .select('*', { count: 'exact', head: true });

      setTotalAnalyses(analysesCount || 0);
      setTotalLeads(leadsCount || 0);
      setConversionRate(analysesCount ? Math.round((leadsCount || 0) / analysesCount * 100) : 0);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads_analysis')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      
      toast({
        title: "Status Atualizado",
        description: `Lead marcado como "${getStatusLabel(newStatus)}"`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = async (lead: LeadAnalysis) => {
    setSendingToLead(lead.id);
    
    const message = `Olá ${lead.full_name}, vi que o seu site ${lead.website_url} teve nota ${lead.overall_score || 'N/A'} na nossa análise. Posso ajudar a resolver os problemas detetados?`;
    
    const result = await sendMessage({
      to: lead.whatsapp,
      message,
      leadId: lead.id
    });
    
    if (result.success) {
      // Update lead status to contacted
      await updateStatus(lead.id, 'contacted');
    }
    
    setSendingToLead(null);
  };

  const handleOpenWhatsAppWeb = (lead: LeadAnalysis) => {
    const message = `Olá ${lead.full_name}, vi que o seu site ${lead.website_url} teve nota ${lead.overall_score || 'N/A'} na nossa análise. Posso ajudar a resolver os problemas detetados?`;
    openWhatsAppWeb(lead.whatsapp, message);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Data', 'Nome', 'WhatsApp', 'Email', 'URL', 'Score', 'Status'].join(','),
      ...filteredLeads.map(lead => [
        format(new Date(lead.created_at), 'dd/MM/yyyy'),
        lead.full_name,
        lead.whatsapp,
        lead.email || '',
        lead.website_url,
        lead.overall_score || '',
        getStatusLabel(lead.status)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_analysis_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Exportação Concluída",
      description: `${filteredLeads.length} leads exportados para CSV`,
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "Novo",
      contacted: "Em Contacto",
      qualified: "Qualificado",
      converted: "Convertido",
      lost: "Perdido"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      qualified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      converted: "bg-green-500/20 text-green-400 border-green-500/30",
      lost: "bg-red-500/20 text-red-400 border-red-500/30"
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.website_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.whatsapp.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    const matchesScore = scoreFilter === "all" || 
      (scoreFilter === "low" && (lead.overall_score || 0) < 50) ||
      (scoreFilter === "medium" && (lead.overall_score || 0) >= 50 && (lead.overall_score || 0) < 70) ||
      (scoreFilter === "high" && (lead.overall_score || 0) >= 70);

    return matchesSearch && matchesStatus && matchesScore;
  });

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Leads de Análise</h1>
          <p className="text-muted-foreground">Leads gerados através das análises de websites</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Análises
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalAnalyses}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Leads
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalLeads}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conversão
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{conversionRate}%</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, URL ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-input border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Em Contacto</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-full md:w-40 bg-input border-border">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low">Baixo (&lt;50)</SelectItem>
                <SelectItem value="medium">Médio (50-69)</SelectItem>
                <SelectItem value="high">Alto (≥70)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchLeads}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">WhatsApp</TableHead>
                  <TableHead className="font-semibold">URL</TableHead>
                  <TableHead className="font-semibold text-center">Score</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border hover:bg-muted/30"
                    >
                      <TableCell className="text-muted-foreground">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: pt })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {lead.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.whatsapp}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a 
                          href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {lead.website_url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-lg ${getScoreColor(lead.overall_score)}`}>
                          {lead.overall_score || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => updateStatus(lead.id, value)}
                        >
                          <SelectTrigger className="h-8 w-32 bg-transparent border-0 p-0">
                            <Badge className={`${getStatusColor(lead.status)} border`}>
                              {getStatusLabel(lead.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Em Contacto</SelectItem>
                            <SelectItem value="qualified">Qualificado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendWhatsApp(lead)}
                            disabled={sendingToLead === lead.id}
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            title="Enviar via API"
                          >
                            {sendingToLead === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenWhatsAppWeb(lead)}
                            className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            title="Abrir WhatsApp Web"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalysisLeadsPage;