import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Rocket, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  
  const isFromCheckout = searchParams.get("success") === "true";

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {isFromCheckout ? "Pagamento Confirmado!" : "Bem-vindo ao AI INsight!"}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {isFromCheckout 
                  ? "Sua assinatura Pro está ativa. Aproveite todos os recursos!"
                  : "Sua conta foi criada com sucesso. Vamos começar!"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid gap-4 md:grid-cols-3 pt-4"
            >
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Análise IA</h3>
                <p className="text-sm text-muted-foreground">Análises completas com IA</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Rocket className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Automações</h3>
                <p className="text-sm text-muted-foreground">WhatsApp automatizado</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold">Relatórios</h3>
                <p className="text-sm text-muted-foreground">Insights detalhados</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-6 space-y-4"
            >
              <Button 
                size="lg" 
                onClick={() => navigate("/dashboard")}
                className="w-full md:w-auto px-8"
              >
                Ir para o Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Redirecionando automaticamente em {countdown} segundos...
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;
