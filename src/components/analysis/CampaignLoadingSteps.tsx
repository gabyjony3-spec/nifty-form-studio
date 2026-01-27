import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, Target, Users, FileText, Rocket } from "lucide-react";

interface LoadingStep {
  icon: React.ElementType;
  message: string;
  completed: boolean;
}

interface CampaignLoadingStepsProps {
  isLoading: boolean;
  onComplete?: () => void;
}

const CampaignLoadingSteps = ({ isLoading, onComplete }: CampaignLoadingStepsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: LoadingStep[] = [
    { icon: Sparkles, message: "A extrair proposta de valor do site...", completed: currentStep > 0 },
    { icon: Target, message: "A analisar público-alvo ideal...", completed: currentStep > 1 },
    { icon: FileText, message: "A gerar cópias de anúncios (AIDA)...", completed: currentStep > 2 },
    { icon: Users, message: "A definir segmentação de audiência...", completed: currentStep > 3 },
    { icon: Rocket, message: "A finalizar campanha...", completed: currentStep > 4 },
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + Math.random() * 3;
        }
        return prev;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="max-w-md w-full mx-4 space-y-8">
        {/* Main Icon Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 360] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center glow-neon">
              <Rocket className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
        </motion.div>

        {/* Current Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h3 className="text-xl font-semibold text-foreground mb-2">
              A Gerar Campanha IA
            </h3>
            <p className="text-primary font-medium">
              {steps[currentStep]?.message}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% concluído
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/30"
                    : isCompleted
                    ? "bg-muted/50"
                    : "opacity-50"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-500"
                      : isActive
                      ? "bg-primary animate-pulse"
                      : "bg-muted"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isActive
                      ? "text-foreground font-medium"
                      : isCompleted
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.message}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignLoadingSteps;
