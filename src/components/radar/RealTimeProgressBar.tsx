import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Users, BarChart2, Zap } from "lucide-react";
import { AuthorityLevelBadge, getAuthorityLevel, levelConfig } from "./AuthorityLevelBadge";

interface RealTimeProgressBarProps {
  currentScore: number;
  previousScore?: number;
  currentFollowers?: number;
  previousFollowers?: number;
  currentPosts?: number;
  previousPosts?: number;
  lastAnalysisDate?: string;
}

export function RealTimeProgressBar({
  currentScore,
  previousScore,
  currentFollowers,
  previousFollowers,
  currentPosts,
  previousPosts,
  lastAnalysisDate
}: RealTimeProgressBarProps) {
  const currentLevel = getAuthorityLevel(currentScore);
  const currentConfig = levelConfig[currentLevel];
  
  const scoreChange = previousScore !== undefined ? currentScore - previousScore : 0;
  const followerChange = previousFollowers !== undefined && currentFollowers !== undefined 
    ? currentFollowers - previousFollowers 
    : 0;
  const postChange = previousPosts !== undefined && currentPosts !== undefined
    ? currentPosts - previousPosts
    : 0;

  const getNextLevel = () => {
    if (currentScore >= 91) return null; // Already at max
    if (currentScore >= 61) return { name: "Diamante", threshold: 91 };
    if (currentScore >= 31) return { name: "Ouro", threshold: 61 };
    return { name: "Prata", threshold: 31 };
  };

  const nextLevel = getNextLevel();
  const progressToNext = nextLevel 
    ? ((currentScore - (currentScore >= 61 ? 61 : currentScore >= 31 ? 31 : 0)) / 
       (nextLevel.threshold - (currentScore >= 61 ? 61 : currentScore >= 31 ? 31 : 0))) * 100
    : 100;

  const formatChange = (change: number) => {
    if (change > 0) return `+${change.toLocaleString('pt-BR')}`;
    if (change < 0) return change.toLocaleString('pt-BR');
    return "0";
  };

  const formatFollowersDisplay = (count?: number): string => {
    if (!count || count === 0) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString('pt-BR');
  };

  return (
    <Card className="glass-card border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-teal-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <BarChart2 className="h-5 w-5 text-emerald-400" />
            </div>
            <span>Monitor de Evolução</span>
          </div>
          <AuthorityLevelBadge score={currentScore} size="md" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Score with Animation */}
        <div className="text-center">
          <motion.div
            key={currentScore}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative inline-block"
          >
            <span className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {currentScore}
            </span>
            <span className="text-2xl text-muted-foreground ml-1">/100</span>
            
            <AnimatePresence>
              {scoreChange !== 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, x: 10 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute -top-2 -right-12 flex items-center gap-1 ${
                    scoreChange > 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {scoreChange > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold">{formatChange(scoreChange)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <p className="text-sm text-muted-foreground mt-2">Score de Autoridade</p>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Próximo nível: {nextLevel.name}</span>
              <span className="text-emerald-300">{currentScore}/{nextLevel.threshold}</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressToNext} 
                className="h-3 bg-muted/30"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ maxWidth: "100%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Faltam {nextLevel.threshold - currentScore} pontos para {nextLevel.name}
            </p>
          </div>
        )}

        {/* Metrics Grid - Valores Atuais */}
        <div className="grid grid-cols-3 gap-3">
          {/* Score - Valor Atual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg text-center bg-cyan-500/10 border border-cyan-500/30"
          >
            <Zap className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
            <p className="text-lg font-bold text-cyan-300">
              {currentScore}
            </p>
            {previousScore !== undefined && scoreChange !== 0 && (
              <span className={`text-xs ${scoreChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({formatChange(scoreChange)})
              </span>
            )}
            <p className="text-xs text-muted-foreground">Score</p>
          </motion.div>

          {/* Seguidores - Valor Atual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg text-center bg-purple-500/10 border border-purple-500/30"
          >
            <Users className="h-5 w-5 mx-auto mb-1 text-purple-400" />
            <p className="text-lg font-bold text-purple-300">
              {formatFollowersDisplay(currentFollowers)}
            </p>
            {previousFollowers !== undefined && followerChange !== 0 && (
              <span className={`text-xs ${followerChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({formatChange(followerChange)})
              </span>
            )}
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </motion.div>

          {/* Posts - Valor Atual */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg text-center bg-blue-500/10 border border-blue-500/30"
          >
            <BarChart2 className="h-5 w-5 mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold text-blue-300">
              {currentPosts || 0}
            </p>
            {previousPosts !== undefined && postChange !== 0 && (
              <span className={`text-xs ${postChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({formatChange(postChange)})
              </span>
            )}
            <p className="text-xs text-muted-foreground">Posts</p>
          </motion.div>
        </div>

        {/* Last Analysis Info */}
        {lastAnalysisDate && (
          <p className="text-xs text-center text-muted-foreground">
            Comparado com análise de {new Date(lastAnalysisDate).toLocaleDateString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
