import { motion } from "framer-motion";
import { Crown, Sparkles, Users, Shield, Zap, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureComparisonTable } from "@/components/elite/FeatureComparisonTable";
import { EliteTestimonials } from "@/components/elite/EliteTestimonials";
import { ElitePricingCard } from "@/components/elite/ElitePricingCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar a sua subscrição Elite a qualquer momento, sem perguntas. O acesso continua até o fim do período pago.",
  },
  {
    question: "Como funciona a garantia de 7 dias?",
    answer: "Se não estiver satisfeito nos primeiros 7 dias, devolvemos 100% do seu investimento. Sem burocracia.",
  },
  {
    question: "As análises são realmente ilimitadas?",
    answer: "Sim! No plano Elite você pode analisar quantos perfis quiser, em todas as redes sociais suportadas.",
  },
  {
    question: "Como funciona a consultoria 1:1?",
    answer: "Todo mês você tem direito a uma sessão de 30 minutos com nossa equipa para tirar dúvidas e otimizar sua estratégia.",
  },
  {
    question: "Posso fazer upgrade do Pro para Elite?",
    answer: "Sim! O valor proporcional do seu plano atual será descontado automaticamente.",
  },
];

export default function EliteUpgradePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30 px-4 py-2">
              <Crown className="h-4 w-4 mr-2" />
              Plano Elite
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Desbloqueie o{" "}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                Poder Total
              </span>{" "}
              da IA
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Análises ilimitadas, automação completa e suporte VIP. 
              Tudo o que você precisa para dominar o seu nicho.
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 text-amber-400" />
                <span>+500 mentores Elite</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>+10.000 análises/mês</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5 text-amber-400" />
                <span>Garantia 7 dias</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <ArrowDown className="h-6 w-6 mx-auto text-amber-400 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Pricing Card Section */}
      <section className="py-12 px-4">
        <ElitePricingCard showOriginalPrice={true} />
      </section>

      {/* Feature Comparison Section */}
      <section className="py-16 px-4 bg-muted/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">
              <Zap className="h-3 w-3 mr-1" />
              Comparativo
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Compare os Planos
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Veja todas as funcionalidades disponíveis em cada plano e escolha o ideal para você.
            </p>
          </motion.div>

          <FeatureComparisonTable />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <Badge variant="outline" className="mb-4 border-amber-500/30 text-amber-400">
              <Users className="h-3 w-3 mr-1" />
              Depoimentos
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              O Que Dizem os Nossos Membros Elite
            </h2>
          </motion.div>

          <EliteTestimonials />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/5">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left hover:text-amber-400">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Pronto para Fazer a Diferença?
            </h2>
            <p className="text-muted-foreground mb-8">
              Junte-se a centenas de mentores que já estão a usar o poder da IA para crescer.
            </p>
            <ElitePricingCard showOriginalPrice={false} />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
