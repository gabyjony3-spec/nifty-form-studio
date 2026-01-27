import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  Send, 
  Settings, 
  History, 
  Loader2, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface TwilioConfig {
  id?: string;
  account_sid: string;
  auth_token: string;
  phone_number: string;
  is_active: boolean;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
}

interface CommunicationLog {
  id: string;
  user_id: string | null;
  recipient_phone: string;
  recipient_name: string | null;
  message_content: string;
  status: string;
  provider: string;
  created_at: string;
  error_message: string | null;
}

// Validation helpers
const isValidAccountSid = (sid: string): boolean => {
  return sid.startsWith("AC") && sid.length === 34;
};

const isValidAuthToken = (token: string): boolean => {
  return token.length === 32;
};

const isValidPhoneNumber = (phone: string): boolean => {
  return phone.startsWith("+") && phone.length >= 10;
};

export default function TwilioDispatchPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Config state
  const [config, setConfig] = useState<TwilioConfig>({
    account_sid: "",
    auth_token: "",
    phone_number: "",
    is_active: true
  });
  const [showToken, setShowToken] = useState(false);
  const [showSid, setShowSid] = useState(false);
  
  // Dispatch state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  
  // Logs state
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    account_sid?: string;
    auth_token?: string;
    phone_number?: string;
  }>({});
  
  // Connection status
  const [connectionVerified, setConnectionVerified] = useState<boolean | null>(null);

  useEffect(() => {
    loadConfig();
    loadUsers();
    loadLogs();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_twilio_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setConfig({
          id: data.id,
          account_sid: data.account_sid || "",
          auth_token: data.auth_token || "",
          phone_number: data.phone_number || "",
          is_active: data.is_active ?? true
        });
      }
    } catch (error) {
      console.error("Error loading Twilio config:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, whatsapp")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("communication_logs")
        .select("*")
        .eq("provider", "twilio")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const validateConfig = (): boolean => {
    const errors: typeof validationErrors = {};
    
    if (!config.account_sid) {
      errors.account_sid = "Account SID é obrigatório";
    } else if (!isValidAccountSid(config.account_sid)) {
      errors.account_sid = "Account SID deve começar com 'AC' e ter 34 caracteres. Encontre-o em console.twilio.com na página inicial.";
    }
    
    if (!config.auth_token) {
      errors.auth_token = "Auth Token é obrigatório";
    } else if (!isValidAuthToken(config.auth_token)) {
      errors.auth_token = "Auth Token deve ter 32 caracteres. Encontre-o em console.twilio.com junto ao Account SID.";
    }
    
    if (!config.phone_number) {
      errors.phone_number = "Número de telefone é obrigatório";
    } else if (!isValidPhoneNumber(config.phone_number)) {
      errors.phone_number = "Número deve começar com + e código do país (ex: +1 para EUA)";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveConfig = async () => {
    if (!validateConfig()) {
      toast({
        title: "Validação falhou",
        description: "Corrija os erros nos campos antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setConnectionVerified(null);
    try {
      if (config.id) {
        const { error } = await supabase
          .from("admin_twilio_config")
          .update({
            account_sid: config.account_sid,
            auth_token: config.auth_token,
            phone_number: config.phone_number,
            is_active: config.is_active,
            updated_at: new Date().toISOString()
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("admin_twilio_config")
          .insert({
            account_sid: config.account_sid,
            auth_token: config.auth_token,
            phone_number: config.phone_number,
            is_active: config.is_active
          })
          .select()
          .single();

        if (error) throw error;
        setConfig(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Configuração salva",
        description: "As credenciais do Twilio foram atualizadas. Teste a conexão para verificar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!validateConfig()) {
      toast({
        title: "Credenciais inválidas",
        description: "Corrija os erros de formato antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setConnectionVerified(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-twilio", {
        body: { 
          test: true,
          accountSid: config.account_sid,
          authToken: config.auth_token
        }
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionVerified(true);
        toast({
          title: "Conexão bem-sucedida",
          description: "As credenciais do Twilio estão válidas e funcionando!",
        });
      } else {
        setConnectionVerified(false);
        throw new Error(data?.error || "Falha ao conectar");
      }
    } catch (error: any) {
      setConnectionVerified(false);
      const errorMsg = error.message || "";
      const isInvalidUsername = errorMsg.includes("invalid username") || errorMsg.includes("Authentication Error");
      
      toast({
        title: isInvalidUsername ? "Account SID Inválido" : "Erro de conexão",
        description: isInvalidUsername 
          ? "O Account SID está incorreto. Deve começar com 'AC' (não 'SK'). Vá a console.twilio.com para copiar o correto."
          : (errorMsg || "Não foi possível validar as credenciais."),
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user?.whatsapp) {
      setSelectedPhone(user.whatsapp);
    }
  };

  const sendMessage = async () => {
    if (!selectedPhone || !message) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um destinatário e digite uma mensagem.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSendStatus("sending");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData?.user?.id;

      const selectedUser = users.find(u => u.id === selectedUserId);

      const { data, error } = await supabase.functions.invoke("send-twilio", {
        body: {
          to: selectedPhone,
          message: message,
          userId: selectedUserId || null,
          adminId: adminId,
          recipientName: selectedUser?.full_name || null
        }
      });

      if (error) throw error;

      if (data?.success) {
        setSendStatus("success");
        toast({
          title: "Mensagem enviada",
          description: `Mensagem enviada com sucesso para ${selectedPhone}`,
        });
        setMessage("");
        loadLogs();
        
        setTimeout(() => setSendStatus("idle"), 3000);
      } else {
        throw new Error(data?.error || "Falha ao enviar");
      }
    } catch (error: any) {
      setSendStatus("error");
      const errorMsg = error.message || "";
      const isTrialError = errorMsg.includes("unverified") || errorMsg.includes("Trial accounts");
      toast({
        title: isTrialError ? "Conta Twilio Trial" : "Erro ao enviar",
        description: isTrialError 
          ? "Conta trial só envia para números verificados. Verifique o número em twilio.com/user/account/phone-numbers/verified ou faça upgrade."
          : (errorMsg || "Não foi possível enviar a mensagem."),
        variant: "destructive",
      });
      
      setTimeout(() => setSendStatus("idle"), 3000);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <Badge className="bg-green-500/20 text-green-400">Enviado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Determine real system status
  const isSystemReady = config.is_active && 
    isValidAccountSid(config.account_sid) && 
    isValidAuthToken(config.auth_token) && 
    isValidPhoneNumber(config.phone_number);
  
  const getSystemStatusBadge = () => {
    if (!config.is_active) {
      return <Badge className="bg-red-500/20 text-red-400">Sistema Desativado</Badge>;
    }
    if (!isValidAccountSid(config.account_sid)) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Account SID Inválido</Badge>;
    }
    if (!isValidAuthToken(config.auth_token)) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Auth Token Inválido</Badge>;
    }
    if (!isValidPhoneNumber(config.phone_number)) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Telefone Inválido</Badge>;
    }
    if (connectionVerified === true) {
      return <Badge className="bg-green-500/20 text-green-400">Verificado e Ativo</Badge>;
    }
    if (connectionVerified === false) {
      return <Badge className="bg-red-500/20 text-red-400">Credenciais Rejeitadas</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400">Configurado - Teste Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Phone className="h-8 w-8 text-green-500" />
            Central de Disparo Twilio
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie mensagens SMS/WhatsApp para utilizadores via Twilio
          </p>
        </div>
        {getSystemStatusBadge()}
      </div>

      <Tabs defaultValue="dispatch" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dispatch" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Disparo
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Dispatch Tab */}
        <TabsContent value="dispatch" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Enviar Mensagem
                </CardTitle>
                <CardDescription>
                  Selecione um utilizador e envie uma mensagem direta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecionar Utilizador</Label>
                  <Select value={selectedUserId} onValueChange={handleUserChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um utilizador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email} {user.whatsapp && `(${user.whatsapp})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Número de Telefone</Label>
                  <Input
                    placeholder="+351912345678"
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato internacional com código do país
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length} caracteres
                  </p>
                </div>

                <Button 
                  onClick={sendMessage} 
                  disabled={sending || !config.is_active}
                  className="w-full"
                >
                  {sendStatus === "sending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : sendStatus === "success" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Enviado com Sucesso!
                    </>
                  ) : sendStatus === "error" ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Erro ao Enviar
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>

                {!config.is_active && (
                  <p className="text-sm text-red-400 text-center">
                    Sistema desativado. Ative nas configurações.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Mensagens</CardTitle>
                <CardDescription>
                  Histórico recente de mensagens enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{log.recipient_name || log.recipient_phone}</span>
                        {getStatusBadge(log.status || "pending")}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{log.message_content}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </p>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhuma mensagem enviada ainda.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Comunicações</CardTitle>
                <CardDescription>
                  Todas as mensagens enviadas via Twilio
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={loadingLogs}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingLogs ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.recipient_name || "-"}</TableCell>
                      <TableCell>{log.recipient_phone}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{log.message_content}</TableCell>
                      <TableCell>{getStatusBadge(log.status || "pending")}</TableCell>
                      <TableCell>
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Twilio
              </CardTitle>
              <CardDescription>
                Configure as credenciais da sua conta Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label className="text-base">Sistema Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative ou desative o envio de mensagens via Twilio
                  </p>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Account SID</Label>
                <div className="relative">
                  <Input
                    type={showSid ? "text" : "password"}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={config.account_sid}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, account_sid: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, account_sid: undefined }));
                      setConnectionVerified(null);
                    }}
                    className={validationErrors.account_sid ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowSid(!showSid)}
                  >
                    {showSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.account_sid && (
                  <p className="text-xs text-red-400">{validationErrors.account_sid}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Deve começar com "AC" e ter 34 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label>Auth Token</Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={config.auth_token}
                    onChange={(e) => {
                      setConfig(prev => ({ ...prev, auth_token: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, auth_token: undefined }));
                      setConnectionVerified(null);
                    }}
                    className={validationErrors.auth_token ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {validationErrors.auth_token && (
                  <p className="text-xs text-red-400">{validationErrors.auth_token}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Token de 32 caracteres encontrado junto ao Account SID
                </p>
              </div>

              <div className="space-y-2">
                <Label>Número de Telefone Twilio</Label>
                <Input
                  placeholder="+1xxxxxxxxxx"
                  value={config.phone_number}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, phone_number: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, phone_number: undefined }));
                  }}
                  className={validationErrors.phone_number ? "border-red-500" : ""}
                />
                {validationErrors.phone_number && (
                  <p className="text-xs text-red-400">{validationErrors.phone_number}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  O número de telefone configurado na sua conta Twilio (formato: +1...)
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={testConnection} variant="outline" disabled={testing}>
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    "Testar Conexão"
                  )}
                </Button>
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configuração"
                  )}
                </Button>
              </div>

              {connectionVerified === true && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-medium text-green-400 mb-1">✓ Conexão Verificada</h4>
                  <p className="text-sm text-muted-foreground">
                    As credenciais estão corretas e o sistema está pronto para enviar mensagens.
                  </p>
                </div>
              )}

              {connectionVerified === false && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-1">✗ Conexão Falhou</h4>
                  <p className="text-sm text-muted-foreground">
                    Verifique se o Account SID começa com "AC" (não "SK") e se o Auth Token está correto.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-medium text-blue-400 mb-2">📋 Como obter credenciais Twilio</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li><strong>Acesse</strong> console.twilio.com e faça login</li>
                  <li><strong>Na página inicial</strong>, copie o <span className="text-blue-400 font-mono">Account SID</span> (começa com AC) e <span className="text-blue-400 font-mono">Auth Token</span></li>
                  <li><strong>IMPORTANTE:</strong> NÃO use API Keys (SK...) - use apenas o Account SID (AC...)</li>
                  <li>Em <strong>Phone Numbers → Manage</strong>, obtenha ou compre um número</li>
                  <li>Configure as credenciais aqui e teste a conexão</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <h4 className="font-medium text-yellow-400 mb-2">⚠️ Conta Trial do Twilio</h4>
                <p className="text-sm text-muted-foreground">
                  Se estiver usando uma conta trial, só poderá enviar mensagens para números verificados. 
                  Verifique números em: <span className="text-yellow-400">twilio.com/user/account/phone-numbers/verified</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
