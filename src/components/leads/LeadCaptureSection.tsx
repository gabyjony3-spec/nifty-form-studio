import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Send,
  Clock,
  Calendar as CalendarIcon,
  Loader2,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
  ListPlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { formatPhoneNumber, validatePhoneNumber } from "@/hooks/useWhatsAppSend";

const defaultTemplates = {
  auditoria: `Olá {nome}! 👋

Analisei o seu website e encontrei várias oportunidades de melhoria.

O seu score geral é de {score_geral}/100.

Posso ajudá-lo a melhorar estes resultados. Responda a esta mensagem para saber mais!`,
  boas_vindas: `Olá {nome}! 👋

Bem-vindo! Obrigado por entrar em contacto connosco.

Como posso ajudá-lo hoje?`,
  follow_up: `Olá {nome}! 👋

Gostava de saber se teve oportunidade de ver a nossa proposta.

Estou disponível para esclarecer qualquer dúvida!`
};

interface LeadCaptureSectionProps {
  userId: string;
  companyName?: string;
}

const LeadCaptureSection = ({ userId, companyName = "A Minha Empresa" }: LeadCaptureSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [leadPhone, setLeadPhone] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("auditoria");
  const [customMessage, setCustomMessage] = useState(defaultTemplates.auditoria);
  const [actionType, setActionType] = useState<"send" | "schedule" | "queue">("send");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const handleTemplateChange = (template: string) => {
    setMessageTemplate(template);
    setCustomMessage(defaultTemplates[template as keyof typeof defaultTemplates] || "");
  };

  const getPreviewMessage = () => {
    return customMessage
      .replace(/{nome}/g, leadName || "Cliente")
      .replace(/{empresa}/g, companyName)
      .replace(/{score_geral}/g, "75")
      .replace(/{url}/g, "www.exemplo.com")
      .replace(/{data}/g, format(new Date(), "dd/MM/yyyy", { locale: pt }));
  };

  const validateForm = () => {
    if (!leadPhone) {
      toast({
        title: "Número obrigatório",
        description: "Insira o número de WhatsApp do cliente",
        variant: "destructive"
      });
      return false;
    }

    const validation = validatePhoneNumber(leadPhone);
    if (!validation.valid) {
      toast({
        title: "Número inválido",
        description: validation.error,
        variant: "destructive"
      });
      return false;
    }

    if (!customMessage.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Escreva uma mensagem para enviar",
        variant: "destructive"
      });
      return false;
    }

    if (actionType === "schedule" && !scheduledDate) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para agendar o envio",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(leadPhone);
      const previewMessage = getPreviewMessage();

      if (actionType === "send") {
        // Send immediately
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            to: formattedPhone,
            message: previewMessage,
            userId
          }
        });

        if (error) throw error;

        if (data?.success) {
          toast({
            title: "Mensagem Enviada! ✅",
            description: `Mensagem enviada para ${leadName || formattedPhone}`
          });
          resetForm();
        } else {
          throw new Error(data?.error || "Erro ao enviar mensagem");
        }
      } else {
        // Schedule or queue
        let scheduledAt = null;
        if (actionType === "schedule" && scheduledDate) {
          const [hours, minutes] = scheduledTime.split(":").map(Number);
          const scheduled = new Date(scheduledDate);
          scheduled.setHours(hours, minutes, 0, 0);
          scheduledAt = scheduled.toISOString();
        }

        const { error } = await supabase
          .from("scheduled_whatsapp_messages")
          .insert({
            user_id: userId,
            lead_phone: formattedPhone,
            lead_name: leadName || null,
            lead_email: leadEmail || null,
            message_template: customMessage,
            message_preview: previewMessage,
            scheduled_at: scheduledAt,
            status: actionType === "schedule" ? "scheduled" : "queued"
          });

        if (error) throw error;

        toast({
          title: actionType === "schedule" ? "Mensagem Agendada! 📅" : "Adicionada à Fila! 📋",
          description: actionType === "schedule"
            ? `Será enviada em ${format(scheduledDate!, "dd/MM/yyyy", { locale: pt })} às ${scheduledTime}`
            : "Mensagem guardada para revisão e envio posterior"
        });
        resetForm();
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar o pedido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLeadPhone("");
    setLeadName("");
    setLeadEmail("");
    setMessageTemplate("auditoria");
    setCustomMessage(defaultTemplates.auditoria);
    setScheduledDate(undefined);
    setScheduledTime("09:00");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Captura de Leads
        </CardTitle>
        <CardDescription>
          Adicione um contacto e envie uma mensagem WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lead-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp *
            </Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+351 912 345 678"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome
            </Label>
            <Input
              id="lead-name"
              placeholder="Nome do cliente"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="email@exemplo.com"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Message Template */}
        <div className="space-y-2">
          <Label>Template de Mensagem</Label>
          <Select value={messageTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auditoria">📊 Resultado de Auditoria</SelectItem>
              <SelectItem value="boas_vindas">👋 Boas-Vindas</SelectItem>
              <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message Editor */}
        <div className="space-y-2">
          <Label htmlFor="message" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagem
          </Label>
          <Textarea
            id="message"
            rows={5}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {["{nome}", "{empresa}", "{score_geral}", "{url}", "{data}"].map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setCustomMessage((prev) => prev + " " + variable)}
              >
                {variable}
              </Badge>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
          <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
        </div>

        {/* Action Type */}
        <div className="space-y-2">
          <Label>Ação</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={actionType === "send" ? "default" : "outline"}
              size="sm"
              onClick={() => setActionType("send")}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Agora
            </Button>
            <Button
              variant={actionType === "schedule" ? "default" : "outline"}
              size="sm"
              onClick={() => setActionType("schedule")}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Agendar
            </Button>
            <Button
              variant={actionType === "queue" ? "default" : "outline"}
              size="sm"
              onClick={() => setActionType("queue")}
            >
              <ListPlus className="h-4 w-4 mr-2" />
              Adicionar à Fila
            </Button>
          </div>
        </div>

        {/* Schedule Options */}
        {actionType === "schedule" && (
          <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/30 border">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {scheduledDate
                      ? format(scheduledDate, "dd/MM/yyyy", { locale: pt })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    locale={pt}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora</Label>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, h) => 
                    ["00", "30"].map((m) => {
                      const time = `${h.toString().padStart(2, "0")}:${m}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })
                  ).flat()}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : actionType === "send" ? (
            <Send className="h-4 w-4 mr-2" />
          ) : actionType === "schedule" ? (
            <Clock className="h-4 w-4 mr-2" />
          ) : (
            <ListPlus className="h-4 w-4 mr-2" />
          )}
          {actionType === "send"
            ? "Enviar Mensagem"
            : actionType === "schedule"
            ? "Agendar Envio"
            : "Guardar na Fila"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LeadCaptureSection;