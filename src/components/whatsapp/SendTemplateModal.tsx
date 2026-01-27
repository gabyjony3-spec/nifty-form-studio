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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserCompany } from "@/hooks/useUserCompany";

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  body_text: string | null;
  header_text: string | null;
  footer_text: string | null;
  status: string | null;
  category: string | null;
  language_code: string | null;
}

interface SendTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientPhone: string;
  recipientName: string;
  leadId?: string;
  onSuccess?: () => void;
}

export function SendTemplateModal({
  open,
  onOpenChange,
  recipientPhone,
  recipientName,
  leadId,
  onSuccess
}: SendTemplateModalProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const { activeCompany } = useUserCompany();

  useEffect(() => {
    if (open && activeCompany?.id) {
      loadTemplates();
    }
  }, [open, activeCompany?.id]);

  const loadTemplates = async () => {
    if (!activeCompany?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("company_id", activeCompany.id)
        .eq("status", "APPROVED")
        .order("template_name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate || !activeCompany?.id) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp-meta", {
        body: {
          companyId: activeCompany.id,
          to: recipientPhone,
          templateName: selectedTemplate.template_name,
          languageCode: selectedTemplate.language_code || "pt_PT",
          leadId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mensagem Enviada! ✅",
          description: `Template "${selectedTemplate.template_name}" enviado para ${recipientName}`
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }
    } catch (error: any) {
      console.error("Error sending template:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getPreviewText = (template: WhatsAppTemplate) => {
    let preview = "";
    if (template.header_text) preview += `*${template.header_text}*\n\n`;
    if (template.body_text) preview += template.body_text;
    if (template.footer_text) preview += `\n\n_${template.footer_text}_`;
    return preview || "Sem conteúdo de preview";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Enviar Template WhatsApp
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecione um template aprovado para enviar a <strong>{recipientName}</strong>
          </DialogDescription>
        </DialogHeader>

        {!activeCompany?.meta_configured ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              A sua empresa não tem a Meta Cloud API configurada.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Configure nas definições da empresa para enviar mensagens.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum template aprovado encontrado.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sincronize os templates na página de Templates WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-3 cursor-pointer transition-all border ${
                      selectedTemplate?.id === template.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {template.template_name}
                          </span>
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.body_text || "Sem conteúdo"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {template.category || "MARKETING"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {selectedTemplate && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {getPreviewText(selectedTemplate)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Destinatário: {recipientPhone}
              </p>
              <Button
                onClick={handleSend}
                disabled={!selectedTemplate || sending}
                className="glow-neon"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
