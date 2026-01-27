import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import WhatsAppReceiveLeadsField from "@/components/settings/WhatsAppReceiveLeadsField";

const SettingsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [whatsappReceiveLeads, setWhatsappReceiveLeads] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("whatsapp_receive_leads")
          .eq("id", user.id)
          .single();
          
        if (profile?.whatsapp_receive_leads) {
          setWhatsappReceiveLeads(profile.whatsapp_receive_leads);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configurações</h1>

      {/* WhatsApp Settings - Simplified */}
      {userId && (
        <WhatsAppReceiveLeadsField 
          userId={userId} 
          initialValue={whatsappReceiveLeads}
        />
      )}

      {/* WhatsApp System Status */}
      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            Sistema WhatsApp
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Estado da integração centralizada de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Conexão Centralizada</p>
              <p className="text-sm text-muted-foreground">
                O envio de mensagens é gerido centralmente pelo administrador
              </p>
            </div>
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Não precisa de configurar credenciais de API. Basta indicar o seu número de WhatsApp 
            acima para receber notificações de novos leads.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border panel-shadow">
        <CardHeader>
          <CardTitle className="text-foreground">Notificações</CardTitle>
          <CardDescription className="text-muted-foreground">
            Gerencie suas preferências de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="text-foreground">
              Notificações por Email
            </Label>
            <Switch id="email-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="text-foreground">
              Notificações Push
            </Label>
            <Switch id="push-notifications" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing-emails" className="text-foreground">
              Emails de Marketing
            </Label>
            <Switch id="marketing-emails" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;