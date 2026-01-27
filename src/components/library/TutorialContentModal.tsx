import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ExternalLink, Play, FileText, CheckCircle2 } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: "article" | "video";
  difficulty: "fácil" | "médio" | "avançado";
}

interface TutorialContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorial: Tutorial | null;
}

const tutorialContents: Record<string, { content: string; steps: string[] }> = {
  "seo-1": {
    content: `Os metadados são a primeira impressão que o Google tem do seu site. Títulos e meta descriptions mal otimizados resultam em menor taxa de cliques nos resultados de pesquisa.

**Problemas Comuns:**
- Títulos duplicados ou genéricos
- Meta descriptions ausentes ou muito longas
- Datas de publicação futuras ou incorretas

**Impacto:** Sites com metadados otimizados têm até 30% mais cliques nos resultados do Google.`,
    steps: [
      "Verifique se cada página tem um título único com menos de 60 caracteres",
      "Adicione meta descriptions entre 150-160 caracteres com a palavra-chave principal",
      "Corrija as tags datePublished para refletir a data real de criação",
      "Use o formato ISO 8601 para datas: YYYY-MM-DD",
      "Teste as alterações no Google Search Console"
    ]
  },
  "seo-2": {
    content: `URLs amigáveis ajudam tanto os utilizadores quanto os motores de busca a entender o conteúdo da página antes de a visitarem.

**Boas Práticas:**
- Use palavras-chave relevantes na URL
- Mantenha URLs curtas e descritivas
- Use hífens para separar palavras

**Exemplo:**
❌ site.com/p?id=12345
✅ site.com/servicos/marketing-digital`,
    steps: [
      "Identifique páginas com URLs confusas ou com parâmetros",
      "Crie URLs descritivas com 3-5 palavras-chave",
      "Configure redirects 301 das URLs antigas para as novas",
      "Atualize links internos para as novas URLs",
      "Submeta o novo sitemap ao Google Search Console"
    ]
  },
  "seo-3": {
    content: `O Schema.org ajuda o Google a entender o contexto do seu conteúdo. Sem dados estruturados, perde visibilidade nos rich snippets.

**Tipos de Schema Recomendados:**
- **Organization**: Para a página principal da empresa
- **LocalBusiness**: Para negócios locais
- **Article/NewsArticle**: Para blogs e notícias
- **Product**: Para lojas online
- **FAQ**: Para páginas de perguntas frequentes

**Impacto:** Rich snippets podem aumentar o CTR em até 35%.`,
    steps: [
      "Identifique o tipo de Schema mais adequado ao seu conteúdo",
      "Use o Schema Markup Generator do Google",
      "Adicione as tags NewsArticle e Author para artigos",
      "Valide o código com o Rich Results Test do Google",
      "Monitore os resultados no Search Console"
    ]
  },
  "perf-1": {
    content: `Imagens pesadas são a principal causa de sites lentos. O formato WebP oferece compressão até 30% melhor que JPEG mantendo a qualidade.

**Ferramentas Recomendadas:**
- Squoosh.app (online, gratuito)
- TinyPNG (online, até 20 imagens grátis)
- ImageOptim (Mac)
- RIOT (Windows)

**Tamanhos Ideais:**
- Hero images: máx 200KB
- Thumbnails: máx 50KB
- Ícones: máx 10KB`,
    steps: [
      "Identifique as imagens mais pesadas do site (use GTmetrix ou PageSpeed)",
      "Converta imagens JPEG/PNG para WebP",
      "Reduza dimensões para o tamanho real de exibição",
      "Implemente srcset para imagens responsivas",
      "Use loading='lazy' para imagens abaixo do fold"
    ]
  },
  "perf-2": {
    content: `O cache do navegador permite que recursos estáticos sejam armazenados localmente, reduzindo drasticamente o tempo de carregamento em visitas subsequentes.

**Headers de Cache:**
\`\`\`
Cache-Control: max-age=31536000
\`\`\`

**Recursos que devem ter cache longo:**
- Imagens, CSS, JavaScript (com hash no nome)
- Fontes web
- Ícones e logos`,
    steps: [
      "Configure cache-control headers no servidor ou CDN",
      "Use max-age de 1 ano para recursos estáticos com versionamento",
      "Implemente ETags para validação de cache",
      "Configure cache diferenciado para HTML (max-age curto ou no-cache)",
      "Teste com Chrome DevTools → Network → Disable cache desativado"
    ]
  },
  "perf-3": {
    content: `Lazy loading adia o carregamento de imagens até que estejam prestes a entrar na viewport, economizando banda e acelerando o carregamento inicial.

**Implementação Nativa:**
\`\`\`html
<img src="foto.jpg" loading="lazy" alt="Descrição">
\`\`\`

**Suporte:** Todos os navegadores modernos (Chrome, Firefox, Edge, Safari).`,
    steps: [
      "Adicione loading='lazy' a todas as imagens abaixo do fold",
      "NÃO use lazy loading na imagem hero ou LCP",
      "Defina width e height para evitar layout shift",
      "Considere placeholder blur enquanto carrega",
      "Teste com Lighthouse para confirmar melhorias"
    ]
  },
  "conv-1": {
    content: `A posição dos CTAs (Call to Action) influencia diretamente a taxa de conversão. CTAs bem posicionados podem aumentar conversões em até 200%.

**Posições de Alto Impacto:**
- Hero section (acima do fold)
- Após descrição de benefícios
- Dentro de testimonials
- Footer fixo em mobile

**Cores:** Use cores contrastantes que se destaquem do resto da página.`,
    steps: [
      "Coloque o CTA principal visível sem scroll (above the fold)",
      "Repita o CTA a cada 2-3 secções de conteúdo",
      "Use verbos de ação: 'Começar Agora', 'Quero Experimentar'",
      "Garanta contraste mínimo de 4.5:1 com o fundo",
      "Teste diferentes posições com A/B testing"
    ]
  },
  "conv-2": {
    content: `Formulários complexos são a principal causa de abandono. Cada campo adicional reduz a conversão em aproximadamente 10%.

**Regras de Ouro:**
- Máximo 3-5 campos essenciais
- Labels claros acima dos campos
- Validação em tempo real
- Mensagens de erro específicas

**Campos Essenciais:** Nome, Email, Telefone (se necessário)`,
    steps: [
      "Reduza campos ao mínimo necessário",
      "Use autocomplete para acelerar preenchimento",
      "Implemente validação inline com feedback visual",
      "Adicione indicadores de progresso em formulários longos",
      "Teste em mobile - botões de 48px mínimo"
    ]
  },
  "conv-3": {
    content: `A/B Testing permite comparar duas versões de uma página para descobrir qual converte melhor, eliminando suposições.

**Ferramentas Gratuitas:**
- Google Optimize (descontinuado, mas alternativas existem)
- VWO (versão gratuita limitada)
- Optimizely

**O Que Testar:**
- Headlines e copy
- Cores e posição de CTAs
- Imagens e layouts
- Formulários`,
    steps: [
      "Defina uma hipótese clara: 'Se mudarmos X, Y vai melhorar'",
      "Crie apenas UMA variação por teste",
      "Espere ter pelo menos 100 conversões por variante",
      "Use significância estatística de 95%",
      "Documente todos os testes e resultados"
    ]
  },
  "struct-1": {
    content: `A hierarquia de headings comunica a estrutura do conteúdo aos motores de busca e leitores de ecrã.

**Regras Fundamentais:**
- Apenas UM H1 por página
- H2-H6 em ordem sequencial (sem saltar níveis)
- Headings descritivos e com palavras-chave

**Erro Comum:** Usar headings apenas por tamanho visual, sem considerar hierarquia semântica.`,
    steps: [
      "Verifique se existe apenas um H1 por página",
      "Organize conteúdo em secções com H2",
      "Use H3-H6 para subsecções",
      "Nunca salte níveis (H2 → H4 está errado)",
      "Valide com ferramentas como HeadingsMap extension"
    ]
  },
  "struct-2": {
    content: `Uma navegação eficiente permite que utilizadores encontrem o que procuram em 3 cliques ou menos.

**Boas Práticas:**
- Menu principal com 5-7 itens no máximo
- Breadcrumbs para orientação
- Pesquisa visível em sites grandes
- Menu mobile acessível (hamburger claro)`,
    steps: [
      "Limite o menu principal a 7 itens",
      "Implemente breadcrumbs em páginas profundas",
      "Adicione links rápidos no footer",
      "Teste navegação com utilizadores reais",
      "Use analytics para identificar páginas difíceis de encontrar"
    ]
  },
  "struct-3": {
    content: `Mobile First significa desenhar primeiro para ecrãs pequenos e depois adaptar para desktop, não o contrário.

**Por Que Mobile First:**
- 60%+ do tráfego web é mobile
- Google usa Mobile-First Indexing
- Força foco no conteúdo essencial

**Breakpoints Comuns:**
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px`,
    steps: [
      "Comece o design pelo layout mobile",
      "Use unidades relativas (%, rem, vh/vw)",
      "Implemente menu hamburger para mobile",
      "Garanta botões com mínimo 48px de área tátil",
      "Teste em dispositivos reais, não apenas simuladores"
    ]
  }
};

const difficultyColors: Record<string, string> = {
  fácil: "bg-green-500/20 text-green-400 border-green-500/30",
  médio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avançado: "bg-red-500/20 text-red-400 border-red-500/30"
};

export function TutorialContentModal({ open, onOpenChange, tutorial }: TutorialContentModalProps) {
  if (!tutorial) return null;

  const tutorialData = tutorialContents[tutorial.id] || {
    content: tutorial.description,
    steps: ["Em breve teremos conteúdo detalhado para este tutorial."]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              {tutorial.type === "video" ? (
                <Play className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${difficultyColors[tutorial.difficulty]} border text-xs`}>
                {tutorial.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tutorial.duration}
              </span>
            </div>
          </div>
          <DialogTitle className="text-xl text-foreground">
            {tutorial.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {tutorial.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Conteúdo Principal */}
            <div className="prose prose-invert prose-sm max-w-none">
              {tutorialData.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Passos de Implementação */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Passos para Implementar
              </h4>
              <ul className="space-y-2">
                {tutorialData.steps.map((step, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-3 text-sm text-muted-foreground p-2 rounded-lg bg-muted/30"
                  >
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button 
            className="glow-neon gap-2"
            onClick={() => {
              const whatsappMessage = encodeURIComponent(`Olá! Preciso de ajuda para implementar: ${tutorial.title}`);
              window.open(`https://wa.me/351912345678?text=${whatsappMessage}`, "_blank");
            }}
          >
            Pedir Ajuda
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}