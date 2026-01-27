import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Mic, MicOff, User, Loader2, Sparkles, Rocket } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  showCTA?: boolean;
}

interface AIChatWidgetProps {
  context?: {
    analysisHistory?: any[];
    automationType?: string;
    trialEndsIn?: string;
  };
  trigger?: React.ReactNode;
}

// Quick reply options
const quickReplies = [
  { label: "Analisar meu Instagram", message: "Quero analisar o meu perfil de Instagram. Que métricas devo verificar?" },
  { label: "Sugestão de Bio", message: "Preciso de ajuda para criar uma bio profissional e persuasiva para as minhas redes sociais." },
  { label: "Ideias de Posts", message: "Dá-me ideias criativas de posts para aumentar o engagement nas minhas redes sociais." },
];

// Function to clean markdown formatting from AI responses
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, "") // Remove bold **text**
    .replace(/\*/g, "")   // Remove italic *text*
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/`{1,3}/g, "") // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
    .trim();
};

export function AIChatWidget({ context, trigger }: AIChatWidgetProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o seu Consultor de Marketing Digital. Como posso ajudar a escalar o seu negócio hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeCTA, setShowUpgradeCTA] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (text) => {
      setInput(text);
    },
  });

  useEffect(() => {
    if (transcript && isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantContent = cleanMarkdown(data.response || data.generatedText || "");
      
      // Check if assistant mentions upgrade or Pro plan
      const mentionsUpgrade = assistantContent.toLowerCase().includes("plano pro") ||
        assistantContent.toLowerCase().includes("upgrade") ||
        assistantContent.toLowerCase().includes("acesso ilimitado");
      
      if (mentionsUpgrade) {
        setShowUpgradeCTA(true);
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
          showCTA: mentionsUpgrade,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Por favor, tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (message: string) => {
    sendMessage(message);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 glow-neon">
            <Sparkles className="h-4 w-4" />
            Assistente IA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[650px] flex flex-col p-0 bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-neon">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold">AI INsight</span>
              <p className="text-xs text-muted-foreground font-normal">Assistente de Marketing</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                    message.role === "user"
                      ? "bg-secondary"
                      : "bg-gradient-to-br from-primary to-primary/60"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-foreground" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 text-foreground rounded-tl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  {message.showCTA && message.role === "assistant" && (
                    <Button
                      onClick={() => {
                        setOpen(false);
                        navigate("/dashboard/pricing");
                      }}
                      className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                      size="sm"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Liberar Acesso Total Agora
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/50">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-6 py-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply.message)}
                  className="text-xs h-7 bg-background/50 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                >
                  {reply.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escreva a sua mensagem..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
              disabled={isLoading}
            />
            {isSupported && (
              <Button
                variant="outline"
                size="icon"
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "border-border/50",
                  isListening && "bg-destructive/20 border-destructive text-destructive"
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-primary mt-2 text-center animate-pulse">
              A ouvir... Fale agora
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
