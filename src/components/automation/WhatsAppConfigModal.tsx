import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, MessageSquare, Save, Smartphone, Zap, XCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserCompany } from "@/hooks/useUserCompany";
import { formatPhoneNumber, validatePhoneNumber } from "@/hooks/useWhatsAppSend";

interface WhatsAppConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured?: (configured: boolean) => void;
}

interface AdminConfig {
  is_active: boolean;
  default_provider: string;
}

export function WhatsAppConfigModal({ open, onOpenChange, onConfigured }: WhatsAppConfigModalProps) {
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<AdminConfig | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const { activeCompany, loading: companyLoading, refetch } = useUserCompany();

  useEffect(() => {
    if (open) {
      loadSettings();
      refetch();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load user profile for whatsapp_receive_leads
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp_receive_leads")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.whatsapp_receive_leads) {
        setPhoneNumber(profile.whatsapp_receive_leads);
      }

      // Load admin WhatsApp config to check system status
      const { data: adminConfig } = await supabase
        .from('admin_whatsapp_config')
        .select('is_active, default_provider')
        .eq('is_active', true)
        .maybeSingle();

      setSystemStatus(adminConfig);
      onConfigured?.(adminConfig?.is_active || false);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Utilizador não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (phoneNumber) {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        toast({
          title: "Número Inválido",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          whatsapp_receive_leads: formattedPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Guardado! ✅",
        description: formattedPhone 
          ? "Receberá notificações de leads neste número"
          : "Notificações de leads desativadas",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao guardar",
        description: error.message || "Erro ao guardar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isSystemActive = systemStatus?.is_active || false;
  const credits = activeCompany?.whatsapp_credits || 0;
  const planName = activeCompany?.plan || "trial";
  const maxCredits = planName === "business" ? 999999 : planName === "pro" ? 100 : 10;
  const creditsPercentage = maxCredits === 999999 ? 100 : Math.min((credits / maxCredits) * 100, 100);
  const isUnlimited = maxCredits === 999999;

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "business": return "Business";
      case "pro": return "Pro";
      case "trial": return "Trial";
      default: return plan;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            WhatsApp - Receber Leads
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure o seu número para receber notificações de novos leads
          </DialogDescription>
        </DialogHeader>

        {loading || companyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* System Status */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              isSystemActive ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50 border border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {isSystemActive ? (
                    <>
                      <Zap className="h-5 w-5 text-green-500" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    </>
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Sistema WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    {isSystemActive 
                      ? "Configurado pelo administrador" 
                      : "Aguardando configuração do admin"}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={
                isSystemActive 
                  ? "border-green-500 text-green-500" 
                  : "border-muted-foreground text-muted-foreground"
              }>
                {isSystemActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            {/* Company Info */}
            {activeCompany && (
              <div className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Empresa</span>
                  <span className="text-sm font-medium text-foreground">{activeCompany.name}</span>
                </div>
              </div>
            )}

            {/* Phone number for receiving leads */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Seu WhatsApp para Receber Leads
              </Label>
              <Input
                id="phoneNumber"
                placeholder="+351 912 345 678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Receberá notificações de novos leads neste número
              </p>
            </div>

            {/* Credits display */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">Mensagens Disponíveis</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {isUnlimited ? "∞" : credits}
                </span>
              </div>
              
              {!isUnlimited && (
                <Progress value={creditsPercentage} className="h-2 mb-2" />
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Plano {getPlanLabel(planName)}</span>
                <span>
                  {isUnlimited 
                    ? "Mensagens ilimitadas" 
                    : `${credits} de ${maxCredits} restantes`}
                </span>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                A configuração das APIs (Meta e Infobip) é gerida centralmente pelo administrador. 
                Não precisa de configurar credenciais - apenas o seu número para receber notificações.
              </p>
            </div>

            {/* Save button */}
            <Button
              className="w-full"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Número
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
