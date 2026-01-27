import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Copy, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface UsernameOptimizationProps {
  currentUsername?: string;
  suggestedUsername?: string;
  niche?: string;
  isOptimized?: boolean;
}

export function UsernameOptimization({
  currentUsername,
  suggestedUsername,
  niche,
  isOptimized = false,
}: UsernameOptimizationProps) {
  const displayCurrent = currentUsername || "@meuPerfil";
  const displaySuggested = suggestedUsername || `@${niche?.toLowerCase().replace(/\s+/g, ".")}.expert` || "@nichoExpert";

  const handleCopy = () => {
    navigator.clipboard.writeText(displaySuggested.replace("@", ""));
    toast.success("Nome de usuário copiado!");
  };

  return (
    <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Search className="h-5 w-5" />
            Otimização de Nome de Usuário
          </div>
          <Badge 
            variant="outline" 
            className={isOptimized 
              ? "border-green-500/50 text-green-400" 
              : "border-amber-500/50 text-amber-400"
            }
          >
            {isOptimized ? "Otimizado" : "Requer Melhoria"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparison */}
        <div className="grid grid-cols-3 gap-3 items-center">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground">Atual:</p>
            <div className="p-3 rounded-lg bg-muted/10 border border-muted/20 flex items-center gap-2">
              {isOptimized ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{displayCurrent}</span>
            </div>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground">Sugerido:</p>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-sm font-medium truncate text-green-300">{displaySuggested}</span>
            </div>
          </motion.div>
        </div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
        >
          <p className="text-xs text-muted-foreground">
            <strong className="text-amber-400">Por quê?</strong> Incluir palavras-chave do nicho 
            ({niche || "seu nicho"}) ajuda o Instagram a mostrar o seu perfil nas buscas. 
            Nomes otimizados podem aumentar a descoberta em até 30%.
          </p>
        </motion.div>

        {/* Copy Button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs border-green-500/30 hover:bg-green-500/10 text-green-300"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
          Copiar Sugestão
        </Button>
      </CardContent>
    </Card>
  );
}
