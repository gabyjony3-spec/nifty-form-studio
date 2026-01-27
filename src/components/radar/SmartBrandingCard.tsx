import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Palette, Type, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ColorPalette {
  primary: { hex: string; name: string };
  secondary: { hex: string; name: string };
  accent: { hex: string; name: string };
  explanation: string;
  fonts: { headline: string; body: string };
}

interface SmartBrandingCardProps {
  niche?: string;
  userName?: string;
}

// Psicologia das cores por nicho
const getNicheBranding = (niche: string): ColorPalette => {
  const nicheNormalized = niche?.toLowerCase() || "";
  
  // Negócios / Mentoria / Finanças / Elite
  if (
    nicheNormalized.includes("negócios") ||
    nicheNormalized.includes("negocios") ||
    nicheNormalized.includes("mentoria") ||
    nicheNormalized.includes("finanças") ||
    nicheNormalized.includes("financas") ||
    nicheNormalized.includes("investimento") ||
    nicheNormalized.includes("empreendedorismo") ||
    nicheNormalized.includes("coach") ||
    nicheNormalized.includes("elite") ||
    nicheNormalized.includes("consultoria") ||
    nicheNormalized.includes("liderança")
  ) {
    return {
      primary: { hex: "#1A237E", name: "Azul Marinho" },
      secondary: { hex: "#C5A059", name: "Dourado" },
      accent: { hex: "#F5F5F5", name: "Branco Neve" },
      explanation: "Cores que transmitem autoridade, confiança e alto valor. O Azul Marinho representa estabilidade e profissionalismo, enquanto o Dourado simboliza sucesso e exclusividade — perfeito para nichos de alta performance e mentoria de elite.",
      fonts: { headline: "Playfair Display", body: "Montserrat" }
    };
  }
  
  // Saúde / Bem-estar / Emagrecimento / Fitness
  if (
    nicheNormalized.includes("saúde") ||
    nicheNormalized.includes("saude") ||
    nicheNormalized.includes("bem-estar") ||
    nicheNormalized.includes("emagrecimento") ||
    nicheNormalized.includes("fitness") ||
    nicheNormalized.includes("nutrição") ||
    nicheNormalized.includes("nutricao") ||
    nicheNormalized.includes("dieta") ||
    nicheNormalized.includes("vida saudável") ||
    nicheNormalized.includes("bioweight")
  ) {
    return {
      primary: { hex: "#A5D6A7", name: "Verde Menta" },
      secondary: { hex: "#EEEEEE", name: "Cinza Suave" },
      accent: { hex: "#FFFFFF", name: "Branco Puro" },
      explanation: "Paleta que transmite frescor, saúde e renovação. O Verde Menta evoca natureza e vitalidade, enquanto os tons neutros passam limpeza e modernidade — ideal para profissionais de saúde e bem-estar que querem transmitir confiança e leveza.",
      fonts: { headline: "Montserrat", body: "Open Sans" }
    };
  }
  
  // Cultura / Educação / Idiomas / Criatividade
  if (
    nicheNormalized.includes("cultura") ||
    nicheNormalized.includes("educação") ||
    nicheNormalized.includes("educacao") ||
    nicheNormalized.includes("idioma") ||
    nicheNormalized.includes("língua") ||
    nicheNormalized.includes("lingua") ||
    nicheNormalized.includes("arte") ||
    nicheNormalized.includes("criativo") ||
    nicheNormalized.includes("professor") ||
    nicheNormalized.includes("ensino")
  ) {
    return {
      primary: { hex: "#E67E22", name: "Terracota" },
      secondary: { hex: "#F1C40F", name: "Amarelo Ouro" },
      accent: { hex: "#1A1A1A", name: "Preto Profundo" },
      explanation: "Cores vibrantes que remetem à cultura, criatividade e calor humano. O Terracota transmite autenticidade e conexão com raízes, enquanto o Amarelo Ouro traz energia e otimismo — perfeito para educadores e profissionais da cultura.",
      fonts: { headline: "Open Sans", body: "Roboto" }
    };
  }
  
  // Tecnologia / Digital / Marketing
  if (
    nicheNormalized.includes("tecnologia") ||
    nicheNormalized.includes("tech") ||
    nicheNormalized.includes("digital") ||
    nicheNormalized.includes("marketing") ||
    nicheNormalized.includes("startup") ||
    nicheNormalized.includes("programação") ||
    nicheNormalized.includes("programacao") ||
    nicheNormalized.includes("desenvolvedor") ||
    nicheNormalized.includes("tráfego")
  ) {
    return {
      primary: { hex: "#6C63FF", name: "Roxo Digital" },
      secondary: { hex: "#00D9FF", name: "Ciano Elétrico" },
      accent: { hex: "#0D0D0D", name: "Preto Tech" },
      explanation: "Paleta moderna e futurista que transmite inovação e criatividade. O Roxo Digital representa originalidade e visão, enquanto o Ciano Elétrico traz energia e modernidade — ideal para profissionais de tecnologia e marketing digital.",
      fonts: { headline: "Inter", body: "Roboto" }
    };
  }
  
  // Moda / Beleza / Lifestyle
  if (
    nicheNormalized.includes("moda") ||
    nicheNormalized.includes("beleza") ||
    nicheNormalized.includes("estética") ||
    nicheNormalized.includes("estetica") ||
    nicheNormalized.includes("lifestyle") ||
    nicheNormalized.includes("estilo") ||
    nicheNormalized.includes("fashion") ||
    nicheNormalized.includes("makeup") ||
    nicheNormalized.includes("maquiagem")
  ) {
    return {
      primary: { hex: "#D4A5A5", name: "Rosa Nude" },
      secondary: { hex: "#2C2C2C", name: "Carvão Elegante" },
      accent: { hex: "#FFD700", name: "Dourado Luxo" },
      explanation: "Cores sofisticadas que transmitem elegância e feminilidade. O Rosa Nude é atemporal e chique, enquanto o Carvão traz seriedade e o Dourado adiciona luxo — perfeito para profissionais de moda e beleza.",
      fonts: { headline: "Playfair Display", body: "Lato" }
    };
  }
  
  // Esportes / Performance
  if (
    nicheNormalized.includes("esporte") ||
    nicheNormalized.includes("sport") ||
    nicheNormalized.includes("atleta") ||
    nicheNormalized.includes("performance") ||
    nicheNormalized.includes("treino") ||
    nicheNormalized.includes("academia") ||
    nicheNormalized.includes("crossfit")
  ) {
    return {
      primary: { hex: "#FF4757", name: "Vermelho Energia" },
      secondary: { hex: "#1E1E1E", name: "Preto Power" },
      accent: { hex: "#FFC312", name: "Amarelo Vencedor" },
      explanation: "Cores que transmitem energia, força e determinação. O Vermelho desperta ação e paixão, o Preto representa poder, e o Amarelo simboliza vitória — ideal para atletas e profissionais de alta performance.",
      fonts: { headline: "Oswald", body: "Roboto" }
    };
  }
  
  // Fallback - Marketing Digital genérico
  return {
    primary: { hex: "#6C63FF", name: "Roxo Criativo" },
    secondary: { hex: "#00D9FF", name: "Ciano Inovador" },
    accent: { hex: "#FFD93D", name: "Amarelo Destaque" },
    explanation: "Paleta versátil que transmite criatividade e confiança. O Roxo representa inovação e originalidade, o Ciano traz modernidade, e o Amarelo captura atenção — perfeito para empreendedores digitais.",
    fonts: { headline: "Poppins", body: "Inter" }
  };
};

export function SmartBrandingCard({ niche, userName }: SmartBrandingCardProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const branding = getNicheBranding(niche || "");

  const copyToClipboard = (hex: string, name: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`${name} (${hex}) copiado!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colors = [
    { ...branding.primary, label: "Primária" },
    { ...branding.secondary, label: "Secundária" },
    { ...branding.accent, label: "Acento" }
  ];

  return (
    <Card className="glass-card border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          Identidade Visual Sugerida
          {niche && (
            <Badge variant="outline" className="ml-auto border-amber-500/50 text-amber-300 text-xs">
              {niche}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Palette */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-200">Paleta de Cores Estratégica</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {colors.map((color, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                className="group cursor-pointer"
                onClick={() => copyToClipboard(color.hex, color.name)}
              >
                <div className="relative">
                  <div 
                    className="w-full h-20 rounded-xl shadow-lg border-2 border-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                    style={{ backgroundColor: color.hex }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {copiedColor === color.hex ? (
                        <Check className="h-6 w-6 text-white drop-shadow-lg" />
                      ) : (
                        <Copy className="h-5 w-5 text-white drop-shadow-lg" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{color.label}</p>
                    <p className="text-sm font-semibold text-white">{color.name}</p>
                    <p className="text-xs text-amber-300/80">{color.hex}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
        >
          <p className="text-sm text-amber-100/90 leading-relaxed">
            💡 <strong>Por que estas cores?</strong> {branding.explanation}
          </p>
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-200">Tipografia Recomendada</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/10 border border-muted/20">
              <p className="text-xs text-muted-foreground mb-2">Para Títulos</p>
              <p 
                className="text-2xl font-bold text-white"
                style={{ fontFamily: `'${branding.fonts.headline}', sans-serif` }}
              >
                {branding.fonts.headline}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/10 border border-muted/20">
              <p className="text-xs text-muted-foreground mb-2">Para Texto</p>
              <p 
                className="text-lg text-white"
                style={{ fontFamily: `'${branding.fonts.body}', sans-serif` }}
              >
                {branding.fonts.body}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Preview with user name */}
        {userName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-amber-200">Preview do Seu Nome</p>
            <div 
              className="p-6 rounded-xl border border-amber-500/30 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${branding.primary.hex}15, ${branding.secondary.hex}15)`
              }}
            >
              <p 
                className="text-3xl font-bold mb-1"
                style={{ 
                  fontFamily: `'${branding.fonts.headline}', serif`,
                  color: branding.primary.hex 
                }}
              >
                {userName}
              </p>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: `'${branding.fonts.body}', sans-serif`,
                  color: branding.secondary.hex 
                }}
              >
                {niche || "Marketing Digital"}
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
