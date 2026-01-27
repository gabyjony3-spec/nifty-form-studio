import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const STRIPE_ELITE_LINK = "https://buy.stripe.com/9B628s0tk8xk9aObzh2sM0K";

const eliteFeatures = [
  "Análises ilimitadas de perfis",
  "Todas as redes sociais (IG, FB, YT, TikTok, LinkedIn)",
  "Calendário preditivo de 90 dias",
  "Gerador de legendas Premium + Roteiros",
  "Espião de concorrentes ilimitado + Alertas",
  "Automação WhatsApp ilimitada",
  "Gerador de anúncios com IA",
  "Análise de sentimento avançada",
  "Suporte VIP via WhatsApp",
  "Consultoria 1:1 mensal",
  "Acesso antecipado a novas funcionalidades",
];

interface ElitePricingCardProps {
  showOriginalPrice?: boolean;
}

export function ElitePricingCard({ showOriginalPrice = true }: ElitePricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com o upgrade.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Redirect to Stripe with prefilled email
      const stripeUrl = `${STRIPE_ELITE_LINK}?prefilled_email=${encodeURIComponent(session.user.email || "")}`;
      window.open(stripeUrl, "_blank");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative max-w-md mx-auto"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 blur-xl rounded-3xl" />
      
      <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 shadow-2xl">
        {/* Popular badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-4 py-1">
            <Crown className="h-4 w-4 mr-1" />
            Mais Popular
          </Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 mb-4"
          >
            <Crown className="h-8 w-8 text-slate-900" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-2">Plano Elite</h3>
          <p className="text-muted-foreground text-sm">Acesso completo a todas as funcionalidades</p>
        </div>

        {/* Price */}
        <div className="text-center mb-8">
          {showOriginalPrice && (
            <p className="text-muted-foreground line-through text-lg mb-1">€147/mês</p>
          )}
          <div className="flex items-end justify-center gap-1">
            <span className="text-5xl font-bold text-white">€97</span>
            <span className="text-muted-foreground mb-2">/mês</span>
          </div>
          {showOriginalPrice && (
            <Badge variant="outline" className="mt-2 border-green-500/50 text-green-400">
              Poupe €50/mês
            </Badge>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {eliteFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Check className="h-3 w-3 text-amber-400" />
              </div>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold py-6 text-lg shadow-lg shadow-amber-500/25"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Crown className="mr-2 h-5 w-5" />
              Fazer Upgrade Agora
            </>
          )}
        </Button>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-green-400" />
          <span>Garantia de 7 dias • Cancele quando quiser</span>
        </div>
      </div>
    </motion.div>
  );
}
