import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, Crown, Check, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EliteUpsellButtonProps {
  feature?: string;
  className?: string;
}

export function EliteUpsellButton({ feature = "legendas automáticas", className }: EliteUpsellButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const eliteFeatures = [
    "Legendas automáticas ilimitadas",
    "Análises ilimitadas de perfis",
    "Calendário preditivo com 90 dias",
    "Suporte prioritário via WhatsApp",
    "Acesso antecipado a novas funcionalidades",
    "Geração de imagens com IA"
  ];

  const handleUpgrade = () => {
    setIsOpen(false);
    navigate("/dashboard/upgrade-elite");
  };

  return (
    <>
      {/* Sticky Button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ${className}`}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="group relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 font-bold py-6 px-8 rounded-full shadow-2xl hover:shadow-amber-500/25 transition-all"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="relative flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span>Deseja que a IA crie as {feature}?</span>
            <Badge className="bg-slate-900/20 text-slate-900 border-0">
              <Lock className="w-3 h-3 mr-1" />
              Elite
            </Badge>
          </div>
        </Button>
      </motion.div>

      {/* Upgrade Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Golden accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-yellow-500/10 rounded-lg pointer-events-none" />
          
          <DialogHeader className="relative">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <Crown className="w-8 h-8 text-slate-900" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center text-white">
              Desbloqueie o Plano Elite
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Tenha acesso completo a todas as funcionalidades premium da IA
            </DialogDescription>
          </DialogHeader>

          <div className="relative space-y-6 py-4">
            {/* Feature list */}
            <div className="space-y-3">
              {eliteFeatures.map((featureItem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">{featureItem}</span>
                </motion.div>
              ))}
            </div>

            {/* Price */}
            <div className="text-center py-4 border-t border-muted/20">
              <p className="text-sm text-muted-foreground mb-1">A partir de</p>
              <p className="text-4xl font-bold text-white">
                €97<span className="text-lg text-muted-foreground">/mês</span>
              </p>
              <p className="text-xs text-green-400 mt-1">Cancele a qualquer momento</p>
            </div>

            {/* CTA */}
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold py-6"
            >
              <Crown className="mr-2 h-5 w-5" />
              Fazer Upgrade para Elite
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Junte-se a mais de 500 mentores que já usam o AI INsight Elite
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}