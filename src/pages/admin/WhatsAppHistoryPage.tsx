import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MessageSquare, 
  Search, 
  Calendar, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface MessageLog {
  id: string;
  user_id: string;
  company_id: string | null;
  recipient_phone: string | null;
  content: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  error_message: string | null;
  external_message_id: string | null;
  meta_message_id: string | null;
  template_name: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  company?: {
    name: string | null;
  };
}

interface Company {
  id: string;
  name: string;
}

const WhatsAppHistoryPage = () => {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    loadCompanies();
    fetchLogs();

    // Setup Supabase Realtime subscription
    const channel = supabase
      .channel('whatsapp-logs-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'automation_logs'
      }, (payload) => {
        console.log('Realtime update:', payload);
        // Refresh logs when any change occurs
        fetchLogs();
      })
      .subscribe((status) => {
        console.log('Realtime status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter, dateFilter, companyFilter]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .order("name");
    if (data) setCompanies(data);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("automation_logs")
        .select(`
          id,
          user_id,
          company_id,
          recipient_phone,
          content,
          status,
          created_at,
          updated_at,
          error_message,
          external_message_id,
          meta_message_id,
          template_name
        `)
        .eq("type", "whatsapp")
        .order("created_at", { ascending: false })
        .limit(200);

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply company filter
      if (companyFilter !== "all") {
        query = query.eq("company_id", companyFilter);
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles and companies for each log
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
        const companyIds = [...new Set(data.map(log => log.company_id).filter(Boolean))];
        
        const [profilesRes, companiesRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email").in("id", userIds),
          companyIds.length > 0 
            ? supabase.from("companies").select("id, name").in("id", companyIds)
            : Promise.resolve({ data: [] })
        ]);

        const profileMap = new Map<string, { id: string; full_name: string | null; email: string | null }>(
          profilesRes.data?.map(p => [p.id, p]) || []
        );
        const companyMap = new Map<string, { id: string; name: string | null }>(
          (companiesRes.data as { id: string; name: string | null }[] | null)?.map(c => [c.id, c]) || []
        );
        
        const logsWithData = data.map(log => ({
          ...log,
          profiles: profileMap.get(log.user_id) || undefined,
          company: log.company_id ? companyMap.get(log.company_id) || undefined : undefined
        })) as MessageLog[];

        setLogs(logsWithData);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Enviado</Badge>;
      case "delivered":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Entregue</Badge>;
      case "read":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Lido</Badge>;
      case "failed":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Falhou</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      default:
        return <Badge variant="outline">{status || "Desconhecido"}</Badge>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "sent":
      case "delivered":
      case "read":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.recipient_phone?.toLowerCase().includes(search) ||
      log.content?.toLowerCase().includes(search) ||
      log.template_name?.toLowerCase().includes(search) ||
      log.profiles?.full_name?.toLowerCase().includes(search) ||
      log.profiles?.email?.toLowerCase().includes(search) ||
      log.company?.name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === "sent").length,
    delivered: logs.filter(l => l.status === "delivered").length,
    read: logs.filter(l => l.status === "read").length,
    failed: logs.filter(l => l.status === "failed").length,
    metaCount: logs.filter(l => l.meta_message_id).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico WhatsApp</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Mensagens via Meta Cloud API</span>
            {stats.metaCount > 0 && <span className="text-primary">({stats.metaCount} via Meta)</span>}
            {realtimeConnected && (
              <Badge variant="outline" className="border-green-500/50 text-green-500 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-blue-400">{stats.sent}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lidos</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.read}</p>
              </div>
              <Eye className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border panel-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falharam</p>
                <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar por telefone, conteúdo, template ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="read">Lido</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Mensagens</CardTitle>
          <CardDescription>
            {filteredLogs.length} mensagem(ns) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem encontrada</p>
              <p className="text-sm">As mensagens aparecerão aqui em tempo real quando forem enviadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.recipient_phone || "-"}
                      </TableCell>
                      <TableCell>
                        {log.template_name ? (
                          <Badge variant="outline" className="text-xs">
                            {log.template_name}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.content || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            {log.profiles?.full_name || "Desconhecido"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.profiles?.email || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.created_at 
                          ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: pt })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {log.error_message ? (
                          <span className="text-xs text-destructive truncate block">
                            {log.error_message.substring(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppHistoryPage;
