import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rocket, User, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { PhoneInput, cleanPhoneForStorage } from "@/components/ui/phone-input";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { fullName: string; whatsapp: string }) => void;
  websiteUrl: string;
}

const LeadCaptureModal = ({ isOpen, onClose, onSubmit, websiteUrl }: LeadCaptureModalProps) => {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !whatsapp.trim()) return;
    
    setIsSubmitting(true);
    
    // Clean phone number for storage
    const cleanedPhone = cleanPhoneForStorage(whatsapp);
    
    await onSubmit({ fullName: fullName.trim(), whatsapp: cleanedPhone });
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto mb-4"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mx-auto">
              <Rocket className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Quase lá! 🚀
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Insira os seus dados para receber o relatório completo de análise para <span className="text-primary font-medium">{websiteUrl}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome Completo
            </Label>
            <Input
              id="fullName"
              placeholder="João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-input border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              WhatsApp
            </Label>
            <PhoneInput
              id="whatsapp"
              value={whatsapp}
              onChange={setWhatsapp}
              className="bg-input border-border"
              defaultCountryCode="+351"
            />
            <p className="text-xs text-muted-foreground">
              Inclua o código do país (ex: +351 para Portugal, +55 para Brasil)
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-neon"
            disabled={isSubmitting || !fullName.trim() || !whatsapp.trim()}
          >
            {isSubmitting ? "A processar..." : "Iniciar Análise Gratuita"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Os seus dados estão seguros e não serão partilhados com terceiros.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureModal;
