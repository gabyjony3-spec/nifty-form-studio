import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, Send, Clock, XCircle } from 'lucide-react';

interface LogStatusBadgeProps {
  status: string;
  size?: 'sm' | 'default';
}

export function LogStatusBadge({ status, size = 'default' }: LogStatusBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  
  switch (status) {
    case 'read':
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
          <Eye className={iconSize} />
          {size !== 'sm' && <span className="ml-1">Lido</span>}
        </Badge>
      );
    case 'delivered':
      return (
        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <CheckCircle2 className={iconSize} />
          {size !== 'sm' && <span className="ml-1">Entregue</span>}
        </Badge>
      );
    case 'sent':
      return (
        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          <Send className={iconSize} />
          {size !== 'sm' && <span className="ml-1">Enviado</span>}
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className={iconSize} />
          {size !== 'sm' && <span className="ml-1">Pendente</span>}
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className={iconSize} />
          {size !== 'sm' && <span className="ml-1">Falhou</span>}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <Clock className={iconSize} />
          {size !== 'sm' && <span className="ml-1">{status}</span>}
        </Badge>
      );
  }
}
