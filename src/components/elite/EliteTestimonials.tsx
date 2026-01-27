import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Ricardo Almeida",
    role: "Mentor de Marketing Digital",
    avatar: "RA",
    content: "O plano Elite transformou completamente a minha estratégia. O calendário preditivo de 90 dias e as análises ilimitadas me poupam horas por semana.",
    rating: 5,
  },
  {
    name: "Ana Carolina",
    role: "Coach de Finanças Pessoais",
    avatar: "AC",
    content: "A automação ilimitada de WhatsApp e o suporte VIP são game changers. Meus leads nunca estiveram tão engajados.",
    rating: 5,
  },
  {
    name: "Pedro Santos",
    role: "Consultor de Vendas B2B",
    avatar: "PS",
    content: "O espião de concorrentes com alertas me mantém sempre à frente. Vale cada centavo do investimento.",
    rating: 5,
  },
  {
    name: "Mariana Costa",
    role: "Especialista em Branding",
    avatar: "MC",
    content: "As legendas premium com IA entenderam perfeitamente o tom da minha marca. Resultados incríveis!",
    rating: 5,
  },
];

export function EliteTestimonials() {
  return (
    <div className="py-8">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full max-w-4xl mx-auto"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 backdrop-blur-sm"
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-amber-500/30">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-amber-500/20 text-amber-400">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                  <Quote className="h-6 w-6 text-amber-500/40" />
                </div>

                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12 border-amber-500/30 hover:bg-amber-500/20" />
        <CarouselNext className="hidden md:flex -right-12 border-amber-500/30 hover:bg-amber-500/20" />
      </Carousel>
    </div>
  );
}
