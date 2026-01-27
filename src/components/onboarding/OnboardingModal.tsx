import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ChevronRight, Sparkles, BarChart3, MessageSquare, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Bem-vindo ao AI INsight!",
    description: "A sua plataforma de inteligência digital com IA.",
    icon: Sparkles,
    content: "Vamos fazer um tour rápido pelas principais funcionalidades para você potenciar a sua presença digital."
  },
  {
    title: "Radar de Nicho",
    description: "Analise o seu perfil e receba um diagnóstico completo.",
    icon: BarChart3,
    content: "A nossa IA analisa a sua foto, bio, engajamento e consistência, gerando um Profile Score com um plano de ação personalizado."
  },
  {
    title: "Central de Conteúdo",
    description: "Crie posts com um clique usando IA.",
    icon: MessageSquare,
    content: "Gere legendas, imagens e sugestões de conteúdo otimizadas para o seu nicho e audiência."
  },
  {
    title: "Meta de Seguidores",
    description: "Acompanhe o seu crescimento em tempo real.",
    icon: Users,
    content: "Defina metas, visualize projeções de crescimento e receba dicas da IA para acelerar os seus resultados."
  }
];

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentIcon = steps[currentStep].icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Pular
            </Button>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-4"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CurrentIcon className="w-8 h-8 text-primary" />
              </div>
              
              <DialogTitle className="text-2xl">
                {steps[currentStep].title}
              </DialogTitle>
              
              <DialogDescription className="text-base">
                {steps[currentStep].description}
              </DialogDescription>
              
              <p className="text-muted-foreground">
                {steps[currentStep].content}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              <>
                Começar
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
