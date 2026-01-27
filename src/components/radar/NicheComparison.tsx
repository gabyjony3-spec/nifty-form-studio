import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TrendingUp, Target, ArrowRight, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NicheComparisonProps {
  userScore: number;
  niche: string;
  onGeneratePlan: () => void;
}

export function NicheComparison({ userScore, niche, onGeneratePlan }: NicheComparisonProps) {
  const [nicheAverage, setNicheAverage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilesCount, setProfilesCount] = useState(0);

  useEffect(() => {
    const fetchNicheAverage = async () => {
      if (!niche) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch average score from social_analysis_cache for the same niche
        const { data, error } = await supabase
          .from("social_analysis_cache")
          .select("score")
          .eq("niche_detected", niche)
          .not("score", "is", null);

        if (error) throw error;

        if (data && data.length > 0) {
          const validScores = data.filter(d => d.score !== null).map(d => d.score as number);
          if (validScores.length > 0) {
            const avg = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
            setNicheAverage(avg);
            setProfilesCount(validScores.length);
          } else {
            // Default average for niche if no data
            setNicheAverage(60);
            setProfilesCount(0);
          }
        } else {
          // Default average based on typical niche performance
          setNicheAverage(60);
          setProfilesCount(0);
        }
      } catch (error) {
        console.error("Error fetching niche average:", error);
        // Fallback to estimated average
        setNicheAverage(60);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNicheAverage();
  }, [niche]);

  if (isLoading) {
    return (
      <Card className="glass-card border-amber-500/20">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted/30 rounded w-3/4 mx-auto" />
            <div className="h-16 bg-muted/30 rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAboveAverage = userScore >= (nicheAverage || 60);
  const difference = Math.abs(userScore - (nicheAverage || 60));
  const percentageDiff = nicheAverage ? Math.round((difference / nicheAverage) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-card border-amber-500/30 overflow-hidden relative">
        {/* Golden gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Comparativo de Nicho</h3>
            </div>

            {/* Score Comparison */}
            <div className="flex items-center justify-center gap-8">
              {/* User Score */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">O seu Score</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                    isAboveAverage 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-amber-500 bg-amber-500/10"
                  }`}
                >
                  <span className={`text-2xl font-bold ${
                    isAboveAverage ? "text-green-400" : "text-amber-400"
                  }`}>
                    {userScore}
                  </span>
                </motion.div>
                {isAboveAverage && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Crown className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Top Performer</span>
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-8 bg-muted/30" />
                <span className="text-xs text-muted-foreground font-medium">VS</span>
                <div className="w-px h-8 bg-muted/30" />
              </div>

              {/* Niche Average */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Média do Nicho</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-muted bg-muted/10"
                >
                  <span className="text-2xl font-bold text-muted-foreground">
                    {nicheAverage}
                  </span>
                </motion.div>
                {profilesCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Baseado em {profilesCount} perfis
                  </p>
                )}
              </div>
            </div>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`text-center p-4 rounded-lg ${
                isAboveAverage 
                  ? "bg-green-500/10 border border-green-500/30" 
                  : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className={`h-4 w-4 ${isAboveAverage ? "text-green-400" : "text-amber-400"}`} />
                <p className={`font-semibold ${isAboveAverage ? "text-green-400" : "text-amber-400"}`}>
                  {isAboveAverage 
                    ? `${difference} pontos acima da média!` 
                    : `${difference} pontos abaixo da média`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAboveAverage 
                  ? `Você está entre os melhores perfis de ${niche}. Continue assim!` 
                  : `A média para ${niche} é ${nicheAverage}. Implemente as melhorias sugeridas para subir.`}
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onGeneratePlan}
                className="w-full h-14 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-black font-bold text-base gap-2 shadow-lg shadow-amber-500/25"
              >
                <Sparkles className="h-5 w-5" />
                GERAR MEU PLANO DE GUERRA PARA SUBIR O SCORE
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
