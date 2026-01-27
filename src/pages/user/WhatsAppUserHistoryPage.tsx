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
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompany } from "@/hooks/useUserCompany";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface MessageLog {
  id: string;
  recipient_phone: string | null;
  content: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  error_message: string | null;
  template_name: string | null;
  meta_message_id: string | null;
}

const WhatsAppUserHistoryPage = () => {
  const { activeCompany: company, loading: companyLoading } = useUserCompany();
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    if (company?.id) {
      fetchLogs();

      // Setup realtime subscription for this company's messages
      const channel = supabase
        .channel('user-whatsapp-logs-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'automation_logs',
          filter: `company_id=eq.${company.id}`
        }, (payload) => {
          console.log('Realtime update:', payload);
          fetchLogs();
        })
        .subscribe((status) => {
          console.log('Realtime status:', status);
          setRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [company?.id]);

  useEffect(() => {
    if (company?.id) {
      fetchLogs();
    }
  }, [statusFilter, dateFilter, company?.id]);

  const fetchLogs = async () => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("automation_logs")
        .select(`
          id,
          recipient_phone,
          content,
          status,
          created_at,
          updated_at,
          error_message,
          template_name,
          meta_message_id
        `)
        .eq("company_id", company.id)
        .eq("type", "whatsapp")
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
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
      setLogs(data || []);
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
      log.template_name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === "sent").length,
    delivered: logs.filter(l => l.status === "delivered").length,
    read: logs.filter(l => l.status === "read").length,
    failed: logs.filter(l => l.status === "failed").length,
  };

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Empresa não configurada
            </CardTitle>
            <CardDescription>
              A sua conta não está associada a nenhuma empresa. Contacte o administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Histórico de Mensagens
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Suas mensagens WhatsApp enviadas</span>
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
      <Card>
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
                placeholder="Pesquisar por telefone, conteúdo ou template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
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
      <Card>
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

export default WhatsAppUserHistoryPage;
