import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditExhaustedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditExhaustedModal({ open, onOpenChange }: CreditExhaustedModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/dashboard/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-amber-500/30 bg-gradient-to-br from-background via-background to-amber-950/20">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
            <Crown className="h-8 w-8 text-black" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
            Limites de IA Atingidos
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Os seus créditos de IA para este mês esgotaram. Faça o upgrade para continuar a usar todas as funcionalidades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">Plano Pro</p>
                <p className="text-sm text-muted-foreground">50 créditos de IA por mês</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">Plano Elite</p>
                <p className="text-sm text-muted-foreground">Créditos ilimitados</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button 
            onClick={handleUpgrade}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600 font-semibold"
            size="lg"
          >
            Fazer Upgrade Agora
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Ou aguarde a renovação dos créditos no próximo mês
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
