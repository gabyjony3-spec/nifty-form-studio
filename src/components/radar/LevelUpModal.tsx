import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Crown, Medal, Award, Sparkles, Star, TrendingUp } from "lucide-react";
import { AuthorityLevel, levelConfig } from "./AuthorityLevelBadge";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  previousLevel: AuthorityLevel;
  newLevel: AuthorityLevel;
  previousScore: number;
  newScore: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  userName,
  previousLevel,
  newLevel,
  previousScore,
  newScore
}: LevelUpModalProps) {
  const newConfig = levelConfig[newLevel];
  const Icon = newConfig.icon;
  const scoreIncrease = newScore - previousScore;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-amber-300">
            🎉 Parabéns!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Level Icon Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center"
          >
            <div className={`
              p-6 rounded-full 
              bg-gradient-to-br ${newConfig.gradient}
              shadow-xl shadow-amber-500/30
            `}>
              <Icon className="h-16 w-16 text-white" />
            </div>
          </motion.div>

          {/* Congratulations Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-2"
          >
            <p className="text-xl text-white font-semibold">
              {userName || "Você"}
            </p>
            <p className="text-muted-foreground">
              Sua autoridade agora é
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-3xl font-bold ${newConfig.textColor}`}>
                Nível {newConfig.label}
              </span>
              {newLevel === "diamante" && (
                <Star className="h-6 w-6 text-cyan-400 fill-current animate-pulse" />
              )}
            </div>
          </motion.div>

          {/* Score Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-muted/20 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score anterior</span>
              <span className="text-red-400 line-through">{previousScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Score atual</span>
              <span className="text-2xl font-bold text-green-400">{newScore}</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-muted/30">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                +{scoreIncrease} pontos
              </span>
            </div>
          </motion.div>

          {/* Motivation Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground">
              {newLevel === "diamante" 
                ? "Você alcançou o nível máximo de autoridade! 🏆"
                : "Continue evoluindo para alcançar o próximo nível!"
              }
            </p>
          </motion.div>

          {/* Close Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Continuar Evoluindo
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
