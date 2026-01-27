import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Check, X, Copy, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BeforeAfterComparisonProps {
  currentBio?: string;
  suggestedBio?: string;
  currentPhotoScore?: number;
  suggestedPhotoScore?: number;
  currentScore: number;
  projectedScore: number;
  photoUrl?: string;
  photoAnalysis?: {
    profile_image_url?: string;
    framing?: number;
    background?: number;
    lighting?: number;
    expression?: number;
    overall_score?: number;
    suggestions?: string[];
  };
  photoIssues?: string[];
  bioIssues?: string[];
  onApplySuggestions?: () => void;
  // New props for validation
  analysisId?: string;
  targetUrl?: string;
  suggestedBios?: string[];
  onScoreUpdate?: (newScore: number) => void;
}

export function BeforeAfterComparison({
  currentBio,
  suggestedBio,
  currentPhotoScore = 60,
  suggestedPhotoScore = 85,
  currentScore,
  projectedScore,
  photoUrl,
  photoAnalysis,
  photoIssues = [],
  bioIssues = [],
  onApplySuggestions,
  analysisId,
  targetUrl,
  suggestedBios = [],
  onScoreUpdate
}: BeforeAfterComparisonProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [photoError, setPhotoError] = useState(false);

  // Use prop directly instead of local state to stay in sync
  const displayScore = currentScore;

  // Get the best available photo URL with multiple fallbacks
  const displayPhotoUrl = photoUrl || photoAnalysis?.profile_image_url || null;

  const handleCopyBio = () => {
    if (suggestedBio) {
      navigator.clipboard.writeText(suggestedBio);
      toast.success("Bio copiada!");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  // Rate limit: 15 minutes between validations
  const canValidate = !lastValidation || 
    (Date.now() - lastValidation.getTime()) > 15 * 60 * 1000;

  const validateImprovements = async () => {
    if (!targetUrl || !analysisId) {
      toast.error("URL de perfil não disponível");
      return;
    }

    if (!canValidate) {
      const minutesRemaining = Math.ceil((15 * 60 * 1000 - (Date.now() - lastValidation!.getTime())) / 60000);
      toast.info(`Aguarde ${minutesRemaining} minutos para validar novamente`);
      return;
    }

    setIsValidating(true);

    try {
      // Call edge function for new scan
      const { data: newAnalysis, error } = await supabase.functions.invoke(
        'analyze-social-real',
        { body: { url: targetUrl, force_refresh: true } }
      );

      if (error) throw error;

      // Compare bio
      const oldBio = currentBio;
      const newBio = newAnalysis?.bio_analysis?.actual_bio;
      
      let bonusPoints = 0;
      const improvements: string[] = [];

      if (newBio && newBio !== oldBio) {
        // Check if new bio is one of the suggested ones
        const isSuggestedBio = suggestedBios.some(
          suggested => newBio?.toLowerCase().includes(suggested.slice(0, 30).toLowerCase())
        );

        if (isSuggestedBio) {
          bonusPoints += 15;
          improvements.push("Bio otimizada aplicada (+15 pontos)");
        } else {
          bonusPoints += 5;
          improvements.push("Bio alterada (+5 pontos)");
        }
      }

      // Check photo changes
      const oldPhotoUrl = displayPhotoUrl;
      const newPhotoUrl = newAnalysis?.photo_analysis?.profile_image_url;
      
      if (newPhotoUrl && oldPhotoUrl && newPhotoUrl !== oldPhotoUrl) {
        bonusPoints += 10;
        improvements.push("Foto de perfil atualizada (+10 pontos)");
      }

      // Calculate new score
      const newScore = Math.min(100, displayScore + bonusPoints);

      // Update in database
      if (bonusPoints > 0) {
        await supabase
          .from('history_analysis')
          .update({ score: newScore })
          .eq('id', analysisId);

        // Update UI via parent callback
        onScoreUpdate?.(newScore);

        toast.success(
          <div className="space-y-1">
            <p className="font-medium">Validação concluída!</p>
            {improvements.map((imp, i) => (
              <p key={i} className="text-sm text-green-300">{imp}</p>
            ))}
            <p className="text-sm font-bold">Novo Score: {newScore}</p>
          </div>
        );
      } else {
        toast.info("Nenhuma alteração detectada no perfil. Aplique as sugestões e tente novamente.");
      }

    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Erro ao validar melhorias");
    } finally {
      setIsValidating(false);
      setLastValidation(new Date());
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          Comparação: Antes vs Depois
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30"
          >
            <p className="text-xs text-muted-foreground mb-1">Atual</p>
            <p className={`text-3xl font-bold ${getScoreColor(displayScore)}`}>
              {displayScore}
            </p>
            <p className="text-xs text-muted-foreground">/100</p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <ArrowRight className="h-5 w-5 text-cyan-400" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <p className="text-xs text-muted-foreground mb-1">Projetado</p>
            <p className={`text-3xl font-bold ${getScoreColor(projectedScore)}`}>
              {projectedScore}
            </p>
            <p className="text-xs text-muted-foreground">/100</p>
          </motion.div>
        </div>

        {/* Photo Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">Foto Atual</h4>
            <div className="relative">
              {displayPhotoUrl && !photoError ? (
                <img 
                  src={displayPhotoUrl} 
                  alt="Foto atual" 
                  className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-red-500/50"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 mx-auto border-2 border-dashed border-cyan-500/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center px-2">Foto de perfil</span>
                </div>
              )}
              <Badge 
                variant="outline" 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500/20 border-red-500/50 text-red-300"
              >
                {currentPhotoScore}/100
              </Badge>
            </div>
            <div className="space-y-1.5">
              {photoIssues.slice(0, 3).map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <X className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">Foto Ideal</h4>
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 mx-auto border-2 border-green-500/50 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <Badge 
                variant="outline" 
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500/20 border-green-500/50 text-green-300"
              >
                {suggestedPhotoScore}/100
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs">
                <Check className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Rosto em destaque (50-60%)</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Check className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Iluminação profissional</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Check className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Fundo neutro ou desfocado</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bio Comparison */}
        <div className="space-y-4 pt-4 border-t border-muted/20">
          <h4 className="text-sm font-medium">Bio</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">Atual:</p>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                {currentBio || "Bio não detectada"}
              </div>
              <div className="space-y-1">
                {bioIssues.slice(0, 2).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <X className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">Sugerida:</p>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                {suggestedBio || "Bio otimizada com CTA e keywords"}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs border-green-500/50 hover:bg-green-500/10"
                onClick={handleCopyBio}
              >
                <Copy className="h-3 w-3" />
                Copiar Bio Sugerida
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Validate Improvements Button */}
        {targetUrl && analysisId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 gap-2"
              onClick={validateImprovements}
              disabled={isValidating || !canValidate}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  A validar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Validar Melhorias no Perfil
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Clique para verificar se as mudanças foram aplicadas no seu perfil
              {lastValidation && (
                <span className="block mt-1">
                  Última validação: {lastValidation.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </p>
          </motion.div>
        )}

        {/* Apply All Button (legacy) */}
        {onApplySuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 gap-2"
              onClick={onApplySuggestions}
            >
              <Sparkles className="h-4 w-4" />
              Aplicar Todas as Sugestões
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
