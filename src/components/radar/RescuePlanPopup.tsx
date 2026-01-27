import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, ArrowRight, Zap, Target, Users } from "lucide-react";

interface RescuePlanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  urgentImprovements: string[];
  onApplyRescuePlan: () => void;
  onViewDetails: () => void;
}

export function RescuePlanPopup({
  isOpen,
  onClose,
  score,
  urgentImprovements,
  onApplyRescuePlan,
  onViewDetails,
}: RescuePlanPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg border-0 bg-transparent p-0 mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative"
        >
          {/* Subtle red glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10 blur-2xl rounded-full -z-10" />

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-red-500/30 p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Alert badge */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 rounded-full flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">Alerta de Autoridade</span>
              </div>
            </motion.div>

            <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
              {/* Icon */}
              <motion.div 
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <div className="relative">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                    <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-red-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-2 border-2 border-red-500/20 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Score */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-5xl font-bold text-red-400">{score}</p>
                <p className="text-muted-foreground text-xs sm:text-sm">Profile Score</p>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center space-y-1 sm:space-y-2"
              >
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  O seu perfil está a perder clientes
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Identificamos pontos críticos que afetam a sua autoridade digital. 
                  A boa notícia? Podemos corrigir isso rapidamente.
                </p>
              </motion.div>

              {/* Urgent Improvements */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                  O que mudar agora:
                </p>
                <div className="space-y-2">
                  {(urgentImprovements.length > 0 ? urgentImprovements.slice(0, 3) : [
                    "Otimize a sua bio com uma CTA clara",
                    "Melhore a foto de perfil para transmitir autoridade",
                    "Aumente a frequência de publicações"
                  ]).map((improvement, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-red-400">{index + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{improvement}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats preview */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-3 gap-2 sm:gap-3"
              >
                <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/10">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-sm sm:text-lg font-bold text-white">+40%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Engagement</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/10">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mx-auto mb-1" />
                  <p className="text-sm sm:text-lg font-bold text-white">+25%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Conversões</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/10">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-sm sm:text-lg font-bold text-white">+500</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Seguidores</p>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-2 sm:space-y-3"
              >
                <Button 
                  onClick={onApplyRescuePlan}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 sm:py-6 text-sm sm:text-base"
                >
                  <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Aplicar Plano de Resgate
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onViewDetails}
                  className="w-full text-muted-foreground hover:text-white text-xs sm:text-sm"
                >
                  Ver Detalhes do Diagnóstico
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}