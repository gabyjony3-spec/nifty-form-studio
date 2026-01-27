import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Webhook, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Users, 
  Send,
  RefreshCw,
  AlertTriangle,
  Settings,
  Building2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface IntegrationStats {
  companiesWithMeta: number;
  totalCompanies: number;
  totalMessagesSent: number;
  metaApiStatus: "checking" | "active" | "partial" | "unconfigured";
  webhookConfigsCount: number;
  totalCredits: number;
}

const IntegrationsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  
  const [stats, setStats] = useState<IntegrationStats>({
    companiesWithMeta: 0,
    totalCompanies: 0,
    totalMessagesSent: 0,
    metaApiStatus: "checking",
    webhookConfigsCount: 0,
    totalCredits: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Count companies with Meta configured
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, meta_configured, whatsapp_credits")
        .eq("is_active", true);

      if (!companiesError && companiesData) {
        const companiesWithMeta = companiesData.filter(c => c.meta_configured).length;
        const totalCredits = companiesData.reduce((sum, c) => sum + (c.whatsapp_credits || 0), 0);
        
        let metaApiStatus: "checking" | "active" | "partial" | "unconfigured" = "unconfigured";
        if (companiesWithMeta === 0) {
          metaApiStatus = "unconfigured";
        } else if (companiesWithMeta === companiesData.length) {
          metaApiStatus = "active";
        } else {
          metaApiStatus = "partial";
        }

        setStats(prev => ({
          ...prev,
          companiesWithMeta,
          totalCompanies: companiesData.length,
          totalCredits,
          metaApiStatus,
        }));
      }

      // Count total messages sent from automation_logs (actual records)
      const { count: totalMessages } = await supabase
        .from("automation_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "whatsapp")
        .in("status", ["sent", "delivered", "read"]);

      // Count webhook configs
      const { count: webhookCount } = await supabase
        .from("webhook_configs")
        .select("*", { count: "exact", head: true });

      setStats(prev => ({
        ...prev,
        totalMessagesSent: totalMessages || 0,
        webhookConfigsCount: webhookCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Tente atualizar a página",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testMetaConnection = async () => {
    setTesting(true);
    try {
      // Get a company with Meta configured
      const { data: company } = await supabase
        .from("companies")
        .select("id, name, phone_number_id, whatsapp_access_token")
        .eq("meta_configured", true)
        .limit(1)
        .single();

      if (!company) {
        toast({
          title: "Nenhuma empresa configurada",
          description: "Configure pelo menos uma empresa com credenciais Meta",
          variant: "destructive",
        });
        return;
      }

      // Try to call the send-whatsapp-meta function in test mode
      const { data, error } = await supabase.functions.invoke("send-whatsapp-meta", {
        body: { 
          test: true, 
          companyId: company.id
        },
      });

      if (error) {
        toast({
          title: "Erro na conexão Meta",
          description: error.message || "Verifique as credenciais da empresa",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conexão Meta verificada",
          description: `API da empresa "${company.name}" está respondendo`,
        });
      }
    } catch (error: unknown) {
      console.error("Test error:", error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível verificar a conexão",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: "checking" | "active" | "partial" | "unconfigured") => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "unconfigured":
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: "checking" | "active" | "partial" | "unconfigured") => {
    switch (status) {
      case "checking":
        return "Verificando...";
      case "active":
        return "Todas Configuradas";
      case "partial":
        return "Parcialmente Configurado";
      case "unconfigured":
        return "Não Configurado";
    }
  };

  const getStatusColor = (status: "checking" | "active" | "partial" | "unconfigured") => {
    switch (status) {
      case "active":
        return "border-green-500 text-green-500";
      case "partial":
        return "border-yellow-500 text-yellow-500";
      default:
        return "border-destructive text-destructive";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrações & Webhooks</h1>
          <p className="text-muted-foreground">Monitore APIs Meta Cloud e integrações do sistema</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Meta WhatsApp Cloud API Status */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#25D366]" />
                <CardTitle className="text-foreground text-lg">Meta Cloud API</CardTitle>
              </div>
              {getStatusIcon(stats.metaApiStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge 
                variant="outline" 
                className={getStatusColor(stats.metaApiStatus)}
              >
                {getStatusLabel(stats.metaApiStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Empresas configuradas</span>
              <span className="font-medium">{stats.companiesWithMeta}/{stats.totalCompanies}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={testMetaConnection}
                disabled={testing || stats.companiesWithMeta === 0}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar
              </Button>
              <Button 
                size="sm" 
                variant="default"
                className="w-full"
                onClick={() => navigate("/admin/companies")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Companies with Meta configured */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground text-lg">Empresas SaaS</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCompanies}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.companiesWithMeta} com Meta configurado
            </p>
            <Button 
              size="sm" 
              variant="link" 
              className="p-0 mt-2 h-auto"
              onClick={() => navigate("/admin/companies")}
            >
              Gerir Empresas <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Total Messages Sent */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground text-lg">Mensagens Enviadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalMessagesSent}
            </div>
            <p className="text-sm text-muted-foreground">Total via Meta Cloud API</p>
            <Button 
              size="sm" 
              variant="link" 
              className="p-0 mt-2 h-auto"
              onClick={() => navigate("/admin/whatsapp-history")}
            >
              Ver Histórico <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Webhook Configs */}
        <Card className="bg-card border-border panel-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground text-lg">Webhooks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.webhookConfigsCount}
            </div>
            <p className="text-sm text-muted-foreground">Configurados</p>
          </CardContent>
        </Card>
      </div>

      {/* Meta Cloud API Info */}
      <Card className="bg-card border-border panel-shadow border-l-4 border-l-[#25D366]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#25D366]" />
            <CardTitle className="text-foreground">Meta WhatsApp Cloud API</CardTitle>
          </div>
          <CardDescription>
            Sistema multi-tenant com credenciais por empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground mb-1">Como Configurar</p>
                <p className="text-xs text-muted-foreground">
                  1. Vá a <strong>Empresas SaaS</strong><br />
                  2. Clique em <strong>Editar</strong> na empresa<br />
                  3. Preencha Phone Number ID, WABA ID e Access Token
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground mb-1">Credenciais Necessárias</p>
                <p className="text-xs text-muted-foreground">
                  • <strong>Phone Number ID</strong>: ID do número no Meta<br />
                  • <strong>WABA ID</strong>: ID da conta Business<br />
                  • <strong>Access Token</strong>: Token permanente do Meta
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground mb-1">Saldo de Créditos</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Total disponível em todas as empresas:
                </p>
                <p className="text-2xl font-bold text-primary">{stats.totalCredits}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Section */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Endpoints Disponíveis</CardTitle>
          </div>
          <CardDescription>
            Endpoints de edge functions para integrações externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Envio WhatsApp Meta</p>
                <code className="text-xs text-muted-foreground">
                  POST /functions/v1/send-whatsapp-meta
                </code>
              </div>
              <Badge 
                variant="outline" 
                className={
                  stats.companiesWithMeta > 0
                    ? "border-green-500 text-green-500" 
                    : "border-yellow-500 text-yellow-500"
                }
              >
                {stats.companiesWithMeta > 0 ? "Disponível" : "Requer Config"}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Webhook Meta (Callbacks)</p>
                <code className="text-xs text-muted-foreground">
                  POST /functions/v1/meta-webhook
                </code>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                Disponível
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sincronizar Templates</p>
                <code className="text-xs text-muted-foreground">
                  POST /functions/v1/sync-whatsapp-templates
                </code>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                Disponível
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Análise de Website</p>
                <code className="text-xs text-muted-foreground">
                  POST /functions/v1/analyze-website
                </code>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                Disponível
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">AI Chat</p>
                <code className="text-xs text-muted-foreground">
                  POST /functions/v1/ai-chat
                </code>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-500">
                Disponível
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Summary */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Resumo de Atividade</CardTitle>
          <CardDescription>
            Estatísticas das integrações ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stats.totalMessagesSent > 0 || stats.companiesWithMeta > 0 || stats.webhookConfigsCount > 0 ? (
              <>
                {stats.companiesWithMeta > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-foreground">
                        {stats.companiesWithMeta} empresa(s) com Meta Cloud API configurada
                      </span>
                    </div>
                  </div>
                )}
                {stats.totalMessagesSent > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        {stats.totalMessagesSent} mensagem(ns) enviada(s) via Meta Cloud API
                      </span>
                    </div>
                  </div>
                )}
                {stats.webhookConfigsCount > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">
                        {stats.webhookConfigsCount} webhook(s) configurado(s)
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma atividade registrada</p>
                <p className="text-xs mt-1">Configure as empresas com credenciais Meta para começar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => navigate("/admin/companies")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Empresas
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
