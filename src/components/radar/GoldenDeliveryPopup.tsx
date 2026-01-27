import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Crown, Sparkles, Trophy, Star, ArrowRight } from "lucide-react";

interface GoldenDeliveryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  niche: string;
  onViewDetails: () => void;
  onGeneratePlan: () => void;
}

export function GoldenDeliveryPopup({
  isOpen,
  onClose,
  score,
  niche,
  onViewDetails,
  onGeneratePlan,
}: GoldenDeliveryPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent p-0 overflow-visible">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative"
        >
          {/* Golden glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-amber-500/20 to-orange-500/30 blur-3xl rounded-full -z-10" />
          
          {/* Sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ 
                x: "50%", 
                y: "50%",
                scale: 0 
              }}
              animate={{ 
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-yellow-500/50 p-8 shadow-2xl overflow-hidden">
            {/* Top badge */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <Crown className="w-5 h-5 text-slate-900" />
                <span className="font-bold text-slate-900">Top 5%</span>
              </div>
            </motion.div>

            <div className="space-y-6 pt-6">
              {/* Trophy animation */}
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-slate-900" />
                  </div>
                  <motion.div
                    className="absolute -inset-4 border-4 border-yellow-400/50 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  {score}
                </p>
                <p className="text-muted-foreground">Profile Score</p>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-2"
              >
                <h3 className="text-2xl font-bold text-white">
                  Parabéns! 🎉
                </h3>
                <p className="text-lg text-amber-400">
                  O seu perfil está no <strong>Top 5%</strong> dos Mentores do nicho de {niche}!
                </p>
                <p className="text-sm text-muted-foreground">
                  Você transmite autoridade e confiança para o seu público.
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <Button 
                  onClick={onGeneratePlan}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-slate-900 font-bold py-6"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Gerar Plano de 30 Dias
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onViewDetails}
                  className="w-full border-yellow-500/30 hover:bg-yellow-500/10"
                >
                  Ver Relatório Completo
                </Button>
              </motion.div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-500/50 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-500/50 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-500/50 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-500/50 rounded-br-lg" />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}