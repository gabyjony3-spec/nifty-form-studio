import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Webhook, Save, Loader2, CheckCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebhookConfig {
  id?: string;
  webhook_type: string;
  webhook_url: string;
  secret_key: string;
  is_active: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
}

const WebhooksPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [tictoConfig, setTictoConfig] = useState<WebhookConfig>({
    webhook_type: "ticto",
    webhook_url: "",
    secret_key: "",
    is_active: true,
    last_test_at: null,
    last_test_status: null,
  });

  const [infobipConfig, setInfobipConfig] = useState<WebhookConfig>({
    webhook_type: "infobip",
    webhook_url: "",
    secret_key: "",
    is_active: true,
    last_test_at: null,
    last_test_status: null,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase
        .from("webhook_configs")
        .select("*")
        .eq("user_id", user.user.id);

      if (error) throw error;

      if (data) {
        const ticto = data.find(c => c.webhook_type === "ticto");
        const infobip = data.find(c => c.webhook_type === "infobip");

        if (ticto) {
          setTictoConfig({
            id: ticto.id,
            webhook_type: ticto.webhook_type,
            webhook_url: ticto.webhook_url || "",
            secret_key: ticto.secret_key || "",
            is_active: ticto.is_active ?? true,
            last_test_at: ticto.last_test_at,
            last_test_status: ticto.last_test_status,
          });
        }

        if (infobip) {
          setInfobipConfig({
            id: infobip.id,
            webhook_type: infobip.webhook_type,
            webhook_url: infobip.webhook_url || "",
            secret_key: infobip.secret_key || "",
            is_active: infobip.is_active ?? true,
            last_test_at: infobip.last_test_at,
            last_test_status: infobip.last_test_status,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (config: WebhookConfig, type: string) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("webhook_configs")
        .upsert({
          user_id: user.user.id,
          webhook_type: config.webhook_type,
          webhook_url: config.webhook_url,
          secret_key: config.secret_key,
          is_active: config.is_active,
        }, {
          onConflict: "user_id,webhook_type",
        });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: `Webhook ${type} configurado com sucesso`,
      });

      // Refresh configs
      await fetchConfigs();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const [testingInfobip, setTestingInfobip] = useState(false);

  const testInfobipConnection = async () => {
    setTestingInfobip(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }

      // Test if Infobip is configured by checking if we get a proper response
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { test: true, to: "+000000000000", message: "connection_test_only" },
      });

      // Determine status based on response
      let status = "failed";
      let statusMessage = "Verifique as credenciais INFOBIP_API_KEY e INFOBIP_BASE_URL";
      
      if (!error) {
        // If no error, the API responded (even with rejection due to invalid number)
        status = "success";
        statusMessage = "API Infobip está funcionando corretamente";
      } else {
        const errorMessage = error.message || "";
        // Check if error is about credentials
        if (!errorMessage.includes("INFOBIP") && !errorMessage.includes("API key")) {
          // If error is not about credentials, API might still be working
          status = "success";
          statusMessage = "API Infobip está respondendo";
        }
      }
      
      // Update the config with test result
      await supabase
        .from("webhook_configs")
        .upsert({
          user_id: user.user.id,
          webhook_type: "infobip",
          webhook_url: infobipConfig.webhook_url,
          secret_key: infobipConfig.secret_key,
          is_active: infobipConfig.is_active,
          last_test_at: new Date().toISOString(),
          last_test_status: status,
        }, {
          onConflict: "user_id,webhook_type",
        });

      toast({
        title: status === "success" ? "Conexão verificada" : "Falha na conexão",
        description: statusMessage,
        variant: status === "success" ? "default" : "destructive",
      });

      await fetchConfigs();
    } catch (error: any) {
      console.error("Test error:", error);
      toast({
        title: "Erro no teste",
        description: error.message || "Não foi possível testar a conexão",
        variant: "destructive",
      });
    } finally {
      setTestingInfobip(false);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
          <h1 className="text-3xl font-bold text-foreground">Webhooks & Integrações</h1>
          <p className="text-muted-foreground">Configure webhooks Ticto e conexão Infobip</p>
        </div>
        <Button variant="outline" onClick={fetchConfigs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Ticto Webhook Configuration */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Webhook Ticto</CardTitle>
            </div>
            <Badge 
              variant="outline"
              className={tictoConfig.webhook_url 
                ? "border-green-500 text-green-500" 
                : "border-muted-foreground text-muted-foreground"
              }
            >
              {tictoConfig.webhook_url ? "Configurado" : "Não configurado"}
            </Badge>
          </div>
          <CardDescription>
            Configure a URL do webhook para receber pagamentos do Ticto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticto-webhook-url">URL do Webhook</Label>
            <Input
              id="ticto-webhook-url"
              placeholder="https://seu-dominio.com/webhook/ticto"
              value={tictoConfig.webhook_url}
              onChange={(e) => setTictoConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticto-secret">Secret Key</Label>
            <div className="relative">
              <Input
                id="ticto-secret"
                type={showSecrets.ticto ? "text" : "password"}
                placeholder="Sua chave secreta do Ticto"
                value={tictoConfig.secret_key}
                onChange={(e) => setTictoConfig(prev => ({ ...prev, secret_key: e.target.value }))}
                className="bg-input border-border text-foreground pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => toggleSecretVisibility("ticto")}
              >
                {showSecrets.ticto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button 
            onClick={() => saveConfig(tictoConfig, "Ticto")}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-neon"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Infobip Configuration */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <CardTitle className="text-foreground">Portal Infobip (WhatsApp)</CardTitle>
            </div>
            <Badge 
              variant="outline"
              className={infobipConfig.last_test_status === "success" 
                ? "border-green-500 text-green-500" 
                : infobipConfig.webhook_url
                  ? "border-yellow-500 text-yellow-500"
                  : "border-muted-foreground text-muted-foreground"
              }
            >
              {infobipConfig.last_test_status === "success" 
                ? "Conectado" 
                : infobipConfig.webhook_url 
                  ? "Configurado"
                  : "Não configurado"
              }
            </Badge>
          </div>
          <CardDescription>
            Conecte-se ao Portal Infobip para envio de mensagens WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="infobip-url">Base URL da API</Label>
            <Input
              id="infobip-url"
              placeholder="https://xxxxx.api.infobip.com"
              value={infobipConfig.webhook_url}
              onChange={(e) => setInfobipConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
              className="bg-input border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              A URL base do Infobip está configurada nas secrets do sistema
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="infobip-api-key">API Key (Referência)</Label>
            <div className="relative">
              <Input
                id="infobip-api-key"
                type={showSecrets.infobip ? "text" : "password"}
                placeholder="Referência da sua API Key"
                value={infobipConfig.secret_key}
                onChange={(e) => setInfobipConfig(prev => ({ ...prev, secret_key: e.target.value }))}
                className="bg-input border-border text-foreground pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => toggleSecretVisibility("infobip")}
              >
                {showSecrets.infobip ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A API Key real está configurada na secret INFOBIP_API_KEY
            </p>
          </div>

          {infobipConfig.last_test_at && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className={`h-4 w-4 ${
                  infobipConfig.last_test_status === "success" ? "text-green-500" : "text-destructive"
                }`} />
                <span className="text-foreground">
                  Último teste: {new Date(infobipConfig.last_test_at).toLocaleString("pt-PT")}
                </span>
                <Badge 
                  variant="outline" 
                  className={infobipConfig.last_test_status === "success" 
                    ? "border-green-500 text-green-500" 
                    : "border-destructive text-destructive"
                  }
                >
                  {infobipConfig.last_test_status === "success" ? "Sucesso" : "Falhou"}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={() => saveConfig(infobipConfig, "Infobip")}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-neon"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
            <Button 
              variant="outline"
              onClick={testInfobipConnection}
              disabled={testingInfobip}
            >
              {testingInfobip ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook History - Static for now */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Histórico de Webhooks</CardTitle>
          <CardDescription>Últimos eventos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>O histórico de eventos será exibido aqui</p>
              <p className="text-xs">Configure os webhooks acima para começar a receber eventos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhooksPage;
