import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  CheckCircle,
  Save,
  Loader2,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatPhoneNumber, validatePhoneNumber } from "@/hooks/useWhatsAppSend";

interface WhatsAppReceiveLeadsFieldProps {
  userId: string;
  initialValue?: string;
}

const WhatsAppReceiveLeadsField = ({ userId, initialValue = "" }: WhatsAppReceiveLeadsFieldProps) => {
  const [phone, setPhone] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setPhone(initialValue);
    }
  }, [initialValue]);

  const handleSave = async () => {
    if (phone) {
      const validation = validatePhoneNumber(phone);
      if (!validation.valid) {
        toast({
          title: "Número Inválido",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
    }

    setSaving(true);
    try {
      const formattedPhone = phone ? formatPhoneNumber(phone) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          whatsapp_receive_leads: formattedPhone,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      toast({
        title: "Guardado! ✅",
        description: formattedPhone
          ? "Receberá notificações de novos leads neste número"
          : "Notificações de leads desativadas"
      });
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        title: "Erro ao guardar",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getFormattedPreview = () => {
    if (!phone) return null;
    const formatted = formatPhoneNumber(phone);
    if (formatted.length >= 10) {
      // Format as +XXX XXX XXX XXX
      return `+${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 9)} ${formatted.slice(9)}`.trim();
    }
    return formatted;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          WhatsApp para Receber Leads
        </CardTitle>
        <CardDescription>
          Número onde receberá notificações quando novos leads forem capturados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="whatsapp-receive">Número de WhatsApp</Label>
          <div className="flex gap-2">
            <Input
              id="whatsapp-receive"
              type="tel"
              placeholder="+351 912 345 678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {phone && getFormattedPreview() && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Formato:</span>
            <Badge variant="secondary" className="font-mono">
              {getFormattedPreview()}
            </Badge>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Este número será usado para lhe enviar notificações quando um novo lead for capturado 
            através do sistema de análise de websites ou outras automações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppReceiveLeadsField;