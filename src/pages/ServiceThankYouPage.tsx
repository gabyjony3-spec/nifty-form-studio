import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ServiceThankYouPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + (100 / 30);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleWhatsApp = () => {
    window.open("https://wa.me/351XXXXXXXXX", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 animate-pulse">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Obrigado!</h1>
            <p className="text-muted-foreground">
              A sua inscrição foi recebida com sucesso. Em breve entraremos em contacto.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">A preparar o seu acesso...</div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleWhatsApp} variant="default" className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar no WhatsApp
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Voltar ao Início
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
