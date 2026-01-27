import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Settings,
  Zap,
  Info,
  Phone,
  Send,
  TestTube
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompany } from "@/hooks/useUserCompany";
import { useToast } from "@/hooks/use-toast";
import WhatsAppReceiveLeadsField from "@/components/settings/WhatsAppReceiveLeadsField";
import { validatePhoneNumber, formatPhoneNumber } from "@/hooks/useWhatsAppSend";

interface AdminConfig {
  is_active: boolean;
  default_provider: string;
}

export default function IntegrationsUserPage() {
  const { activeCompany: company, loading: companyLoading, refetch } = useUserCompany();
  const [systemStatus, setSystemStatus] = useState<AdminConfig | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ whatsapp_receive_leads: string | null } | null>(null);
  const { toast } = useToast();
  
  // Test sending state
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load system status from admin config
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        if (user) {
          // Load user profile for the WhatsApp field
          const { data: profile } = await supabase
            .from('profiles')
            .select('whatsapp_receive_leads')
            .eq('id', user.id)
            .single();
          
          setUserProfile(profile);
          // Pre-fill test phone with user's WhatsApp
          if (profile?.whatsapp_receive_leads) {
            setTestPhone(profile.whatsapp_receive_leads);
          }
        }

        // Load admin WhatsApp config to check system status
        const { data: adminConfig } = await supabase
          .from('admin_whatsapp_config')
          .select('is_active, default_provider')
          .eq('is_active', true)
          .maybeSingle();

        setSystemStatus(adminConfig);
      } catch (error) {
        console.error("Error loading system status:", error);
      } finally {
        setLoadingStatus(false);
      }
    };

    loadSystemStatus();
  }, []);

  const handleSendTest = async () => {
    if (!testPhone || !company?.id) return;
    
    // Validate phone
    const validation = validatePhoneNumber(testPhone);
    if (!validation.valid) {
      toast({
        title: "Número inválido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Check credits
    if ((company.whatsapp_credits || 0) < 1) {
      toast({
        title: "Sem créditos",
        description: "Não tem créditos suficientes para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const formattedPhone = formatPhoneNumber(testPhone);
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-meta', {
        body: {
          to: formattedPhone,
          message: "🔔 Teste de conexão WhatsApp - Sua integração está funcionando corretamente!",
          companyId: company.id,
          userId: userId,
        }
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult({
          success: true,
          message: "Mensagem de teste enviada com sucesso!"
        });
        toast({
          title: "✅ Teste Enviado!",
          description: "Verifique seu WhatsApp para confirmar o recebimento.",
        });
        // Refresh company data to update credits
        refetch();
      } else {
        throw new Error(data?.error || "Falha ao enviar mensagem de teste");
      }
    } catch (error: any) {
      console.error("Error sending test:", error);
      setTestResult({
        success: false,
        message: error.message || "Erro ao enviar mensagem de teste"
      });
      toast({
        title: "Erro no teste",
        description: error.message || "Não foi possível enviar a mensagem de teste.",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (companyLoading || loadingStatus) {
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
              A sua conta não está associada a nenhuma empresa. Contacte o administrador para configurar.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSystemActive = systemStatus?.is_active || false;
  const creditsPercentage = Math.min((company.whatsapp_credits || 0) / 100 * 100, 100);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Integrações WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Receba notificações de leads no seu WhatsApp
          </p>
        </div>
        <Badge 
          variant={isSystemActive ? "default" : "secondary"} 
          className={isSystemActive ? "bg-green-500" : ""}
        >
          {isSystemActive ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Sistema Ativo
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Sistema Inativo
            </>
          )}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Estado do Sistema WhatsApp
            </CardTitle>
            <CardDescription>
              Configuração centralizada pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${isSystemActive 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-muted/50 border border-border'}`}
            >
              <div className="flex items-center gap-3">
                {isSystemActive ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {isSystemActive ? "Sistema Operacional" : "Sistema Inativo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isSystemActive 
                      ? `Pronto para enviar mensagens via ${systemStatus?.default_provider === 'meta' ? 'Meta WhatsApp API' : 'Infobip'}`
                      : "O administrador ainda não configurou o sistema"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                A configuração das APIs do WhatsApp (Meta e Infobip) é gerida centralmente pelo administrador. 
                Não precisa de configurar credenciais - apenas o seu número para receber notificações.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Credits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Mensagens Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">
                {company.whatsapp_credits || 0}
              </span>
              <span className="text-muted-foreground ml-1">mensagens</span>
            </div>
            <Progress value={creditsPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {company.plan === 'trial' && "Plano Trial - 10 mensagens incluídas"}
              {company.plan === 'pro' && "Plano Pro - 500 mensagens/mês"}
              {company.plan === 'business' && "Plano Business - Ilimitado"}
              {!company.plan && "Contacte o suporte para adicionar créditos"}
            </p>
          </CardContent>
        </Card>

        {/* Test Sending Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Teste de Envio WhatsApp
            </CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar se a conexão está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Número de telefone para teste</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="+351 912 345 678"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="pl-10"
                      disabled={!isSystemActive || sendingTest}
                    />
                  </div>
                  <Button 
                    onClick={handleSendTest} 
                    disabled={!isSystemActive || sendingTest || !testPhone || (company.whatsapp_credits || 0) < 1}
                    className="min-w-[140px]"
                  >
                    {sendingTest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Teste
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-600' 
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                O teste irá descontar 1 crédito da sua conta. Certifique-se de que o número está correto e inclui o código do país.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Receive Leads Field - Full Width */}
        <div className="lg:col-span-2">
          {userId && (
            <WhatsAppReceiveLeadsField 
              userId={userId}
              initialValue={userProfile?.whatsapp_receive_leads || ""}
            />
          )}
        </div>

        {/* Company Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <p className="font-medium">{company.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Plano</span>
                <Badge variant="outline" className="capitalize">{company.plan || 'trial'}</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={company.is_active ? "default" : "secondary"}>
                  {company.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
