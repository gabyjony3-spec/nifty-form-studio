import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Rocket } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

export const TrialCountdown = () => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const { isPro, isLifetime, isElite, trialEndsAt, isLoading } = useSubscription();

  useEffect(() => {
    if (trialEndsAt) {
      calculateTimeRemaining(new Date(trialEndsAt));
    }
    const interval = setInterval(() => {
      if (trialEndsAt) {
        calculateTimeRemaining(new Date(trialEndsAt));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  const calculateTimeRemaining = (trialEnd: Date) => {
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    setTimeRemaining({ days, hours, minutes, expired: false });
  };

  // Hide for pro/lifetime/elite users
  if (isLoading || isPro || isLifetime || isElite || !timeRemaining) return null;

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 24;

  if (timeRemaining.expired) {
    return (
      <Card className="bg-gradient-to-r from-destructive/20 to-orange-500/20 border-destructive/50 mb-6">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-destructive" />
            <div>
              <p className="text-foreground font-semibold">O seu período de teste expirou!</p>
              <p className="text-sm text-muted-foreground">Faça upgrade para continuar a usar todas as funcionalidades</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate("/dashboard/pricing")}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Upgrade para Pro
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 transition-all duration-300 ${
      isUrgent 
        ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50 animate-pulse" 
        : "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30"
    }`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Clock className={`h-6 w-6 ${isUrgent ? "text-red-500" : "text-cyan-400"}`} />
          <div>
            <p className="text-sm text-muted-foreground">O seu período de teste termina em:</p>
            <div className="flex items-center gap-3 mt-1">
              <div className={`text-center px-3 py-1 rounded-lg ${
                isUrgent ? "bg-red-500/20" : "bg-cyan-500/20"
              }`}>
                <span className={`text-2xl font-bold ${isUrgent ? "text-red-400" : "text-cyan-300"}`}>
                  {timeRemaining.days}
                </span>
                <p className="text-xs text-muted-foreground">dias</p>
              </div>
              <span className="text-2xl text-muted-foreground">:</span>
              <div className={`text-center px-3 py-1 rounded-lg ${
                isUrgent ? "bg-red-500/20" : "bg-cyan-500/20"
              }`}>
                <span className={`text-2xl font-bold ${isUrgent ? "text-red-400" : "text-cyan-300"}`}>
                  {timeRemaining.hours.toString().padStart(2, "0")}
                </span>
                <p className="text-xs text-muted-foreground">horas</p>
              </div>
              <span className="text-2xl text-muted-foreground">:</span>
              <div className={`text-center px-3 py-1 rounded-lg ${
                isUrgent ? "bg-red-500/20" : "bg-cyan-500/20"
              }`}>
                <span className={`text-2xl font-bold ${isUrgent ? "text-red-400" : "text-cyan-300"}`}>
                  {timeRemaining.minutes.toString().padStart(2, "0")}
                </span>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/dashboard/pricing")}
          className={`font-semibold ${
            isUrgent 
              ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600" 
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          } text-white`}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Upgrade para Pro
        </Button>
      </CardContent>
    </Card>
  );
};
