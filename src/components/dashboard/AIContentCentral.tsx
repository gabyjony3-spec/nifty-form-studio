import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  MessageCircle,
  Copy, 
  Loader2, 
  Wand2,
  CheckCircle2,
  Lightbulb,
  Hash
} from "lucide-react";
import { toast } from "sonner";

interface GeneratedContent {
  type: string;
  content: string;
}

export function AIContentCentral() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState("caption");

  const generateContent = async (type: string) => {
    if (!topic.trim()) {
      toast.error("Insira um tópico ou assunto para gerar conteúdo");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    const prompts: Record<string, string> = {
      caption: `Crie 3 legendas criativas para Instagram sobre "${topic}" ${niche ? `para o nicho de ${niche}` : ""}.
        
        Cada legenda deve ter:
        - Hook inicial chamativo
        - Conteúdo de valor
        - CTA (Call to Action)
        - 3-5 hashtags relevantes
        
        Formato: Numere cada legenda (1, 2, 3) e separe-as claramente.`,
        
      script: `Crie um roteiro de vídeo Reels/TikTok (30-60 segundos) sobre "${topic}" ${niche ? `para o nicho de ${niche}` : ""}.
        
        O roteiro deve ter:
        🎬 HOOK (0-3s): Frase de abertura impactante
        📍 PROBLEMA (3-8s): Mencionar a dor do público
        ✅ SOLUÇÃO (8-25s): Explicar o conceito com exemplos práticos
        📢 CTA (25-30s): Chamada para ação engajante
        
        Use linguagem direta e conversacional.`,
        
      title: `Crie 10 títulos magnéticos para vídeos/posts sobre "${topic}" ${niche ? `para o nicho de ${niche}` : ""}.
        
        Os títulos devem:
        - Usar gatilhos mentais (curiosidade, urgência, exclusividade)
        - Ter no máximo 60 caracteres
        - Ser otimizados para cliques
        
        Formato: Numere cada título (1-10).`,
        
      imagePrompt: `Crie 5 prompts detalhados para geração de imagens AI sobre "${topic}" ${niche ? `para o nicho de ${niche}` : ""}.
        
        Cada prompt deve incluir:
        - Descrição visual detalhada
        - Estilo artístico sugerido (minimalista, 3D, flat design, etc.)
        - Cores e atmosfera
        - Composição e elementos
        
        Os prompts devem ser otimizados para Midjourney/DALL-E.
        Formato: Numere cada prompt (1-5).`
    };

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: prompts[type],
        },
      });

      if (error) throw error;

      const content = data.response || data.generatedText || "";
      setGeneratedContent({ type, content });
      toast.success("Conteúdo gerado com sucesso!");
    } catch (error) {
      console.error("Error generating content:", error);
      
      // Fallback content based on type
      const fallbackContent: Record<string, string> = {
        caption: `📌 LEGENDA 1:
🔥 HOOK: "${topic}" é a chave para o seu sucesso!

Você já parou para pensar como ${topic} pode transformar seu negócio?

A maioria das pessoas ignora isso, mas os que dominam essa habilidade estão sempre à frente.

💡 Salve esse post e comece a aplicar hoje!

#${topic.replace(/\s/g, '')} #empreendedorismo #sucesso #negócios #dicas

---

📌 LEGENDA 2:
⚡ PARE TUDO e leia isso sobre ${topic}!

Se você quer resultados diferentes, precisa fazer diferente.

Aqui estão 3 passos simples:
✅ Identifique o problema
✅ Busque soluções criativas  
✅ Implemente com consistência

Me conta nos comentários: qual é seu maior desafio?

#${topic.replace(/\s/g, '')} #dicasdemarketing #crescimento #resultados

---

📌 LEGENDA 3:
🚀 O segredo que ninguém te conta sobre ${topic}...

Depois de anos estudando e aplicando, descobri que a simplicidade vence.

Não complique. Execute.

👆 Marque alguém que precisa ver isso!

#${topic.replace(/\s/g, '')} #motivação #foco #determinação`,

        script: `🎬 ROTEIRO DE VÍDEO - "${topic}"

🔥 HOOK (0-3s):
"O maior erro sobre ${topic}? Todo mundo comete..."

❌ PROBLEMA (3-8s):
"Você já tentou de tudo e nada funciona? A verdade é que 90% das pessoas fazem isso errado."

✅ SOLUÇÃO (8-25s):
"A solução é mais simples do que imagina:

1. Primeiro, pare de complicar
2. Foque no básico bem feito
3. Seja consistente por 30 dias
4. Analise os resultados

Quando você simplifica, tudo muda."

📢 CTA (25-30s):
"Salva esse vídeo e me conta nos comentários: qual desses passos você vai aplicar primeiro?"

💡 DICAS DE GRAVAÇÃO:
- Olhe direto para a câmera
- Use gestos para enfatizar
- Mantenha energia alta
- Grave em formato vertical (9:16)`,

        title: `🎯 10 TÍTULOS MAGNÉTICOS:

1. "${topic}": O Guia Definitivo que Você Precisa
2. Como Dominar ${topic} em 7 Dias
3. 5 Erros FATAIS sobre ${topic} (Evite AGORA!)
4. A Verdade sobre ${topic} que Ninguém Conta
5. ${topic} Para Iniciantes: Comece HOJE
6. Por Que 99% Falham em ${topic}?
7. O Segredo dos Experts em ${topic}
8. ${topic}: Do Zero ao Avançado
9. Como Eu Usei ${topic} Para Transformar Tudo
10. ${topic} em 2024: O Que Mudou?`,

        imagePrompt: `🎨 PROMPTS PARA GERAÇÃO DE IMAGENS:

1. "Professional business person working on ${topic}, modern minimalist office, soft natural lighting, clean desk setup, motivational atmosphere, 4K, photorealistic"

2. "Abstract 3D visualization of ${topic} concept, floating geometric shapes, gradient purple and cyan colors, futuristic style, cinema 4D render, high detail"

3. "Flat design illustration about ${topic}, pastel color palette, modern vector style, simple shapes, Instagram post format, clean and professional"

4. "Creative metaphor for ${topic}, surreal art style, vibrant colors, dreamlike atmosphere, symbolic elements, digital painting, trending on ArtStation"

5. "Infographic style image about ${topic}, clean white background, colorful icons and charts, professional business aesthetic, modern design, high resolution"`
      };
      
      setGeneratedContent({ type, content: fallbackContent[type] || "Conteúdo de exemplo gerado." });
      toast.success("Conteúdo de exemplo gerado!");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      toast.success("Conteúdo copiado!");
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "caption": return <MessageCircle className="h-4 w-4" />;
      case "script": return <Video className="h-4 w-4" />;
      case "title": return <Lightbulb className="h-4 w-4" />;
      case "imagePrompt": return <ImageIcon className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "caption": return "Legendas";
      case "script": return "Roteiros";
      case "title": return "Títulos";
      case "imagePrompt": return "Prompts de Imagem";
      default: return tab;
    }
  };

  return (
    <Card className="col-span-full glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Wand2 className="h-5 w-5" />
          Central de Conteúdo IA
          <Badge variant="secondary" className="ml-2 bg-cyan-950/50 text-cyan-300 border-cyan-700">Novo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-cyan-300 flex items-center gap-2">
              Tópico / Assunto *
              <Sparkles className="h-3 w-3 text-cyan-500" />
            </Label>
            <div className="relative">
              <Input
                id="topic"
                placeholder="Ex: Marketing Digital, Produtividade, Vendas..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-cyan-950/20 border-cyan-800/50 pr-10"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="niche" className="text-cyan-300 flex items-center gap-2">
              Nicho (opcional)
              <Sparkles className="h-3 w-3 text-cyan-500" />
            </Label>
            <div className="relative">
              <Input
                id="niche"
                placeholder="Ex: Coaches, E-commerce, Fitness..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-cyan-950/20 border-cyan-800/50 pr-10"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-600" />
            </div>
          </div>
        </div>

        {/* Content Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="caption" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Legendas</span>
            </TabsTrigger>
            <TabsTrigger value="script" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Roteiros</span>
            </TabsTrigger>
            <TabsTrigger value="title" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Títulos</span>
            </TabsTrigger>
            <TabsTrigger value="imagePrompt" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Prompts</span>
            </TabsTrigger>
          </TabsList>

          {["caption", "script", "title", "imagePrompt"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {tab === "caption" && "Gere legendas criativas para Instagram e Facebook"}
                  {tab === "script" && "Crie roteiros prontos para gravar Reels e TikToks"}
                  {tab === "title" && "Títulos magnéticos que atraem cliques"}
                  {tab === "imagePrompt" && "Prompts otimizados para Midjourney e DALL-E"}
                </p>
                <Button 
                  onClick={() => generateContent(tab)}
                  disabled={isGenerating}
                  className="shrink-0"
                >
                  {isGenerating && activeTab === tab ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Gerar
                </Button>
              </div>

              {generatedContent && generatedContent.type === tab && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">Conteúdo Gerado</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  
                  <Textarea
                    value={generatedContent.content}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
