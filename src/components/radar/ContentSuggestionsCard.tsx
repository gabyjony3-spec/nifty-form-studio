import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Video, 
  Images, 
  Camera, 
  ArrowRight,
  Calendar,
  Sparkles
} from "lucide-react";

interface ContentSuggestion {
  type: string;
  description: string;
  frequency: string;
  icon?: string;
}

interface ContentSuggestionsCardProps {
  suggestions: ContentSuggestion[];
  niche?: string;
  onGenerateCalendar?: () => void;
}

const getIconForType = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("reel") || typeLower.includes("video")) return Video;
  if (typeLower.includes("carrossel") || typeLower.includes("carousel")) return Images;
  if (typeLower.includes("foto") || typeLower.includes("image")) return Camera;
  return Lightbulb;
};

export function ContentSuggestionsCard({ 
  suggestions, 
  niche,
  onGenerateCalendar 
}: ContentSuggestionsCardProps) {
  // Default suggestions if none provided
  const defaultSuggestions: ContentSuggestion[] = [
    {
      type: "Reels de FAQ",
      description: "Responda as 3 perguntas mais comuns do seu nicho em formato dinâmico",
      frequency: "2x por semana"
    },
    {
      type: "Carrossel Tutorial",
      description: "Ensine um conceito importante em 5-7 slides visuais e educativos",
      frequency: "1x por semana"
    },
    {
      type: "Foto Estilo de Vida",
      description: "Mostre bastidores e momentos autênticos do seu dia como mentor",
      frequency: "3x por semana"
    }
  ];

  const displaySuggestions = suggestions?.length > 0 ? suggestions : defaultSuggestions;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lightbulb className="h-5 w-5" />
            Tipos de Conteúdo para {niche || "o seu Nicho"}
          </div>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
            IA Recomenda
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySuggestions.map((suggestion, index) => {
          const Icon = getIconForType(suggestion.type);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-white">{suggestion.type}</h4>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {suggestion.frequency}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Generate Calendar CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <Button 
            onClick={onGenerateCalendar}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar Plano de 30 Dias
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}