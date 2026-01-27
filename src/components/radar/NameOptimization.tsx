import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Copy, Check, User, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NameOptimizationProps {
  currentName?: string;
  suggestedName?: string;
  niche?: string;
}

export function NameOptimization({ currentName, suggestedName, niche }: NameOptimizationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (suggestedName) {
      navigator.clipboard.writeText(suggestedName);
      setCopied(true);
      toast.success("Nome otimizado copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate a default suggested name if not provided
  const displaySuggestedName = suggestedName || 
    (currentName && niche ? `${currentName} | ${niche}` : null);

  if (!displaySuggestedName) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-cyan-400" />
          Otimização de Nome (SEO)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3 bg-gray-900 border border-cyan-500/30">
                <p className="text-sm">
                  Adicionar palavras-chave do seu nicho ao <strong>campo Nome</strong> do perfil 
                  ajuda o Instagram a mostrar o seu perfil quando alguém pesquisa por essas palavras.
                </p>
                <p className="text-sm mt-2 text-cyan-300">
                  Exemplo: Se você trabalha com "Marketing Digital", aparecer nas buscas por "marketing".
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="ml-auto border-amber-500/50 text-amber-300 text-xs">
            SEO
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Name */}
        {currentName && (
          <div className="p-3 rounded-lg bg-muted/10 border border-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Nome Atual:</p>
            <p className="text-sm text-muted-foreground">{currentName}</p>
          </div>
        )}

        {/* Suggested Name */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative"
        >
          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-950/30 to-orange-950/30 border border-amber-500/30 hover:border-amber-500/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-medium text-amber-300">Nome Otimizado Sugerido:</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-medium text-white flex-1">{displaySuggestedName}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-amber-500/20"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-amber-400" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Info className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-cyan-200/90 font-medium">
              Por que isto funciona?
            </p>
            <p className="text-xs text-cyan-200/70">
              O Instagram usa o campo "Nome" para indexação de busca. Adicionando palavras-chave 
              do seu nicho após o nome real (usando | ou •), você aparece em mais pesquisas 
              sem perder a identidade pessoal.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
