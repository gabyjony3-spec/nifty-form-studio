import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Search, 
  Zap, 
  Target, 
  Layout, 
  FileText, 
  Clock,
  ExternalLink,
  MessageCircle,
  Play,
  Rocket,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TutorialContentModal } from "@/components/library/TutorialContentModal";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: "article" | "video";
  difficulty: "fácil" | "médio" | "avançado";
}

const tutorials: Record<string, Tutorial[]> = {
  seo: [
    {
      id: "seo-1",
      title: "Guia de Metadados",
      description: "Como corrigir títulos, meta descriptions e datas de publicação para o Google",
      duration: "5 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "seo-2", 
      title: "Otimização de URLs",
      description: "Estruture URLs amigáveis que melhoram o ranking nos motores de busca",
      duration: "3 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "seo-3",
      title: "Schema Markup Essencial",
      description: "Adicione dados estruturados para rich snippets no Google",
      duration: "8 min",
      type: "video",
      difficulty: "médio"
    }
  ],
  performance: [
    {
      id: "perf-1",
      title: "Guia de Imagens WebP",
      description: "Como comprimir e converter imagens para formato WebP para carregamento rápido",
      duration: "4 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "perf-2",
      title: "Cache do Navegador",
      description: "Configure headers de cache para melhorar a velocidade de carregamento",
      duration: "6 min",
      type: "article",
      difficulty: "médio"
    },
    {
      id: "perf-3",
      title: "Lazy Loading de Imagens",
      description: "Carregue imagens apenas quando necessário para economizar banda",
      duration: "5 min",
      type: "video",
      difficulty: "fácil"
    }
  ],
  conversion: [
    {
      id: "conv-1",
      title: "Guia de CTAs",
      description: "Onde colocar botões de Call to Action para maximizar conversões",
      duration: "7 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "conv-2",
      title: "Formulários que Convertem",
      description: "Otimize formulários para reduzir abandono e aumentar leads",
      duration: "6 min",
      type: "video",
      difficulty: "médio"
    },
    {
      id: "conv-3",
      title: "A/B Testing Básico",
      description: "Teste variações de páginas para descobrir o que funciona melhor",
      duration: "10 min",
      type: "article",
      difficulty: "avançado"
    }
  ],
  structure: [
    {
      id: "struct-1",
      title: "Hierarquia de Headings",
      description: "Organize H1, H2, H3 corretamente para SEO e acessibilidade",
      duration: "4 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "struct-2",
      title: "Navegação Eficiente",
      description: "Crie menus de navegação intuitivos que melhoram a experiência",
      duration: "5 min",
      type: "article",
      difficulty: "médio"
    },
    {
      id: "struct-3",
      title: "Mobile First Design",
      description: "Desenhe primeiro para mobile e adapte para desktop",
      duration: "8 min",
      type: "video",
      difficulty: "médio"
    }
  ],
  ai: [
    {
      id: "ai-1",
      title: "Como a nossa IA escala os teus anúncios",
      description: "Aprende como transformar análises em campanhas de Meta Ads automáticas com IA",
      duration: "8 min",
      type: "article",
      difficulty: "fácil"
    },
    {
      id: "ai-2",
      title: "Otimização de Copy com IA",
      description: "Use inteligência artificial para criar copies persuasivas que convertem",
      duration: "6 min",
      type: "video",
      difficulty: "fácil"
    },
    {
      id: "ai-3",
      title: "Segmentação Inteligente",
      description: "Como a IA identifica o público-alvo perfeito para os seus anúncios",
      duration: "5 min",
      type: "article",
      difficulty: "médio"
    }
  ]
};

const categoryIcons: Record<string, React.ElementType> = {
  seo: Search,
  performance: Zap,
  conversion: Target,
  structure: Layout,
  ai: Sparkles
};

const categoryLabels: Record<string, string> = {
  seo: "SEO",
  performance: "Performance",
  conversion: "Conversão",
  structure: "Estrutura",
  ai: "IA & Anúncios"
};

const difficultyColors: Record<string, string> = {
  fácil: "bg-green-500/20 text-green-400 border-green-500/30",
  médio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  avançado: "bg-red-500/20 text-red-400 border-red-500/30"
};

const LibraryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs = Object.keys(tutorials);
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "seo";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTutorialClick = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setModalOpen(true);
  };

  const whatsappNumber = "351912345678"; // Substituir pelo número real
  const whatsappMessage = encodeURIComponent("Olá! Preciso de ajuda para implementar as melhorias técnicas no meu site.");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Soluções</h1>
          <p className="text-muted-foreground">Aprenda a resolver os problemas técnicos do seu site</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border p-1 h-auto flex-wrap">
          {Object.keys(tutorials).map((category) => {
            const Icon = categoryIcons[category];
            return (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                {categoryLabels[category]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(tutorials).map(([category, items]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((tutorial, index) => (
                <motion.div
                  key={tutorial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 panel-shadow h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {tutorial.type === "video" ? (
                            <Play className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <Badge className={`${difficultyColors[tutorial.difficulty]} border text-xs`}>
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-foreground mt-3">
                        {tutorial.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {tutorial.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {tutorial.duration}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleTutorialClick(tutorial)}
                        >
                          {tutorial.type === "video" ? "Assistir" : "Ler"} 
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* AI Ads CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-cyan-500/20 via-primary/20 to-purple-500/20 border-primary/30 panel-shadow overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center glow-neon">
                  <Rocket className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Pronto para escalar os teus anúncios? 🚀
                  </h3>
                  <p className="text-muted-foreground">
                    Transforma qualquer análise de website em campanhas Meta Ads com IA.
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => navigate("/dashboard/analysis")}
                className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white gap-2 glow-neon"
              >
                <Sparkles className="h-5 w-5" />
                Experimentar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Banner Upsell */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-card border-primary/30 panel-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Demasiado complexo? 🤔
                </h3>
                <p className="text-muted-foreground">
                  Deixe que os nossos especialistas implementem todas as melhorias por si.
                </p>
              </div>
              <Button 
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white gap-2 glow-neon"
                onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank")}
              >
                <MessageCircle className="h-5 w-5" />
                Falar com Especialista
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Conteúdo */}
      <TutorialContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tutorial={selectedTutorial}
      />
    </div>
  );
};

export default LibraryPage;
