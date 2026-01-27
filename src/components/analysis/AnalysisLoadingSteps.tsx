import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Zap, 
  Layout, 
  Target, 
  FileText,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface LoadingStep {
  icon: React.ElementType;
  message: string;
  completed: boolean;
}

interface AnalysisLoadingStepsProps {
  isLoading: boolean;
  onComplete?: () => void;
}

const AnalysisLoadingSteps = ({ isLoading, onComplete }: AnalysisLoadingStepsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const steps: LoadingStep[] = [
    { icon: Search, message: "Analisando SEO...", completed: currentStep > 0 },
    { icon: Zap, message: "Verificando Velocidade...", completed: currentStep > 1 },
    { icon: Layout, message: "Avaliando Estrutura...", completed: currentStep > 2 },
    { icon: Target, message: "Calculando Conversão...", completed: currentStep > 3 },
    { icon: FileText, message: "Gerando Relatório...", completed: currentStep > 4 },
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 5;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const CurrentIcon = steps[currentStep]?.icon || Search;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        {/* Main Icon Animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            key={currentStep}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
          >
            <CurrentIcon className="h-10 w-10 text-white" />
          </motion.div>
        </div>

        {/* Current Message */}
        <AnimatePresence mode="wait">
          <motion.h3
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-bold text-center text-foreground mb-6"
          >
            {steps[currentStep]?.message}
          </motion.h3>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-center text-muted-foreground">
            {Math.round(progress)}% concluído
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  isActive ? "bg-primary/10" : ""
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? "bg-green-500/20 text-green-500" 
                    : isActive 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-sm ${
                  isCompleted 
                    ? "text-green-500 line-through" 
                    : isActive 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                }`}>
                  {step.message}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalysisLoadingSteps;