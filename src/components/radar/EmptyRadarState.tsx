import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Radar, Sparkles, Search, Instagram, Youtube, Linkedin, ArrowRight, Camera, Upload } from "lucide-react";
import { ProfileImageUpload } from "./ProfileImageUpload";

interface PhotoAnalysisResult {
  photo_score: number;
  verdict: "Transmite Autoridade" | "Requer Melhoria";
  breakdown: {
    framing: { score: number; feedback: string };
    background: { score: number; feedback: string };
    lighting: { score: number; feedback: string };
    expression: { score: number; feedback: string };
  };
  improvements: string[];
  is_professional: boolean;
}

interface EmptyRadarStateProps {
  targetUrl: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onImageAnalyzed?: (result: PhotoAnalysisResult, imageBase64: string) => void;
}

export function EmptyRadarState({
  targetUrl,
  onUrlChange,
  onAnalyze,
  isAnalyzing,
  onImageAnalyzed,
}: EmptyRadarStateProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageAnalyzed = (result: PhotoAnalysisResult, imageBase64: string) => {
    setShowImageUpload(false);
    if (onImageAnalyzed) {
      onImageAnalyzed(result, imageBase64);
    }
  };
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-card overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <CardContent className="p-8 md:p-12 relative">
            <div className="text-center space-y-6">
              {/* Animated Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Radar className="w-12 h-12 text-cyan-400" />
                  </div>
                  <motion.div
                    className="absolute -inset-4 border-2 border-cyan-500/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Bem-vindo ao AI INsight
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Insira o seu primeiro link de perfil para ativar o <span className="text-cyan-400 font-semibold">Radar de Nicho</span> e descobrir como otimizar a sua presença digital.
                </p>
              </motion.div>

              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Cole o link do seu perfil ou @username..."
                      value={targetUrl}
                      onChange={(e) => onUrlChange(e.target.value)}
                      className="bg-cyan-950/20 border-cyan-800/50 pr-10 h-12 text-base"
                    />
                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-600" />
                  </div>
                  <Button
                    onClick={onAnalyze}
                    disabled={isAnalyzing || !targetUrl.trim()}
                    className="h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 glow-button"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="h-5 w-5 animate-spin mr-2" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Analisar Perfil
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Image Upload Option */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted/50 to-transparent" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-muted/50 to-transparent" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <ProfileImageUpload
                    onImageAnalyzed={handleImageAnalyzed}
                    isOpen={showImageUpload}
                    onOpenChange={setShowImageUpload}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 border-cyan-700/50 hover:bg-cyan-950/30"
                    onClick={() => setShowImageUpload(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Upload de Screenshot
                  </Button>
                </div>

                {/* Supported Platforms */}
                <div className="flex items-center justify-center gap-4 text-muted-foreground pt-2">
                  <span className="text-xs">Plataformas suportadas:</span>
                  <div className="flex items-center gap-3">
                    <Instagram className="w-5 h-5 hover:text-pink-400 transition-colors" />
                    <Youtube className="w-5 h-5 hover:text-red-400 transition-colors" />
                    <Linkedin className="w-5 h-5 hover:text-blue-400 transition-colors" />
                    <svg className="w-5 h-5 hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <svg className="w-5 h-5 hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Features Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 pt-6 border-t border-muted/20"
              >
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                    <Radar className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">Profile Score</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">Plano de Ação</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">Nicho Detectado</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}