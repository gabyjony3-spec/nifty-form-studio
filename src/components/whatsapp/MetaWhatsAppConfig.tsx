import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  ExternalLink,
  Shield,
  Key,
  Phone,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  phone_number_id: string | null;
  whatsapp_access_token: string | null;
  waba_id: string | null;
  webhook_verify_token: string;
  whatsapp_credits: number;
  plan: string;
  meta_configured: boolean;
}

interface MetaWhatsAppConfigProps {
  companyId: string;
  onConfigured?: () => void;
}

const MetaWhatsAppConfig = ({ companyId, onConfigured }: MetaWhatsAppConfigProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Form fields
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;

      const companyData = data as Company;
      setCompany(companyData);
      setPhoneNumberId(companyData.phone_number_id || "");
      setAccessToken(companyData.whatsapp_access_token || "");
      setWabaId(companyData.waba_id || "");
    } catch (error) {
      console.error("Error loading company:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados da empresa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!phoneNumberId || !accessToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Phone Number ID e Access Token são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          phone_number_id: phoneNumberId,
          whatsapp_access_token: accessToken,
          waba_id: wabaId || null,
          meta_configured: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", companyId);

      if (error) throw error;

      toast({
        title: "Configuração Salva! ✅",
        description: "As credenciais Meta foram atualizadas com sucesso"
      });

      loadCompany();
      onConfigured?.();
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!company?.meta_configured) {
      toast({
        title: "Configuração necessária",
        description: "Salve a configuração antes de testar",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      // Test by calling the Meta API to get phone number info
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${company.phone_number_id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || company.whatsapp_access_token}`
          }
        }
      );

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Erro na conexão",
          description: data.error.message || "Credenciais inválidas",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Conexão bem-sucedida! ✅",
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
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "URL Copiada!",
      description: "Cole esta URL na configuração do webhook Meta"
    });
  };

  const copyVerifyToken = () => {
    if (company?.webhook_verify_token) {
      navigator.clipboard.writeText(company.webhook_verify_token);
      toast({
        title: "Token Copiado!",
        description: "Use este token como Verify Token no Meta"
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-foreground">Meta WhatsApp Cloud API</CardTitle>
                <CardDescription>Configuração da integração oficial Meta</CardDescription>
              </div>
            </div>
            {company?.meta_configured ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Settings className="h-3 w-3 mr-1" />
                Não Configurado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credits Info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Créditos WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Plano: {company?.plan?.toUpperCase() || "TRIAL"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {company?.plan === 'business' ? '∞' : company?.whatsapp_credits || 0}
              </p>
              <p className="text-xs text-muted-foreground">restantes</p>
            </div>
          </div>

          <Separator />

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number_id" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number ID *
              </Label>
              <Input
                id="phone_number_id"
                placeholder="Ex: 123456789012345"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encontre em: Meta Business Suite → WhatsApp → Configurações da API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waba_id" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                WhatsApp Business Account ID (opcional)
              </Label>
              <Input
                id="waba_id"
                placeholder="Ex: 123456789012345"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Access Token Permanente *
              </Label>
              <div className="relative">
                <Input
                  id="access_token"
                  type={showToken ? "text" : "password"}
                  placeholder="Token de acesso permanente do Meta"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gere um token permanente no Meta Business Suite
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={saveConfiguration} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Configuração
            </Button>
            <Button 
              variant="outline" 
              onClick={testConnection} 
              disabled={testing || !company?.meta_configured}
            >
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Testar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Configure estes valores no Meta Business Suite para receber atualizações de status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Callback URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verify Token</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={company?.webhook_verify_token || ""}
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={copyVerifyToken}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium text-foreground">Campos de Webhook a subscrever:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• messages</li>
              <li>• message_deliveries</li>
              <li>• message_reads</li>
            </ul>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a 
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação Meta Webhooks
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaWhatsAppConfig;
