import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Camera, User, Lightbulb } from "lucide-react";

interface PhotoAnalysisCardProps {
  photoUrl?: string;
  framing?: number;
  lighting?: number;
  background?: number;
  expression?: number;
  overallScore?: number;
  suggestions?: string[];
}

type StatusType = "good" | "warning" | "bad";

const getStatus = (value: number, max: number = 25): StatusType => {
  const percentage = (value / max) * 100;
  if (percentage >= 70) return "good";
  if (percentage >= 50) return "warning";
  return "bad";
};

const statusConfig = {
  good: { icon: "🟢", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  warning: { icon: "🟡", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  bad: { icon: "🔴", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const indicatorLabels = {
  framing: { label: "Enquadramento", goodMsg: "Rosto centralizado", warningMsg: "Ajustar enquadramento", badMsg: "Requer melhoria" },
  lighting: { label: "Iluminação", goodMsg: "Iluminação profissional", warningMsg: "Boa, mas pode melhorar", badMsg: "Precisa de mais luz" },
  background: { label: "Contraste/Fundo", goodMsg: "Fundo limpo e focado", warningMsg: "Fundo aceitável", badMsg: "Fundo distrativo" },
  expression: { label: "Expressão", goodMsg: "Transmite confiança", warningMsg: "Boa expressão", badMsg: "Expressão neutra" },
};

interface PhotoIndicatorProps {
  type: keyof typeof indicatorLabels;
  value: number;
  max?: number;
}

function PhotoIndicator({ type, value, max = 25 }: PhotoIndicatorProps) {
  const status = getStatus(value, max);
  const config = statusConfig[status];
  const labels = indicatorLabels[type];
  
  const getMessage = () => {
    if (status === "good") return labels.goodMsg;
    if (status === "warning") return labels.warningMsg;
    return labels.badMsg;
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bg} ${config.border} border`}>
      <span>{config.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-medium ${config.color}`}>{labels.label}</p>
        <p className="text-xs text-muted-foreground">{getMessage()}</p>
      </div>
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {value}/{max}
      </Badge>
    </div>
  );
}

export function PhotoAnalysisCard({
  photoUrl,
  framing = 0,
  lighting = 0,
  background = 0,
  expression = 0,
  overallScore,
  suggestions = [],
}: PhotoAnalysisCardProps) {
  const [photoError, setPhotoError] = useState(false);
  
  const calculatedScore = overallScore ?? Math.round(((framing + lighting + background + expression) / 100) * 100);
  const hasData = framing > 0 || lighting > 0 || background > 0 || expression > 0;

  // Always show the card if we have a photo URL or data
  if (!hasData && !photoUrl) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-cyan-400" />
          Diagnóstico da Foto de Perfil
          {hasData && (
            <Badge 
              variant="outline" 
              className={`ml-auto ${calculatedScore >= 70 ? 'border-green-500/50 text-green-300' : calculatedScore >= 50 ? 'border-yellow-500/50 text-yellow-300' : 'border-red-500/50 text-red-300'}`}
            >
              Score: {calculatedScore}/100
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Photo Preview */}
          <div className="flex-shrink-0">
            {photoUrl && !photoError ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={photoUrl}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full object-cover border-2 border-cyan-500/50"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/30">
                <User className="h-12 w-12 text-cyan-400" />
              </div>
            )}
          </div>

          {/* Indicators */}
          <div className="flex-1 space-y-2">
            {hasData ? (
              <>
                <PhotoIndicator type="framing" value={framing} />
                <PhotoIndicator type="lighting" value={lighting} />
                <PhotoIndicator type="background" value={background} />
                <PhotoIndicator type="expression" value={expression} />
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Faça upload da foto de perfil para análise detalhada</p>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-300 mb-1">Dica de melhoria:</p>
              <p className="text-xs text-amber-200/80">{suggestions[0]}</p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
