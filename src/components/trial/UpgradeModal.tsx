import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Rocket, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export const UpgradeModal = ({ open, onOpenChange, featureName = "esta funcionalidade" }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Direct Stripe payment links (same as PricingPage)
  const stripeLinks = {
    starter: "https://buy.stripe.com/dRm00k0tkcNA3QueLt2sM0w",
    pro: "https://buy.stripe.com/14AcN6b7YfZMcn09r92sM0x",
    elite: "https://buy.stripe.com/28E00k0tk5l82MqcDl2sM0y",
  };

  const handleUpgrade = () => {
    setLoading(true);
    // Open Pro plan link directly
    window.open(stripeLinks.pro, "_blank");
    onOpenChange(false);
    setLoading(false);
  };

  const handleViewPricing = () => {
    onOpenChange(false);
    navigate("/dashboard/pricing");
  };

  const proFeatures = [
    "Análises de Website Ilimitadas",
    "Relatórios Profissionais de SEO com IA",
    "Publicar Campanhas no Meta Ads",
    "Automação de WhatsApp 24/7",
    "Suporte Prioritário",
    "Multicontas (Insta, FB, TikTok, YT)",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            Funcionalidade Pro
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            <span className="text-cyan-400 font-medium">{featureName}</span> está disponível apenas no Plano Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">€29</span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Desbloqueie o Acesso Total:
          </p>
          <div className="space-y-3">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-cyan-400" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5 mr-2" />
            )}
            {loading ? "Processando..." : "Assinar por €29/mês"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleViewPricing}
            className="text-muted-foreground hover:text-foreground"
          >
            Ver todos os planos
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Talvez mais tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
