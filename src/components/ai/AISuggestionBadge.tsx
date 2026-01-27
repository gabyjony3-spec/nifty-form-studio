import { useState } from "react";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AISuggestionBadgeProps {
  type: "trigger" | "message";
  automationType: string;
  onSuggestion: (suggestion: string) => void;
}

export function AISuggestionBadge({
  type,
  automationType,
  onSuggestion,
}: AISuggestionBadgeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const getSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);

    try {
      const prompt =
        type === "trigger"
          ? `Sugere um gatilho eficaz para uma automação de ${automationType}. Dá apenas o texto do gatilho, sem explicações. Exemplos: "Quando receber mensagem com 'preço'", "Quando seguir a conta", etc.`
          : `Cria uma mensagem persuasiva curta para uma automação de ${automationType}. A mensagem deve ser profissional, amigável e incluir uma chamada para ação. Máximo 2 frases.`;

      // Use non-streaming for simpler handling
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            context: { automationType },
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("AI Suggestion response error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to get suggestion");
      }

      const data = await response.json();
      const content = data.response || data.generatedText || "";
      
      if (content) {
        setSuggestion(content);
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (error) {
      console.error("Suggestion error:", error);
      setSuggestion("Erro ao obter sugestão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onSuggestion(suggestion);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
          onClick={() => {
            setOpen(true);
            if (!suggestion) getSuggestion();
          }}
        >
          <Sparkles className="h-3 w-3" />
          Dica IA
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Sugestão da IA
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : suggestion ? (
            <>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {suggestion}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleApply}
                >
                  Aplicar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getSuggestion}
                >
                  Nova sugestão
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
