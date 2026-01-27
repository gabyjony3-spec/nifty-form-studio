import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  RefreshCw,
  Phone,
  Key,
  Globe,
  Shield,
  Send,
  AlertTriangle,
  Zap,
  Copy,
  Link,
  Clock,
  Wallet,
  Euro
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WhatsAppConfig {
  id: string;
  provider_type: string;
  infobip_api_key: string | null;
  infobip_base_url: string | null;
  infobip_sender_number: string | null;
  meta_phone_number_id: string | null;
  meta_access_token: string | null;
  meta_waba_id: string | null;
  default_provider: string;
  is_active: boolean;
  wallet_balance: number | null;
}

const WhatsAppCentralPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingInfobip, setTestingInfobip] = useState(false);
  const [testingMeta, setTestingMeta] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);

  // Form state
  const [infobipApiKey, setInfobipApiKey] = useState("");
  const [infobipBaseUrl, setInfobipBaseUrl] = useState("");
  const [infobipSenderNumber, setInfobipSenderNumber] = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [defaultProvider, setDefaultProvider] = useState("infobip");
  const [isActive, setIsActive] = useState(true);
  const [showInfobipKey, setShowInfobipKey] = useState(false);
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [savingBalance, setSavingBalance] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_whatsapp_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
        setInfobipApiKey(data.infobip_api_key || "");
        setInfobipBaseUrl(data.infobip_base_url || "");
        setInfobipSenderNumber(data.infobip_sender_number || "15558793622");
        setMetaPhoneNumberId(data.meta_phone_number_id || "");
        setMetaAccessToken(data.meta_access_token || "");
        setMetaWabaId(data.meta_waba_id || "");
        setDefaultProvider(data.default_provider || "infobip");
        setIsActive(data.is_active ?? true);
        setWalletBalance(data.wallet_balance?.toString() || "0.00");
      }
    } catch (error) {
      console.error("Error loading config:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar a configuração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWalletBalance = async () => {
    setSavingBalance(true);
    try {
      const balance = parseFloat(walletBalance) || 0;
      
      if (config?.id) {
        const { error } = await supabase
          .from("admin_whatsapp_config")
          .update({ 
            wallet_balance: balance,
            updated_at: new Date().toISOString() 
          })
          .eq("id", config.id);

        if (error) throw error;

        toast({
          title: "Saldo Atualizado! ✅",
          description: `Novo saldo: €${balance.toFixed(2)}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar saldo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingBalance(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const configData = {
        provider_type: infobipApiKey && metaPhoneNumberId ? "both" : infobipApiKey ? "infobip" : "meta",
        infobip_api_key: infobipApiKey || null,
        infobip_base_url: infobipBaseUrl || null,
        infobip_sender_number: infobipSenderNumber || "15558793622",
        meta_phone_number_id: metaPhoneNumberId || null,
        meta_access_token: metaAccessToken || null,
        meta_waba_id: metaWabaId || null,
        default_provider: defaultProvider,
        is_active: isActive,
        wallet_balance: parseFloat(walletBalance) || 0,
        updated_at: new Date().toISOString()
      };

      if (config?.id) {
        const { error } = await supabase
          .from("admin_whatsapp_config")
          .update(configData)
          .eq("id", config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_whatsapp_config")
          .insert(configData);

        if (error) throw error;
      }

      toast({
        title: "Configuração Guardada! ✅",
        description: "As credenciais de WhatsApp foram atualizadas"
      });

      loadConfig();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar a configuração",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testInfobip = async () => {
    if (!infobipApiKey || !infobipBaseUrl) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha API Key e Base URL da Infobip",
        variant: "destructive"
      });
      return;
    }

    setTestingInfobip(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { test: true }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Infobip Conectada! ✅",
          description: "As credenciais estão configuradas corretamente"
        });
      } else {
        toast({
          title: "Erro na conexão",
          description: data?.error || "Verifique as credenciais",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message || "Não foi possível testar a conexão",
        variant: "destructive"
      });
    } finally {
      setTestingInfobip(false);
    }
  };

  const testMeta = async () => {
    if (!metaPhoneNumberId || !metaAccessToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Phone Number ID e Access Token da Meta",
        variant: "destructive"
      });
      return;
    }

    setTestingMeta(true);
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${metaPhoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${metaAccessToken}`
          }
        }
      );

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Erro na conexão Meta",
          description: data.error.message || "Credenciais inválidas",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Meta Conectada! ✅",
          description: `Número verificado: ${data.display_phone_number || data.verified_name || "OK"}`
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Não foi possível conectar à API Meta",
        variant: "destructive"
      });
    } finally {
      setTestingMeta(false);
    }
  };

  const isInfobipConfigured = Boolean(infobipApiKey && infobipBaseUrl);
  const isMetaConfigured = Boolean(metaPhoneNumberId && metaAccessToken);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            WhatsApp Central
          </h1>
          <p className="text-muted-foreground mt-1">
            Configuração centralizada das APIs de WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              id="system-active"
            />
            <Label htmlFor="system-active">Sistema Ativo</Label>
          </div>
          <Button onClick={loadConfig} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <Card className={`border-2 ${parseFloat(walletBalance) < 2 ? 'border-destructive bg-destructive/5' : 'border-primary/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-primary" />
            Saldo em Carteira Infobip
          </CardTitle>
          <CardDescription>
            Saldo disponível para envio de mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={walletBalance}
                onChange={(e) => setWalletBalance(e.target.value)}
                className="max-w-[150px] text-xl font-bold"
                placeholder="0.00"
              />
            </div>
            <Button 
              onClick={saveWalletBalance} 
              disabled={savingBalance}
              variant="outline"
            >
              {savingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Atualizar</span>
            </Button>
          </div>
          {parseFloat(walletBalance) < 2 && (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Saldo baixo! Recarregue a sua conta Infobip para evitar falhas de envio.</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Este valor é atualizado manualmente. Consulte o painel Infobip para o saldo real.
          </p>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Infobip</p>
                <p className="text-lg font-semibold">
                  {isInfobipConfigured ? "Configurada" : "Não Configurada"}
                </p>
              </div>
              {isInfobipConfigured ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta Cloud API</p>
                <p className="text-lg font-semibold">
                  {isMetaConfigured ? "Configurada" : "Não Configurada"}
                </p>
              </div>
              {isMetaConfigured ? (
                <CheckCircle className="h-8 w-8 text-blue-500" />
              ) : (
                <XCircle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provedor Padrão</p>
                <p className="text-lg font-semibold capitalize">{defaultProvider}</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="infobip" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="infobip" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Infobip
            {isInfobipConfigured && <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Meta Cloud API
            {isMetaConfigured && <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Infobip Tab */}
        <TabsContent value="infobip">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-500" />
                Configuração Infobip
              </CardTitle>
              <CardDescription>
                Credenciais centralizadas para envio via Infobip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="infobip-key" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key *
                </Label>
                <div className="relative">
                  <Input
                    id="infobip-key"
                    type={showInfobipKey ? "text" : "password"}
                    placeholder="Sua Infobip API Key"
                    value={infobipApiKey}
                    onChange={(e) => setInfobipApiKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowInfobipKey(!showInfobipKey)}
                  >
                    {showInfobipKey ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="infobip-url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Base URL *
                </Label>
                <Input
                  id="infobip-url"
                  placeholder="Ex: api.infobip.com"
                  value={infobipBaseUrl}
                  onChange={(e) => setInfobipBaseUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="infobip-sender" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Número do Remetente
                </Label>
                <Input
                  id="infobip-sender"
                  placeholder="Ex: 447860099299"
                  value={infobipSenderNumber}
                  onChange={(e) => setInfobipSenderNumber(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={testInfobip}
                  disabled={testingInfobip || !infobipApiKey || !infobipBaseUrl}
                >
                  {testingInfobip ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  variant={defaultProvider === "infobip" ? "default" : "outline"}
                  onClick={() => setDefaultProvider("infobip")}
                >
                  {defaultProvider === "infobip" && <CheckCircle className="h-4 w-4 mr-2" />}
                  Definir como Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tab */}
        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Configuração Meta Cloud API
              </CardTitle>
              <CardDescription>
                Credenciais centralizadas para envio via Meta WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number ID *
                </Label>
                <Input
                  id="meta-phone"
                  placeholder="Ex: 123456789012345"
                  value={metaPhoneNumberId}
                  onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-waba" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  WhatsApp Business Account ID
                </Label>
                <Input
                  id="meta-waba"
                  placeholder="Ex: 123456789012345"
                  value={metaWabaId}
                  onChange={(e) => setMetaWabaId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-token" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Access Token Permanente *
                </Label>
                <div className="relative">
                  <Input
                    id="meta-token"
                    type={showMetaToken ? "text" : "password"}
                    placeholder="Token de acesso permanente do Meta"
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowMetaToken(!showMetaToken)}
                  >
                    {showMetaToken ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={testMeta}
                  disabled={testingMeta || !metaPhoneNumberId || !metaAccessToken}
                >
                  {testingMeta ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  variant={defaultProvider === "meta" ? "default" : "outline"}
                  onClick={() => setDefaultProvider("meta")}
                >
                  {defaultProvider === "meta" && <CheckCircle className="h-4 w-4 mr-2" />}
                  Definir como Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Configurações
        </Button>
      </div>

      {/* Webhook Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            Webhook para Status de Entrega
          </CardTitle>
          <CardDescription>
            Configure este URL no painel da Infobip para receber atualizações de status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Webhook URL (Infobip Delivery Reports)
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`
                  );
                  toast({
                    title: "Copiado! 📋",
                    description: "URL do webhook copiado para a área de transferência"
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole este URL nas configurações de webhook da Infobip para receber notificações de entrega em tempo real.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Processador de Mensagens Agendadas
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-scheduled-messages`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-scheduled-messages`
                  );
                  toast({
                    title: "Copiado! 📋",
                    description: "URL do processador copiado para a área de transferência"
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure um cron job externo (ex: cron-job.org) para chamar este endpoint a cada 5 minutos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Configuração Centralizada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Estas credenciais serão usadas por todos os utilizadores do sistema para envio de mensagens WhatsApp.
                Os utilizadores finais apenas precisam de indicar o número para receber notificações de leads.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppCentralPage;