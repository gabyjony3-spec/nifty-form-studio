import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MobilePreview } from "./MobilePreview";
import { AISuggestionBadge } from "@/components/ai/AISuggestionBadge";
import { MessageCircle, Instagram, Mail, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const automationSchema = z.object({
  type: z.enum(["instagram_dm", "whatsapp", "email"]),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  trigger_type: z.string().min(1, "Selecione um gatilho"),
  trigger_value: z.string().optional(),
  action_type: z.string().min(1, "Selecione uma ação"),
  action_value: z.string().min(1, "Mensagem é obrigatória"),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation?: {
    id: string;
    type: string;
    name: string;
    trigger_type: string;
    trigger_value: string | null;
    action_type: string;
    action_value: string | null;
  } | null;
}

const automationTypes = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    gradient: "from-green-500 to-green-600",
    border: "border-green-500",
    bg: "bg-green-500/10",
    hoverBg: "hover:bg-green-500/20",
    iconColor: "text-green-500",
  },
  {
    value: "instagram_dm",
    label: "Instagram",
    icon: Instagram,
    gradient: "from-purple-500 via-pink-500 to-orange-400",
    border: "border-purple-500",
    bg: "bg-purple-500/10",
    hoverBg: "hover:bg-purple-500/20",
    iconColor: "text-purple-500",
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
    gradient: "from-blue-500 to-blue-600",
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    hoverBg: "hover:bg-blue-500/20",
    iconColor: "text-blue-500",
  },
];

export function AutomationDialog({ open, onOpenChange, automation }: AutomationDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      type: (automation?.type as any) || "whatsapp",
      name: automation?.name || "",
      trigger_type: automation?.trigger_type || "",
      trigger_value: automation?.trigger_value || "",
      action_type: automation?.action_type || "send_message",
      action_value: automation?.action_value || "",
    },
  });

  // Reset form when automation prop changes
  useEffect(() => {
    if (open) {
      form.reset({
        type: (automation?.type as any) || "whatsapp",
        name: automation?.name || "",
        trigger_type: automation?.trigger_type || "",
        trigger_value: automation?.trigger_value || "",
        action_type: automation?.action_type || "send_message",
        action_value: automation?.action_value || "",
      });
    }
  }, [automation, open, form]);

  const onSubmit = async (data: AutomationFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        });
        return;
      }

      if (automation) {
        // Update
        const { error } = await supabase
          .from("automations")
          .update({
            type: data.type,
            name: data.name,
            trigger_type: data.trigger_type,
            trigger_value: data.trigger_value || null,
            action_type: data.action_type,
            action_value: data.action_value,
          })
          .eq("id", automation.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Automação atualizada com sucesso",
        });
      } else {
        // Create
        const { error } = await supabase
          .from("automations")
          .insert({
            user_id: user.id,
            type: data.type,
            name: data.name,
            trigger_type: data.trigger_type,
            trigger_value: data.trigger_value || null,
            action_type: data.action_type,
            action_value: data.action_value,
            is_active: false,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Automação criada com sucesso",
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const automationType = form.watch("type");
  const actionValue = form.watch("action_value");
  const automationName = form.watch("name");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            {automation ? "Editar Automação" : "Nova Automação"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure os gatilhos e ações da sua automação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Automação - Cards */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Tipo de Automação</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {automationTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = field.value === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => field.onChange(type.value)}
                          className={cn(
                            "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                            type.bg,
                            type.hoverBg,
                            isSelected ? type.border : "border-border",
                            isSelected && "ring-2 ring-offset-2 ring-offset-card",
                            isSelected && type.value === "whatsapp" && "ring-green-500/50",
                            isSelected && type.value === "instagram_dm" && "ring-purple-500/50",
                            isSelected && type.value === "email" && "ring-blue-500/50"
                          )}
                        >
                          {isSelected && (
                            <div className={cn(
                              "absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center",
                              `bg-gradient-to-r ${type.gradient}`
                            )}>
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center mb-2",
                            `bg-gradient-to-br ${type.gradient}`
                          )}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <span className={cn(
                            "font-medium text-sm",
                            isSelected ? type.iconColor : "text-muted-foreground"
                          )}>
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Layout com Form e Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna do Formulário */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Automação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Campanha de Natal"
                          className="bg-input border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trigger_type"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Gatilho</FormLabel>
                        <AISuggestionBadge 
                          type="trigger"
                          automationType={automationType}
                          onSuggestion={(suggestion) => {
                            form.setValue("trigger_value", suggestion);
                          }}
                        />
                      </div>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Quando ativar?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {automationType === "instagram_dm" && (
                            <>
                              <SelectItem value="new_follower">Novo Seguidor</SelectItem>
                              <SelectItem value="dm_received">DM Recebida</SelectItem>
                              <SelectItem value="keyword">Palavra-chave</SelectItem>
                            </>
                          )}
                          {automationType === "whatsapp" && (
                            <>
                              <SelectItem value="new_contact">Novo Contato</SelectItem>
                              <SelectItem value="message_received">Mensagem Recebida</SelectItem>
                              <SelectItem value="keyword">Palavra-chave</SelectItem>
                            </>
                          )}
                          {automationType === "email" && (
                            <>
                              <SelectItem value="new_subscriber">Novo Inscrito</SelectItem>
                              <SelectItem value="schedule">Agendamento</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trigger_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Gatilho (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: palavra-chave para detectar"
                          className="bg-input border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="action_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="O que fazer?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                          <SelectItem value="send_email">Enviar Email</SelectItem>
                          <SelectItem value="tag_contact">Adicionar Tag</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="action_value"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Mensagem/Conteúdo</FormLabel>
                        <AISuggestionBadge 
                          type="message"
                          automationType={automationType}
                          onSuggestion={(suggestion) => {
                            form.setValue("action_value", suggestion);
                          }}
                        />
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Digite a mensagem que será enviada..."
                          className="bg-input border-border min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Coluna do Mobile Preview */}
              <div className="flex items-center justify-center lg:border-l lg:border-border lg:pl-6">
                <MobilePreview 
                  message={actionValue || ""} 
                  type={automationType}
                  automationName={automationName || undefined}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="glow-neon">
                {loading ? "Salvando..." : automation ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}