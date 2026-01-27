import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Rocket, Sparkles, Clock, Loader2, Crown, Settings, Flame, Star, Zap, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
}

interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
}

const COUNTDOWN_KEY = "pricing_countdown_end";
const COUNTDOWN_DURATION = 15 * 60 * 1000; // 15 minutes in ms

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [remainingSlots, setRemainingSlots] = useState(7);
  const [countdown, setCountdown] = useState<CountdownTime>({ hours: 0, minutes: 15, seconds: 0 });

  // Initialize and manage the urgency countdown
  useEffect(() => {
    const initCountdown = () => {
      const storedEnd = localStorage.getItem(COUNTDOWN_KEY);
      const now = Date.now();
      
      if (!storedEnd || parseInt(storedEnd) < now) {
        // Start new countdown
        const newEnd = now + COUNTDOWN_DURATION;
        localStorage.setItem(COUNTDOWN_KEY, newEnd.toString());
        return newEnd;
      }
      return parseInt(storedEnd);
    };

    const endTime = initCountdown();

    const updateCountdown = () => {
      const now = Date.now();
      let diff = endTime - now;
      
      // If expired, keep at 00:00:01 to maintain urgency
      if (diff <= 0) {
        diff = 1000; // 1 second
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserData();
    checkSubscription();
    
    if (searchParams.get("canceled") === "true") {
      toast.info("Pagamento cancelado. Você pode tentar novamente quando quiser.");
    }
    
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at, has_lifetime_access")
        .eq("id", user.id)
        .single();

      if (profile?.has_lifetime_access) {
        setHasLifetimeAccess(true);
        setCurrentPlan("pro_ai");
      }

      if (profile?.trial_ends_at) {
        calculateTimeRemaining(new Date(profile.trial_ends_at));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.subscribed) {
        setCurrentPlan(data.plan || "pro_ai");
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const calculateTimeRemaining = (trialEnd?: Date) => {
    if (!trialEnd) return;
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    setTimeRemaining({
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    });
  };

  const stripeLinks: Record<string, string> = {
    starter: "https://buy.stripe.com/cNieVe7VMfZMdr4eLt2sM0I",
    pro: "https://buy.stripe.com/dRm00kgsicNAbiWbzh2sM0H",
    elite: "https://buy.stripe.com/9B628s0tk8xk9aObzh2sM0K",
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça login primeiro");
        navigate("/auth");
        return;
      }

      const stripeUrl = stripeLinks[planId];
      if (stripeUrl) {
        window.open(stripeUrl, "_blank");
      } else {
        toast.error("Link de pagamento não encontrado");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setPortalLoading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "9,90",
      oldPrice: "19,90",
      description: "Para quem está a começar",
      icon: Star,
      color: "cyan",
      features: [
        { name: "Análise de 1 Perfil Social (Instagram)", included: true },
        { name: "Relatório Básico de Pontos Fortes e Fracos", included: true },
        { name: "Gerador de Legendas com IA (Limitado)", included: true },
        { name: "Acesso ao Painel do Utilizador", included: true },
        { name: "Espião de Concorrentes", included: false },
        { name: "Calendário de Conteúdo Semanal", included: false },
        { name: "Suporte Prioritário", included: false },
      ],
      popular: false,
      gradient: "from-slate-800 to-slate-900",
      borderColor: "border-cyan-500/30",
    },
    {
      id: "pro",
      name: "Pro",
      price: "29,90",
      oldPrice: "49,90",
      description: "Menos de 1€ por dia para análises ilimitadas",
      icon: Flame,
      color: "amber",
      features: [
        { name: "Tudo do Starter +", included: true },
        { name: "Análise Ilimitada (Instagram, Facebook, YouTube)", included: true },
        { name: "Espião de Concorrentes", included: true },
        { name: "Calendário de Conteúdo Semanal gerado por IA", included: true },
        { name: "Detecção Automática de Nicho", included: true },
        { name: "Relatório Estratégico Completo", included: true },
        { name: "Suporte Prioritário", included: true },
      ],
      popular: true,
      gradient: "from-amber-950/50 via-slate-900 to-slate-900",
      borderColor: "border-amber-500/50",
    },
    {
      id: "elite",
      name: "Elite",
      price: "67,00",
      oldPrice: "97,00",
      description: "Para agências e empresas",
      icon: Crown,
      color: "purple",
      features: [
        { name: "Tudo do Pro +", included: true },
        { name: "Gerador de Roteiros de Vídeo (Reels/YouTube)", included: true },
        { name: "Análise de Sentimento e Engajamento Profundo", included: true },
        { name: "Criação de Copy para Anúncios (Ads)", included: true },
        { name: "Automação de WhatsApp Ilimitada", included: true },
        { name: "Acesso Antecipado a Novas Funções", included: true },
        { name: "Consultoria Mensal 1:1", included: true },
      ],
      popular: false,
      gradient: "from-purple-950/50 via-slate-900 to-slate-900",
      borderColor: "border-purple-500/30",
    },
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case "amber": return "text-amber-400";
      case "purple": return "text-purple-400";
      default: return "text-cyan-400";
    }
  };

  const getCheckColor = (color: string) => {
    switch (color) {
      case "amber": return "text-amber-400 bg-amber-500/20";
      case "purple": return "text-purple-400 bg-purple-500/20";
      default: return "text-cyan-400 bg-cyan-500/20";
    }
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Urgency Countdown Bar */}
      <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="bg-gradient-to-r from-red-900/90 via-red-800/90 to-orange-900/90 backdrop-blur-sm border-b border-red-500/30 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
              <span className="text-orange-200 font-medium text-sm sm:text-base">
                🔥 OFERTA DE LANÇAMENTO: Os preços reduzidos de 9,90€, 29,90€ e 67,00€ expiram em:
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-lg sm:text-xl font-bold text-white bg-black/40 px-3 py-1 rounded-lg border border-red-500/50">
              <Timer className="h-5 w-5 text-red-400 mr-1" />
              <span className="text-red-300">{formatNumber(countdown.hours)}h</span>
              <span className="text-red-400">:</span>
              <span className="text-red-300">{formatNumber(countdown.minutes)}m</span>
              <span className="text-red-400">:</span>
              <span className="text-red-300">{formatNumber(countdown.seconds)}s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Planos e Preços</h1>
        <p className="text-lg text-muted-foreground">
          Escolha o plano ideal para escalar o seu negócio
        </p>

        {/* Scarcity Counter */}
        <div className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
            <span className="text-orange-300 font-semibold">
              Apenas {remainingSlots} vagas com este desconto!
            </span>
            <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
          </div>
          <Progress 
            value={((10 - remainingSlots) / 10) * 100} 
            className="w-48 h-2 bg-orange-950"
          />
        </div>
        
        {hasLifetimeAccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium">
              Você tem acesso vitalício ao Plano Pro!
            </span>
          </div>
        )}

        {!hasLifetimeAccess && currentPlan && subscriptionEnd && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <Check className="h-5 w-5 text-green-400" />
            <span className="text-green-300 font-medium">
              Assinatura ativa até {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        
        {!currentPlan && timeRemaining && timeRemaining.days > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
            <Clock className="h-5 w-5 text-orange-400" />
            <span className="text-orange-300 font-medium">
              O seu acesso gratuito expira em: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id || 
            (plan.id === "pro" && (currentPlan === "advanced" || currentPlan === "pro_ai"));
          
          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden bg-gradient-to-br ${plan.gradient} border-2 ${plan.borderColor} panel-shadow transition-all duration-300 hover:scale-[1.02]`}
            >
              {/* Glow effect for popular plan */}
              {plan.popular && (
                <>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full" />
                  <div className="absolute -top-1 -right-1 -left-1">
                    <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
                  </div>
                </>
              )}
              
              {/* Popular Badge */}
              {plan.popular && (
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mais Vendido
                </Badge>
              )}

              {/* Discount Badge for Pro */}
              {plan.popular && (
                <Badge className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  70% desconto hoje
                </Badge>
              )}

              <CardHeader className="text-center pb-6 relative">
                <div className={`flex items-center justify-center gap-2 mb-2`}>
                  <Icon className={`h-6 w-6 ${getIconColor(plan.color)}`} />
                  <CardTitle className={`text-2xl ${plan.popular ? "text-amber-300" : "text-foreground"}`}>
                    Plano {plan.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  {plan.oldPrice && (
                    <span className="text-lg text-muted-foreground/60 line-through mr-2">
                      €{plan.oldPrice}
                    </span>
                  )}
                  <span className={`text-4xl font-bold ${plan.popular ? "text-amber-300" : "text-foreground"}`}>
                    €{plan.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 relative">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${getCheckColor(plan.color)}`}>
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-5 w-5" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/40 text-sm"}>
                        {feature.included ? feature.name : `${feature.name} (disponível no Pro)`}
                      </span>
                    </div>
                  ))}
                </div>

                {isCurrentPlan ? (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={portalLoading || hasLifetimeAccess}
                    variant="outline"
                    className={`w-full mt-6 ${plan.popular ? "border-amber-500/50 text-amber-300 hover:bg-amber-500/10" : ""}`}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : hasLifetimeAccess ? (
                      <>
                        <Crown className="h-5 w-5 mr-2" />
                        Acesso Vitalício
                      </>
                    ) : (
                      <>
                        <Settings className="h-5 w-5 mr-2" />
                        Gerenciar Assinatura
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full mt-6 font-semibold py-6 ${
                      plan.popular 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]" 
                        : plan.color === "purple"
                        ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                    }`}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Rocket className="h-5 w-5 mr-2" />
                    )}
                    {plan.popular ? "Escolher Pro" : "Assinar Agora"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-muted-foreground text-sm">
        <p>Pagamento seguro processado via Stripe. Cancele a qualquer momento.</p>
        <p className="mt-1 text-xs">O IVA será calculado no checkout conforme a sua localização.</p>
      </div>
    </div>
  );
};

export default PricingPage;