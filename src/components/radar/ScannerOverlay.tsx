import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, TrendingUp, Image, Target, Brain, CheckCircle, Sparkles } from "lucide-react";

interface LoadingStep {
  icon: typeof Scan;
  message: string;
  subMessage: string;
  completed: boolean;
}

interface ScannerOverlayProps {
  isLoading: boolean;
  onComplete?: () => void;
  profileImageUrl?: string;
}

export function ScannerOverlay({ isLoading, onComplete, profileImageUrl }: ScannerOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanLinePosition, setScanLinePosition] = useState(0);

  const steps: LoadingStep[] = [
    { 
      icon: Scan, 
      message: "A escanear biometria do perfil...", 
      subMessage: "Analisando foto de perfil e identidade visual",
      completed: currentStep > 0 
    },
    { 
      icon: TrendingUp, 
      message: "A calcular Score de Autoridade...", 
      subMessage: "Aplicando fórmula: Engajamento × 10 + Frequência × 5",
      completed: currentStep > 1 
    },
    { 
      icon: Image, 
      message: "A avaliar presença visual...", 
      subMessage: "Verificando consistência de branding",
      completed: currentStep > 2 
    },
    { 
      icon: Brain, 
      message: "A gerar Plano de Guerra...", 
      subMessage: "Criando estratégias personalizadas",
      completed: currentStep > 3 
    },
  ];

  // Scan line animation
  useEffect(() => {
    if (!isLoading) return;
    
    const scanInterval = setInterval(() => {
      setScanLinePosition(prev => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(scanInterval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      setProgress(0);
      setScanLinePosition(0);
      return;
    }

    const stepDuration = 3000;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-lg"
    >
      {/* Golden particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/60"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg p-8 relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-8 space-y-8 border border-amber-500/20 shadow-2xl shadow-amber-500/10"
        >
          {/* Profile Scanner Visual */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Profile image container with scan effect */}
              <div className="w-32 h-32 rounded-full overflow-hidden relative bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border-2 border-amber-500/30">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CurrentIcon className="w-12 h-12 text-amber-400" />
                  </div>
                )}
                
                {/* Golden scan line */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                  style={{ 
                    top: `${scanLinePosition}%`,
                    boxShadow: '0 0 20px 5px rgba(251, 191, 36, 0.5)'
                  }}
                />
                
                {/* Scan glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-amber-400/0 via-amber-400/20 to-amber-400/0"
                  style={{ 
                    top: `${scanLinePosition - 20}%`,
                    height: '40%'
                  }}
                />
              </div>
              
              {/* Orbiting golden dots */}
              <motion.div
                className="absolute -inset-4 rounded-full border-2 border-amber-500/30 border-dashed"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              
              <motion.div
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ boxShadow: '0 0 15px 5px rgba(251, 191, 36, 0.4)' }}
              />
              
              <motion.div
                className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-cyan-400"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                style={{ boxShadow: '0 0 15px 5px rgba(6, 182, 212, 0.4)' }}
              />
            </div>
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
              <h3 className="text-xl font-bold text-amber-300">
                {steps[currentStep]?.message}
              </h3>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep]?.subMessage}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Golden Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-amber-500/20">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{ boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}
              />
            </div>
            <p className="text-xs text-amber-400/80 text-center font-medium">
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
                      ? "bg-amber-500/10 border border-amber-500/30" 
                      : isCompleted 
                        ? "bg-green-500/10 border border-green-500/30" 
                        : "bg-muted/10 border border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive 
                      ? "bg-amber-500/20 text-amber-400" 
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
                      ? "text-amber-400" 
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

          {/* Sparkles decoration */}
          <div className="flex justify-center">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
