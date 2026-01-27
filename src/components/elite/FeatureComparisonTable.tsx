import { Check, X, Crown, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    category: "Análises",
    items: [
      { name: "Análises de Perfil", starter: "1/mês", pro: "Ilimitado", elite: "Ilimitado + IA Avançada" },
      { name: "Redes Sociais", starter: "Instagram", pro: "IG, FB, YT", elite: "Todas + TikTok, LinkedIn" },
      { name: "Análise de Foto com IA", starter: false, pro: true, elite: true },
      { name: "Análise de Sentimento", starter: false, pro: false, elite: true },
    ]
  },
  {
    category: "Conteúdo",
    items: [
      { name: "Calendário de Conteúdo", starter: false, pro: "Semanal", elite: "90 dias preditivo" },
      { name: "Gerador de Legendas IA", starter: "10/mês", pro: "Ilimitado", elite: "Premium + Roteiros" },
      { name: "Gerador de Imagens IA", starter: false, pro: "50/mês", elite: "Ilimitado" },
      { name: "Gerador de Anúncios", starter: false, pro: false, elite: true },
    ]
  },
  {
    category: "Espionagem",
    items: [
      { name: "Espião de Concorrentes", starter: false, pro: "3 perfis", elite: "Ilimitado + Alertas" },
      { name: "Comparativo de Performance", starter: false, pro: true, elite: true },
      { name: "Alertas de Mudanças", starter: false, pro: false, elite: true },
    ]
  },
  {
    category: "Automação",
    items: [
      { name: "Automação WhatsApp", starter: false, pro: "100 msgs/mês", elite: "Ilimitado" },
      { name: "Sequências Automatizadas", starter: false, pro: "3", elite: "Ilimitado" },
      { name: "Integração Meta Ads", starter: false, pro: false, elite: true },
    ]
  },
  {
    category: "Suporte",
    items: [
      { name: "Suporte", starter: "Email", pro: "Prioritário", elite: "WhatsApp VIP" },
      { name: "Consultoria 1:1", starter: false, pro: false, elite: "Mensal" },
      { name: "Acesso Antecipado", starter: false, pro: false, elite: true },
    ]
  }
];

const renderValue = (value: boolean | string) => {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-400" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-muted-foreground/50" />;
  }
  return <span className="text-sm">{value}</span>;
};

export function FeatureComparisonTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 border-b border-border/50"></th>
            <th className="p-4 border-b border-border/50 min-w-[120px]">
              <div className="flex flex-col items-center gap-2">
                <Zap className="h-6 w-6 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">Starter</span>
                <span className="text-sm text-muted-foreground">Grátis</span>
              </div>
            </th>
            <th className="p-4 border-b border-border/50 min-w-[120px]">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="h-6 w-6 text-cyan-400" />
                <span className="font-semibold text-cyan-400">Pro</span>
                <span className="text-sm text-muted-foreground">€47/mês</span>
              </div>
            </th>
            <th className="p-4 border-b border-amber-500/30 min-w-[140px] bg-gradient-to-b from-amber-500/10 to-transparent rounded-t-lg">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="h-6 w-6 text-amber-400" />
                </motion.div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">Elite</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    Popular
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">€97/mês</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((category, categoryIndex) => (
            <>
              <tr key={`cat-${categoryIndex}`}>
                <td 
                  colSpan={4} 
                  className="p-3 bg-muted/20 font-semibold text-sm text-muted-foreground uppercase tracking-wider"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <motion.tr 
                  key={`${categoryIndex}-${itemIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: itemIndex * 0.05 }}
                  viewport={{ once: true }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                >
                  <td className="p-4 text-sm">{item.name}</td>
                  <td className="p-4 text-center">{renderValue(item.starter)}</td>
                  <td className="p-4 text-center">{renderValue(item.pro)}</td>
                  <td className="p-4 text-center bg-amber-500/5 font-medium text-amber-100">
                    {renderValue(item.elite)}
                  </td>
                </motion.tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
