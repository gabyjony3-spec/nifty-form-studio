import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface WhatsAppFloatingButtonProps {
  score?: number;
  phoneNumber?: string;
}

const WhatsAppFloatingButton = ({ 
  score, 
  phoneNumber = "351912345678" 
}: WhatsAppFloatingButtonProps) => {
  const message = score 
    ? `Olá, acabei de ver que o meu site teve nota ${score} e quero melhorar!`
    : "Olá! Gostaria de saber mais sobre como melhorar o meu site.";
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 cursor-pointer"
    >
      <MessageCircle className="h-7 w-7 text-white" />
      
      {/* Pulse animation */}
      <motion.span
        className="absolute inset-0 rounded-full bg-green-500"
        animate={{
          scale: [1, 1.5],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute right-full mr-3 bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap pointer-events-none"
      >
        <p className="text-sm font-medium text-foreground">Falar com Especialista</p>
      </motion.div>
    </motion.a>
  );
};

export default WhatsAppFloatingButton;