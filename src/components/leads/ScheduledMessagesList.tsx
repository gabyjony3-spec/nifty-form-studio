import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Send,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  ListChecks
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ScheduledMessage {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_email: string | null;
  message_preview: string | null;
  scheduled_at: string | null;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface ScheduledMessagesListProps {
  userId: string;
}

const ScheduledMessagesList = ({ userId }: ScheduledMessagesListProps) => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_whatsapp_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async (message: ScheduledMessage) => {
    setSendingId(message.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: message.lead_phone,
          message: message.message_preview || "",
          userId
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Update status to sent
        await supabase
          .from("scheduled_whatsapp_messages")
          .update({
            status: "sent",
            sent_at: new Date().toISOString()
          })
          .eq("id", message.id);

        toast({
          title: "Mensagem Enviada! ✅",
          description: `Enviada para ${message.lead_name || message.lead_phone}`
        });

        loadMessages();
      } else {
        throw new Error(data?.error || "Erro ao enviar");
      }
    } catch (error: any) {
      console.error("Error sending:", error);
      
      // Update status to failed
      await supabase
        .from("scheduled_whatsapp_messages")
        .update({
          status: "failed",
          error_message: error.message
        })
        .eq("id", message.id);

      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive"
      });
      
      loadMessages();
    } finally {
      setSendingId(null);
    }
  };

  const handleCancel = async (messageId: string) => {
    try {
      await supabase
        .from("scheduled_whatsapp_messages")
        .update({ status: "cancelled" })
        .eq("id", messageId);

      toast({
        title: "Mensagem Cancelada",
        description: "A mensagem foi removida da fila"
      });

      loadMessages();
    } catch (error) {
      console.error("Error cancelling:", error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await supabase
        .from("scheduled_whatsapp_messages")
        .delete()
        .eq("id", messageId);

      toast({
        title: "Mensagem Eliminada"
      });

      loadMessages();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Na Fila</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="text-blue-500 border-blue-500">Agendada</Badge>;
      case "sent":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Enviada</Badge>;
      case "delivered":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Entregue</Badge>;
      case "read":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Lida</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = messages.filter(m => m.status === "queued" || m.status === "scheduled").length;
  const sentCount = messages.filter(m => ["sent", "delivered", "read"].includes(m.status)).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Mensagens Agendadas
            </CardTitle>
            <CardDescription>
              {pendingCount} pendente{pendingCount !== 1 ? "s" : ""} · {sentCount} enviada{sentCount !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma mensagem agendada</p>
            <p className="text-sm">Use a captura de leads acima para adicionar mensagens</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatário</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{message.lead_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{message.lead_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {message.message_preview?.substring(0, 50)}...
                    </p>
                  </TableCell>
                  <TableCell>
                    {message.scheduled_at ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(message.scheduled_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Na fila</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(message.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(message.status === "queued" || message.status === "scheduled") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleSendNow(message)}
                              disabled={sendingId === message.id}
                            >
                              {sendingId === message.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Enviar Agora
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancel(message.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(message.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledMessagesList;