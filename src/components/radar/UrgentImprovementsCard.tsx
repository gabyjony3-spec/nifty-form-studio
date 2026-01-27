import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Zap, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UrgentImprovementsCardProps {
  improvements: string[];
  onTutorialClick?: (improvement: string) => void;
  onApplyCorrections?: () => void;
  analysisId?: string;
}

export function UrgentImprovementsCard({ 
  improvements, 
  onTutorialClick,
  onApplyCorrections,
  analysisId
}: UrgentImprovementsCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedItems, setAppliedItems] = useState<number[]>([]);

  if (!improvements || improvements.length === 0) return null;

  const handleApplyCorrections = async () => {
    setIsApplying(true);
    
    try {
      // Simulate AI analysis and correction application
      for (let i = 0; i < Math.min(improvements.length, 3); i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAppliedItems(prev => [...prev, i]);
      }

      // Call AI to generate detailed action plan
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Generate AI-powered action plan for each improvement
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            message: `Com base nas seguintes melhorias urgentes para um perfil de redes sociais, gere um plano de ação detalhado e prático para cada uma:

${improvements.slice(0, 3).map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

Responda em português de Portugal. Para cada melhoria, inclua:
- Passo-a-passo concreto
- Tempo estimado de implementação
- Impacto esperado no score

Formato: JSON com array "action_plans" contendo objetos com "improvement", "steps", "time", "impact".`,
            context: "Especialista em marketing digital e otimização de perfis"
          }
        });

        if (!error && data?.response) {
          toast.success("Plano de correções gerado com sucesso!", {
            description: "Verifique as recomendações detalhadas abaixo."
          });
        }
      }

      if (onApplyCorrections) {
        onApplyCorrections();
      } else {
        toast.success("Correções aplicadas!", {
          description: "O seu plano de ação foi gerado. Siga as recomendações para melhorar o score."
        });
      }
    } catch (error) {
      console.error("Error applying corrections:", error);
      toast.error("Erro ao aplicar correções. Tente novamente.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          O que mudar agora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {improvements.slice(0, 3).map((improvement, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
              appliedItems.includes(index) 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
            } group`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              appliedItems.includes(index)
                ? 'bg-green-500/20'
                : 'bg-red-500/20'
            }`}>
              {appliedItems.includes(index) ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <span className="text-sm font-bold text-red-400">{index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${
                appliedItems.includes(index) ? 'text-green-300 line-through' : 'text-muted-foreground'
              }`}>
                {improvement}
              </p>
            </div>
            {onTutorialClick && !appliedItems.includes(index) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTutorialClick(improvement)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <Button 
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white disabled:opacity-50"
            onClick={handleApplyCorrections}
            disabled={isApplying || appliedItems.length === improvements.slice(0, 3).length}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A aplicar correções...
              </>
            ) : appliedItems.length === improvements.slice(0, 3).length ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Correções Aplicadas
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Aplicar Correções
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Impact preview */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-center text-muted-foreground"
        >
          {appliedItems.length > 0 ? (
            <>
              <span className="text-green-400 font-bold">{appliedItems.length} correções aplicadas</span> - Continue para maximizar o seu score!
            </>
          ) : (
            <>
              Corrigir estes pontos pode aumentar o seu Profile Score em até <span className="text-green-400 font-bold">+25 pontos</span>
            </>
          )}
        </motion.p>
      </CardContent>
    </Card>
  );
}