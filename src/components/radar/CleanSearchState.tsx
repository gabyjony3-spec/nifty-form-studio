import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Radar, Sparkles, Search, Instagram, Youtube, Linkedin, ArrowRight } from "lucide-react";

interface CleanSearchStateProps {
  targetUrl: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export function CleanSearchState({
  targetUrl,
  onUrlChange,
  onAnalyze,
  isAnalyzing,
}: CleanSearchStateProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="text-center space-y-8">
          {/* Glowing Radar Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Golden glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Radar className="w-14 h-14 text-amber-400" />
              </div>
              
              {/* Orbiting ring */}
              <motion.div
                className="absolute -inset-4 border-2 border-amber-500/20 rounded-full border-dashed"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Glowing dots */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [1, 0.6, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)' }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                Auditoria Real
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Insira o link para iniciar a <span className="text-amber-400 font-semibold">Auditoria Real</span>
            </p>
          </motion.div>

          {/* Search Input with Golden Glow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="relative">
              {/* Golden glow behind input */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-cyan-500/20 rounded-xl blur-lg opacity-60" />
              
              <div className="relative flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input
                    placeholder="Cole o link do perfil ou @username..."
                    value={targetUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    className="h-14 text-base bg-background/90 border-2 border-amber-500/30 focus:border-amber-400 pr-12 rounded-xl shadow-lg shadow-amber-500/10"
                    onKeyDown={(e) => e.key === "Enter" && onAnalyze()}
                  />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                </div>
                <Button
                  onClick={onAnalyze}
                  disabled={isAnalyzing || !targetUrl.trim()}
                  className="h-14 px-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 text-black font-bold text-base rounded-xl shadow-lg shadow-amber-500/30"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="h-5 w-5 animate-spin mr-2" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Iniciar Auditoria
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Supported Platforms */}
            <div className="flex items-center justify-center gap-4 text-muted-foreground pt-2">
              <span className="text-xs">Plataformas suportadas:</span>
              <div className="flex items-center gap-4">
                <Instagram className="w-5 h-5 hover:text-pink-400 transition-colors cursor-pointer" />
                <Youtube className="w-5 h-5 hover:text-red-400 transition-colors cursor-pointer" />
                <Linkedin className="w-5 h-5 hover:text-blue-400 transition-colors cursor-pointer" />
                <svg className="w-5 h-5 hover:text-white transition-colors cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Features Grid - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-6 pt-8"
          >
            {[
              { icon: Radar, label: "Score Real", color: "text-amber-400" },
              { icon: Sparkles, label: "Plano de Ação", color: "text-cyan-400" },
              { icon: Search, label: "Dados Reais", color: "text-green-400" },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl bg-muted/20 border border-muted/30 flex items-center justify-center mx-auto ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
