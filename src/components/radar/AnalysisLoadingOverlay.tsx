import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, TrendingUp, Image, Target, Brain, CheckCircle } from "lucide-react";

interface LoadingStep {
  icon: typeof Scan;
  message: string;
  subMessage: string;
  completed: boolean;
}

interface AnalysisLoadingOverlayProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export function AnalysisLoadingOverlay({ isLoading, onComplete }: AnalysisLoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: LoadingStep[] = [
    { 
      icon: Scan, 
      message: "Escaneando Biometria...", 
      subMessage: "Analisando foto de perfil e identidade visual",
      completed: currentStep > 0 
    },
    { 
      icon: TrendingUp, 
      message: "Analisando Engajamento...", 
      subMessage: "Calculando métricas de performance",
      completed: currentStep > 1 
    },
    { 
      icon: Image, 
      message: "Avaliando Autoridade Visual...", 
      subMessage: "Verificando consistência de branding",
      completed: currentStep > 2 
    },
    { 
      icon: Brain, 
      message: "Gerando Plano de Ação...", 
      subMessage: "Criando estratégias personalizadas",
      completed: currentStep > 3 
    },
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const stepDuration = 3000; // 3 seconds per step
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          onComplete?.();
          return 100;
        }
        return newProgress;
      });
    }, (stepDuration * steps.length) / 100);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isLoading, onComplete, steps.length]);

  if (!isLoading) return null;

  const CurrentIcon = steps[currentStep]?.icon || Brain;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
    >
      <div className="w-full max-w-lg p-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-8 space-y-8"
        >
          {/* Animated Icon */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <CurrentIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
                </div>
                {/* Orbiting dots */}
                <motion.div
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-cyan-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "calc(100% + 36px) calc(100% + 36px)" }}
                />
                <motion.div
                  className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-blue-400"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "calc(100% + 42px) calc(100% + 42px)" }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Current Step Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-center space-y-2"
            >
              <h3 className="text-xl font-bold text-white">
                {steps[currentStep]?.message}
              </h3>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep]?.subMessage}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {progress}% concluído
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
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive 
                      ? "bg-cyan-500/10 border border-cyan-500/30" 
                      : isCompleted 
                        ? "bg-green-500/10 border border-green-500/30" 
                        : "bg-muted/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive 
                      ? "bg-cyan-500/20 text-cyan-400" 
                      : isCompleted 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-muted/20 text-muted-foreground"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <StepIcon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive 
                      ? "text-cyan-400" 
                      : isCompleted 
                        ? "text-green-400" 
                        : "text-muted-foreground"
                  }`}>
                    {step.message.replace("...", "")}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}