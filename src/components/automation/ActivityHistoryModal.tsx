import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Instagram, 
  Mail, 
  Megaphone, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye,
  Send
} from 'lucide-react';
import { useAutomationLogs, AutomationLog } from '@/hooks/useAutomationLogs';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automationId?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4" />;
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'meta_ads':
      return <Megaphone className="h-4 w-4" />;
    default:
      return <Send className="h-4 w-4" />;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'read':
      return {
        icon: <Eye className="h-3.5 w-3.5" />,
        label: 'Lido',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
      };
    case 'delivered':
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        label: 'Entregue',
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    case 'sent':
      return {
        icon: <Send className="h-3.5 w-3.5" />,
        label: 'Enviado',
        className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      };
    case 'pending':
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        label: 'Pendente',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      };
    case 'failed':
      return {
        icon: <XCircle className="h-3.5 w-3.5" />,
        label: 'Falhou',
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
    default:
      return {
        icon: <Clock className="h-3.5 w-3.5" />,
        label: status,
        className: 'bg-muted text-muted-foreground',
      };
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'instagram':
      return 'Instagram';
    case 'email':
      return 'Email';
    case 'meta_ads':
      return 'Meta Ads';
    case 'sms':
      return 'SMS';
    default:
      return type;
  }
};

const ActivityItem = ({ log }: { log: AutomationLog }) => {
  const statusConfig = getStatusConfig(log.status);
  const timeAgo = formatDistanceToNow(new Date(log.created_at), {
    addSuffix: true,
    locale: pt,
  });

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        {getTypeIcon(log.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">
            {getTypeName(log.type)}
          </span>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {log.lead?.full_name ? (
            <>Mensagem para <span className="text-foreground font-medium">{log.lead.full_name}</span></>
          ) : log.recipient_phone ? (
            <>Enviado para {log.recipient_phone}</>
          ) : (
            <>Mensagem enviada</>
          )}
        </p>
        {log.content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            "{log.content.substring(0, 100)}{log.content.length > 100 ? '...' : ''}"
          </p>
        )}
        {log.error_message && (
          <p className="text-xs text-red-400 mt-1">
            Erro: {log.error_message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );
};

export function ActivityHistoryModal({ 
  open, 
  onOpenChange, 
  automationId 
}: ActivityHistoryModalProps) {
  const { logs, stats, loading } = useAutomationLogs(automationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">Histórico de Atividade</SheetTitle>
          <SheetDescription>
            Acompanhe todas as ações e mensagens enviadas em tempo real
          </SheetDescription>
        </SheetHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-2 mt-4 mb-4">
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-lg font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pendente</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-cyan-500/10">
            <div className="text-lg font-bold text-cyan-400">{stats.sent}</div>
            <div className="text-xs text-muted-foreground">Enviado</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-lg font-bold text-blue-400">{stats.delivered}</div>
            <div className="text-xs text-muted-foreground">Entregue</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <div className="text-lg font-bold text-green-400">{stats.read}</div>
            <div className="text-xs text-muted-foreground">Lido</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="text-lg font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Falhou</div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)] pr-4">
          <div className="space-y-2">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma atividade registada</p>
                <p className="text-sm mt-1">As mensagens enviadas aparecerão aqui</p>
              </div>
            ) : (
              logs.map((log) => (
                <ActivityItem key={log.id} log={log} />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
