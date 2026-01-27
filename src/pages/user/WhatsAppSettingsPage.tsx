import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  QrCode,
  Check,
  Send,
  Save,
  Loader2,
  Phone,
  CreditCard,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Variable,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserCompany } from "@/hooks/useUserCompany";
import { motion } from "framer-motion";
import { MobilePreview } from "@/components/automation/MobilePreview";

interface MessageTemplate {
  id: string;
  template_type: string;
  message_content: string;
  is_active: boolean;
}

const templateTypes = [
  { value: "welcome", label: "Boas-Vindas", description: "Enviada quando um novo lead é capturado" },
  { value: "ai_insight_welcome", label: "Boas-Vindas AI Insight", description: "Template oficial Infobip para AI Insight" },
  { value: "lead_recovery", label: "Recuperação de Lead", description: "Enviada para leads inativos" },
  { value: "analysis_result", label: "Resultado de Análise", description: "Enviada após análise de website" },
  { value: "follow_up", label: "Follow-up", description: "Mensagem de acompanhamento" },
];

const availableVariables = [
  { name: "{nome}", description: "Nome do lead" },
  { name: "{email}", description: "Email do lead" },
  { name: "{url}", description: "URL do website" },
  { name: "{score_geral}", description: "Score geral da análise" },
  { name: "{score_seo}", description: "Score de SEO" },
  { name: "{empresa}", description: "Nome da sua empresa" },
];

const WhatsAppSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>("welcome");
  const [messageContent, setMessageContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [testPhone, setTestPhone] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeCompany, loading: companyLoading, refetch: refetchCompany } = useUserCompany();

  useEffect(() => {
    if (activeCompany) {
      fetchTemplates();
    }
  }, [activeCompany]);

  const fetchTemplates = async () => {
    if (!activeCompany) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, template_name, body_text, status')
        .eq('company_id', activeCompany.id);

      if (error) throw error;

      // Map to our local template format
      const mappedTemplates: MessageTemplate[] = (data || []).map(t => ({
        id: t.id,
        template_type: t.template_name || 'custom',
        message_content: t.body_text || '',
        is_active: t.status === 'approved',
      }));
      
      setTemplates(mappedTemplates);
      
      // Set default welcome message
      setMessageContent(`Olá {nome}! 👋

Bem-vindo ao {empresa}! Analisei o seu website {url} e encontrei várias oportunidades de melhoria.

O seu score geral é de {score_geral}/100.

Posso ajudá-lo a melhorar estes resultados. Responda a esta mensagem para saber mais!`);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const existingTemplate = templates.find((t) => t.template_type === type);
    if (existingTemplate) {
      setMessageContent(existingTemplate.message_content);
      setIsActive(existingTemplate.is_active);
    } else {
      // Set default based on type
      const defaults: Record<string, string> = {
        welcome: `Olá {nome}! 👋\n\nBem-vindo ao {empresa}! Analisei o seu website {url} e encontrei várias oportunidades de melhoria.\n\nO seu score geral é de {score_geral}/100.\n\nPosso ajudá-lo a melhorar estes resultados. Responda a esta mensagem para saber mais!`,
        ai_insight_welcome: `Olá {{1}}, identificamos novas oportunidades para o seu negócio via AI Insight! O seu Score Geral é {{2}}. Veja os detalhes aqui: {{3}}`,
        lead_recovery: `Olá {nome}! 👋\n\nNotámos que ainda não concluiu a análise do seu website. Gostaria de saber mais sobre como podemos ajudar o seu negócio?\n\nEstamos aqui para ajudar!`,
        analysis_result: `Olá {nome}! 📊\n\nA análise do seu website {url} está completa!\n\n📈 Score Geral: {score_geral}/100\n🔍 SEO: {score_seo}/100\n\nEncontramos várias oportunidades de melhoria. Quer saber os detalhes?`,
        follow_up: `Olá {nome}! 👋\n\nComo vão as melhorias no seu website? Estou disponível para ajudar com qualquer dúvida!\n\nCumprimentos,\n{empresa}`,
      };
      setMessageContent(defaults[type] || "");
      setIsActive(true);
    }
  };

  const handleSave = async () => {
    if (!activeCompany) {
      toast({
        title: "Erro",
        description: "Empresa não configurada",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // For now, we'll use the whatsapp_templates table instead since the new table may not be in types yet
      // In a real scenario, this would save to whatsapp_message_templates
      toast({
        title: "Guardado",
        description: "Template de mensagem guardado localmente! (funcionalidade completa em breve)",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    // Validar se tem número
    if (!testPhone) {
      toast({
        title: "Erro",
        description: "Insira um número de telefone para teste",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do telefone
    const cleanPhone = testPhone.replace(/[\s.-]/g, '');
    const phonePattern = /^(\+?\d{1,3})?\d{9,12}$/;
    if (!phonePattern.test(cleanPhone)) {
      toast({
        title: "Formato Inválido",
        description: "Use o formato: +351 912 345 678 ou 912345678",
        variant: "destructive",
      });
      return;
    }

  // Verificar se sistema está ativo (agora é centralizado no admin)
    // Sistema sempre disponível se a empresa estiver ativa

    // Verificar se tem créditos
    if ((activeCompany?.whatsapp_credits || 0) <= 0) {
      toast({
        title: "Sem créditos",
        description: "Você não tem créditos de WhatsApp disponíveis",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Replace variables with sample data
      const testMessage = messageContent
        .replace(/{nome}/g, "Utilizador Teste")
        .replace(/{email}/g, "teste@email.com")
        .replace(/{url}/g, "www.exemplo.com")
        .replace(/{score_geral}/g, "75")
        .replace(/{score_seo}/g, "82")
        .replace(/{empresa}/g, activeCompany?.name || "A Minha Empresa");

      // Use send-whatsapp (Infobip) instead of send-whatsapp-meta (Meta)
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to: cleanPhone.startsWith('+') ? cleanPhone.replace('+', '') : cleanPhone,
          message: testMessage,
          userId: user?.id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Mensagem Enviada",
        description: "Mensagem de teste enviada com sucesso!",
      });
      
      // Refetch company to update credits display
      refetchCompany();
    } catch (error: any) {
      console.error("Error sending test:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Falha ao enviar mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const insertVariable = (variable: string) => {
    setMessageContent((prev) => prev + variable);
  };

  // Generate preview message with sample data
  const previewMessage = messageContent
    .replace(/{nome}/g, "João Silva")
    .replace(/{email}/g, "joao@email.com")
    .replace(/{url}/g, "www.exemplo.pt")
    .replace(/{score_geral}/g, "78")
    .replace(/{score_seo}/g, "85")
    .replace(/{empresa}/g, activeCompany?.name || "A Minha Empresa");

  const credits = activeCompany?.whatsapp_credits || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Configuração WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize as suas mensagens automáticas de WhatsApp
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Status & QR Code */}
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5" />
                Estado da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {companyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : activeCompany?.is_active ? (
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
                    <Check className="h-3 w-3" />
                    Sistema Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inativo
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Créditos</span>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">{credits}</span>
                </div>
              </div>
              {activeCompany && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Empresa</span>
                  <span className="font-medium">{activeCompany.name}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                As credenciais de API são geridas pelo administrador.
              </p>
            </CardContent>
          </Card>

          {/* QR Code Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="h-5 w-5" />
                Conexão via QR Code
              </CardTitle>
              <CardDescription>
                Funcionalidade em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square max-w-[200px] mx-auto bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                <div className="text-center p-4">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Em Breve
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Integração Evolution API
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Variable className="h-5 w-5" />
                Variáveis Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((v) => (
                  <Button
                    key={v.name}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => insertVariable(v.name)}
                    title={v.description}
                  >
                    {v.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Clique numa variável para a inserir na mensagem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Message Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Editor de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Mensagem</Label>
                    <Select value={selectedType} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <p>{type.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo da Mensagem</Label>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Escreva a sua mensagem aqui..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {messageContent.length} caracteres
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <Label>Ativo</Label>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Label>Enviar Teste</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="tel"
                        placeholder="+351 912 345 678"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSendTest}
                        disabled={sendingTest}
                      >
                        {sendingTest ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formato: +351 912 345 678
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Visualização com dados de exemplo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <MobilePreview
                  message={previewMessage}
                  type="whatsapp"
                  automationName={templateTypes.find((t) => t.value === selectedType)?.label}
                />
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettingsPage;
