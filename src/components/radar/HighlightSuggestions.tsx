import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Bookmark, Star, Sparkles } from "lucide-react";

interface HighlightSuggestionsProps {
  niche?: string;
  customHighlights?: string[];
}

const NICHE_HIGHLIGHTS: Record<string, { highlights: string[]; icons: string[] }> = {
  "Mentoria de Negócios": {
    highlights: ["Resultados", "O Método", "Clientes", "Eventos", "Comece Aqui"],
    icons: ["📊", "🎯", "⭐", "🎤", "👋"]
  },
  "Marketing Digital": {
    highlights: ["Cases", "Estratégias", "Ferramentas", "Depoimentos", "Contato"],
    icons: ["🚀", "📈", "🛠️", "💬", "📞"]
  },
  "Coaching Pessoal": {
    highlights: ["Transformações", "Método", "Sobre Mim", "Dicas", "Agendar"],
    icons: ["✨", "🧠", "👤", "💡", "📅"]
  },
  "Estilo de Vida": {
    highlights: ["Rotina", "Antes/Depois", "Suplementos", "Treinos", "Dúvidas"],
    icons: ["🌅", "📸", "💊", "💪", "❓"]
  },
  "Saúde e Bem-Estar": {
    highlights: ["Rotina", "Antes/Depois", "Suplementos", "Treinos", "Dúvidas"],
    icons: ["🌅", "📸", "💊", "💪", "❓"]
  },
  "Estética e Beleza": {
    highlights: ["Tratamentos", "Antes/Depois", "Promoções", "Agenda", "FAQ"],
    icons: ["💅", "📸", "🎁", "📆", "❓"]
  },
  "Finanças Pessoais": {
    highlights: ["Investimentos", "Dicas", "Resultados", "Ferramentas", "Mentoria"],
    icons: ["💰", "💡", "📊", "🛠️", "🎓"]
  },
  "Educação": {
    highlights: ["Cursos", "Alunos", "Metodologia", "Depoimentos", "Inscrição"],
    icons: ["📚", "👥", "🎯", "⭐", "✍️"]
  }
};

const DEFAULT_HIGHLIGHTS = {
  highlights: ["Comece Aqui", "Sobre Mim", "Serviços", "Depoimentos", "Contato"],
  icons: ["👋", "👤", "🎯", "⭐", "📞"]
};

export function HighlightSuggestions({ niche, customHighlights }: HighlightSuggestionsProps) {
  // Get highlights for the detected niche or use custom/default
  const getNicheHighlights = () => {
    if (customHighlights && customHighlights.length > 0) {
      return { highlights: customHighlights, icons: customHighlights.map(() => "📌") };
    }
    
    if (!niche) return DEFAULT_HIGHLIGHTS;
    
    // Try to find a matching niche
    const nicheKey = Object.keys(NICHE_HIGHLIGHTS).find(
      key => niche.toLowerCase().includes(key.toLowerCase()) ||
             key.toLowerCase().includes(niche.toLowerCase())
    );
    
    return nicheKey ? NICHE_HIGHLIGHTS[nicheKey] : DEFAULT_HIGHLIGHTS;
  };

  const { highlights, icons } = getNicheHighlights();

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Bookmark className="h-5 w-5" />
            Destaques Essenciais
          </div>
          {niche && (
            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
              {niche}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Organize os seus destaques do Instagram com estas categorias otimizadas para o seu nicho:
        </p>
        
        <div className="flex flex-wrap gap-3">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                {icons[index]}
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center max-w-[70px]">
                {highlight}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-cyan-400">Dica da IA:</strong> Mantenha cada destaque com 5-10 stories. 
              Atualize o destaque "Comece Aqui" mensalmente com seu conteúdo mais recente.
            </p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}