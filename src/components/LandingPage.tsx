import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Check, 
  ArrowRight,
  Instagram,
  Linkedin,
  Twitter,
  Menu,
  X,
  Plug,
  MessageSquare,
  BarChart3,
  Star,
  Quote,
  Facebook,
  Youtube,
  Gift,
  Cpu,
  LayoutDashboard,
  Gauge,
  BarChart2,
  Heart,
  Activity,
  Shield,
  Clock,
  Target,
  Users,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Brain,
  FileText,
  Send,
  Play,
  BadgeCheck,
  Award,
  Headphones,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import aiSocialAnalysisHero from "@/assets/ai-social-analysis-hero.jpg";

// TikTok Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) => (
  <div className="border-b border-border/50 last:border-0">
    <button
      onClick={onClick}
      className="w-full py-5 flex items-center justify-between text-left hover:text-primary transition-colors"
      aria-expanded={isOpen}
    >
      <span className="font-medium text-lg pr-4">{question}</span>
      {isOpen ? (
        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
      ) : (
        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="pb-5"
      >
        <p className="text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    )}
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const { submitLead, isSubmitting } = useLeadCapture();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
  });

  // Urgency countdown timer (15 minutes)
  const [countdownTime, setCountdownTime] = useState({ hours: 0, minutes: 15, seconds: 0 });

  // Initialize countdown from localStorage
  useEffect(() => {
    const COUNTDOWN_KEY = 'landing_urgency_countdown';
    const stored = localStorage.getItem(COUNTDOWN_KEY);
    let endTime: number;
    
    if (stored) {
      endTime = parseInt(stored, 10);
      if (endTime < Date.now()) {
        // Reset if expired
        endTime = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(COUNTDOWN_KEY, endTime.toString());
      }
    } else {
      endTime = Date.now() + 15 * 60 * 1000;
      localStorage.setItem(COUNTDOWN_KEY, endTime.toString());
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setCountdownTime({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show sticky banner after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyBanner(scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitLead(formData);
    if (success) {
      navigate("/auth");
    }
  };

  // Problems we solve - CONVERSION FOCUSED
  const problems = [
    {
      icon: Target,
      problem: "CTAs Inoperantes Estão a Afastar os Seus Visitantes",
      solution: "Garantimos que cada CTA do seu site funcione para capturar leads. Auditoria completa em segundos.",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: Clock,
      problem: "Scores Críticos de SEO Estão a Prejudicar o Seu Tráfego",
      solution: "Saia dos scores de SEO de 20/100 e Estrutura de 10/100 com recomendações técnicas precisas da nossa IA.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: BarChart3,
      problem: "Respostas Genéricas Estão a Perder Vendas",
      solution: "Use IA para personalizar o atendimento via WhatsApp. Automação inteligente 24/7 que converte leads.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  // How AI INsight solves
  const solutions = [
    {
      icon: Brain,
      title: "Análise Automática de Perfis",
      description: "A IA analisa seus perfis sociais em segundos e identifica oportunidades de melhoria instantaneamente."
    },
    {
      icon: Lightbulb,
      title: "Planos de Ação com IA",
      description: "Receba estratégias personalizadas geradas por IA baseadas em dados reais do seu negócio."
    },
    {
      icon: Send,
      title: "Automação WhatsApp",
      description: "Envie mensagens automatizadas para leads quentes e aumente suas conversões em até 340%."
    },
    {
      icon: FileText,
      title: "Relatórios PDF Profissionais",
      description: "Exporte análises completas em PDF para apresentar a clientes ou equipa com aparência profissional."
    }
  ];

  // Stats/metrics
  const stats = [
    { value: "+340%", label: "Aumento médio de engajamento" },
    { value: "15h", label: "Economizadas por semana" },
    { value: "87%", label: "Taxa de precisão IA" },
    { value: "+500", label: "Empresas confiando" }
  ];

  // Trust badges
  const trustBadges = [
    { icon: Shield, text: "Dados 100% Seguros" },
    { icon: Gift, text: "Sem Cartão de Crédito" },
    { icon: Users, text: "Suporte em Português" }
  ];

  // Case Studies
  const caseStudies = [
    {
      company: "Agência Digital XYZ",
      before: "5 pessoas gastavam 40h/semana em análise manual de redes sociais",
      after: "Com AI iNsight, 0h em análise manual - tudo automatizado",
      result: "+500 leads em 30 dias",
      metric: "-40h de trabalho semanal"
    },
    {
      company: "E-commerce Plus",
      before: "Taxa de conversão de 1.2% com campanhas genéricas",
      after: "Campanhas otimizadas com insights de IA personalizados",
      result: "+340% de engajamento",
      metric: "3.8% taxa de conversão"
    },
    {
      company: "Consultoria ABC",
      before: "Dificuldade em mensurar ROI de redes sociais",
      after: "Dashboards em tempo real com métricas claras",
      result: "1000+ leads qualificados",
      metric: "ROI visível em 7 dias"
    }
  ];

  // FAQ items - EXPANDED
  const faqs = [
    {
      question: "Preciso de conhecimento técnico para usar?",
      answer: "Não! O AI INsight foi projetado para ser intuitivo e fácil de usar. Basta conectar suas redes sociais e a IA faz todo o trabalho de análise automaticamente. Sem código, sem complicações. A interface é simples e qualquer pessoa consegue usar em menos de 5 minutos."
    },
    {
      question: "Quanto tempo leva para ver os primeiros resultados?",
      answer: "A análise é instantânea - em segundos você recebe insights acionáveis. Resultados de crescimento no engajamento e leads geralmente aparecem nas primeiras 2-4 semanas ao implementar as sugestões da IA. Muitos clientes reportam melhorias significativas já na primeira semana."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Não há compromisso ou período mínimo. Você pode cancelar sua assinatura a qualquer momento diretamente no dashboard, sem taxas adicionais ou burocracia. Sem perguntas, sem complicações."
    },
    {
      question: "Quais redes sociais são suportadas?",
      answer: "Atualmente suportamos Instagram, Facebook, TikTok, YouTube, LinkedIn e análise de websites (SEO, velocidade, conversão). Novas integrações são adicionadas regularmente com base no feedback dos usuários. Twitter e Pinterest estão em desenvolvimento."
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança (RGPD compliant). Seus dados nunca são compartilhados com terceiros e você tem controle total sobre suas informações. Servidores seguros na Europa."
    },
    {
      question: "Consigo integrar com meu CRM atual?",
      answer: "Sim! Oferecemos integração via API com os principais CRMs do mercado (HubSpot, Salesforce, Pipedrive). A configuração leva menos de 10 minutos e nossa equipa de suporte está disponível para ajudar."
    },
    {
      question: "E se eu não conseguir capturar leads?",
      answer: "Oferecemos suporte dedicado para otimizar sua estratégia. Nossa equipa analisa sua conta e sugere melhorias específicas. Além disso, temos uma garantia de 7 dias - se não gostar, devolvemos 100% do valor sem perguntas."
    },
    {
      question: "Como funciona a automação de WhatsApp?",
      answer: "Nossa integração com WhatsApp Business API permite enviar mensagens automáticas para leads quentes. Você pode criar templates personalizados, definir gatilhos (novo lead, carrinho abandonado, etc.) e a IA envia as mensagens no momento ideal para maximizar conversões."
    }
  ];

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "9,90€",
      period: "/mês",
      description: "Para quem está a começar",
      icon: Star,
      color: "cyan",
      features: [
        { name: "Análise de 1 Perfil Social (Instagram)", included: true },
        { name: "Relatório Básico de Pontos Fortes e Fracos", included: true },
        { name: "Gerador de Legendas com IA (Limitado)", included: true },
        { name: "Acesso ao Painel do Utilizador", included: true },
        { name: "Espião de Concorrentes", included: false },
        { name: "Calendário de Conteúdo Semanal", included: false },
        { name: "Suporte Prioritário", included: false },
      ],
      cta: "Assinar Agora",
      popular: false,
      link: "https://buy.stripe.com/cNieVe7VMfZMdr4eLt2sM0I"
    },
    {
      id: "pro",
      name: "Pro",
      price: "29,90€",
      period: "/mês",
      description: "Para profissionais de marketing",
      icon: Zap,
      color: "amber",
      features: [
        { name: "Tudo do Starter +", included: true },
        { name: "Análise Ilimitada (Instagram, Facebook, YouTube)", included: true },
        { name: "Espião de Concorrentes", included: true },
        { name: "Calendário de Conteúdo Semanal gerado por IA", included: true },
        { name: "Detecção Automática de Nicho", included: true },
        { name: "Relatório Estratégico Completo", included: true },
        { name: "Suporte Prioritário", included: true },
      ],
      cta: "Escolher Pro",
      popular: true,
      badge: "70% desconto hoje",
      secondBadge: "Mais Vendido",
      link: "https://buy.stripe.com/dRm00kgsicNAbiWbzh2sM0H"
    },
    {
      id: "elite",
      name: "Elite",
      price: "67,00€",
      period: "/mês",
      description: "Para agências e empresas",
      icon: Award,
      color: "purple",
      features: [
        { name: "Tudo do Pro +", included: true },
        { name: "Gerador de Roteiros de Vídeo (Reels/YouTube)", included: true },
        { name: "Análise de Sentimento e Engajamento Profundo", included: true },
        { name: "Criação de Copy para Anúncios (Ads)", included: true },
        { name: "Automação de WhatsApp Ilimitada", included: true },
        { name: "Acesso Antecipado a Novas Funções", included: true },
        { name: "Consultoria Mensal 1:1", included: true },
      ],
      cta: "Assinar Agora",
      popular: false,
      link: "https://buy.stripe.com/9B628s0tk8xk9aObzh2sM0K"
    }
  ];

  const steps = [
    {
      icon: Plug,
      title: "Conecte e Analise",
      description: "Conecte suas redes sociais em segundos e nossa IA analisa todo o seu perfil automaticamente."
    },
    {
      icon: Sparkles,
      title: "IA Sugere Melhorias",
      description: "Receba insights personalizados, sugestões de conteúdo e estratégias baseadas em dados reais."
    },
    {
      icon: TrendingUp,
      title: "Escale seus Resultados",
      description: "Implemente as sugestões e acompanhe o crescimento do seu engajamento e conversões."
    }
  ];

  // Resources with metrics - PRO FEATURES
  const resources = [
    {
      icon: TrendingUp,
      title: "Auditoria SEO Instantânea",
      description: "Analise o seu site em segundos e receba um relatório completo de SEO, velocidade e conversão."
    },
    {
      icon: Cpu,
      title: "IA Powered by Gemini & GPT",
      description: "Integrações com os modelos mais avançados de IA (Gemini, GPT) para buscas de conteúdo ultra-focadas."
    },
    {
      icon: LayoutDashboard,
      title: "Espião de Concorrentes",
      description: "Descubra o que os seus concorrentes estão a fazer e supere-os com estratégias baseadas em dados."
    },
    {
      icon: BarChart3,
      title: "Automação WhatsApp 24/7",
      description: "Configure respostas automáticas personalizadas que convertem leads enquanto você dorme."
    }
  ];

  // Testimonials with results
  const testimonials = [
    {
      name: "Maria Silva",
      role: "CEO, TechStart",
      avatar: "MS",
      content: "O AI iNsight transformou nossa estratégia completamente. Em apenas 3 meses, economizamos 45h de trabalho manual e geramos 1000+ leads qualificados. Recomendo para todos os profissionais de marketing.",
      rating: 5,
      result: "+340% de crescimento",
      metric: "1000+ leads gerados"
    },
    {
      name: "João Santos",
      role: "Marketing Manager, E-commerce Plus",
      avatar: "JS",
      content: "Ferramenta incrível! Os insights de IA são extremamente precisos e nos ajudaram a otimizar todas as nossas campanhas. O ROI foi visível em apenas 7 dias.",
      rating: 5,
      result: "+280% engajamento",
      metric: "ROI em 7 dias"
    },
    {
      name: "Ana Costa",
      role: "Fundadora, Digital Agency",
      avatar: "AC",
      content: "Recomendo a todos os profissionais de marketing. A análise automática economiza horas de trabalho manual. Minha equipa agora foca no que realmente importa.",
      rating: 5,
      result: "-15h/semana",
      metric: "500+ clientes atendidos"
    },
    {
      name: "Ana Silva",
      role: "CMO, TechGrowth",
      avatar: "AS",
      content: "A Proto Connect AI transformou nossa captação. Em apenas um mês, escalamos nossa geração de leads em 10x de forma totalmente automatizada.",
      rating: 5,
      result: "+1000% leads",
      metric: "1 mês para escalar"
    },
    {
      name: "Marcos Oliveira",
      role: "Diretor de Vendas",
      avatar: "MO",
      content: "A melhor solução de marketing pessoal com IA que já testamos. A interface é intuitiva e o suporte à conversão é real.",
      rating: 5,
      result: "+85% conversão",
      metric: "Interface intuitiva"
    }
  ];

  // Partner logos for social proof
  const partnerLogos = [
    { name: "TechGrowth", initial: "TG" },
    { name: "Digital Agency", initial: "DA" },
    { name: "E-commerce Plus", initial: "EP" },
    { name: "MarketingPro", initial: "MP" },
    { name: "StartupHub", initial: "SH" },
    { name: "SocialBoost", initial: "SB" }
  ];

  // Social Proof Badges
  const socialProofBadges = [
    { icon: Users, value: "+500", label: "Empresas usando" },
    { icon: Star, value: "4.9/5", label: "Satisfação" },
    { icon: Shield, value: "LGPD", label: "Dados seguros" },
    { icon: Headphones, value: "24/7", label: "Suporte PT" }
  ];

  const navLinks = [
    { name: "Problemas", href: "#problemas" },
    { name: "Soluções", href: "#solucoes" },
    { name: "Casos de Sucesso", href: "#casos" },
    { name: "Planos", href: "#precos" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <header>
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50" aria-label="Navegação principal">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <div className="relative w-10 h-10" aria-hidden="true">
                  <svg viewBox="0 0 40 40" className="w-full h-full">
                    {/* Brain outline */}
                    <path 
                      d="M20 4C12 4 6 10 6 18c0 4 2 8 5 10v4c0 2 2 4 4 4h10c2 0 4-2 4-4v-4c3-2 5-6 5-10 0-8-6-14-14-14z" 
                      fill="none" 
                      stroke="url(#brainGradient)" 
                      strokeWidth="2"
                    />
                    {/* Neural connections */}
                    <circle cx="14" cy="14" r="2" fill="#00D2FF" />
                    <circle cx="26" cy="14" r="2" fill="#00D2FF" />
                    <circle cx="20" cy="20" r="2.5" fill="#F97316" />
                    <circle cx="14" cy="26" r="2" fill="#00D2FF" />
                    <circle cx="26" cy="26" r="2" fill="#00D2FF" />
                    <line x1="14" y1="14" x2="20" y2="20" stroke="#00D2FF" strokeWidth="1" opacity="0.6" />
                    <line x1="26" y1="14" x2="20" y2="20" stroke="#00D2FF" strokeWidth="1" opacity="0.6" />
                    <line x1="14" y1="26" x2="20" y2="20" stroke="#00D2FF" strokeWidth="1" opacity="0.6" />
                    <line x1="26" y1="26" x2="20" y2="20" stroke="#00D2FF" strokeWidth="1" opacity="0.6" />
                    <defs>
                      <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D2FF" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-xl lg:text-2xl font-bold text-gradient">AI INsight</span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary transition-smooth"
                    onClick={(e) => {
                      e.preventDefault();
                      document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              {/* CTA Button */}
              <div className="hidden md:block">
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground glow-neon"
                  aria-label="Iniciar auditoria gratuita"
                >
                  Iniciar Minha Auditoria Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden glass border-t border-border/50 py-4"
            >
              <div className="container mx-auto px-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a 
                    key={link.name}
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <Button 
                  onClick={() => navigate("/auth")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                >
                  Iniciar Minha Auditoria Gratuita
                </Button>
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      {/* Urgency Banner */}
      <div className="fixed top-16 lg:top-20 left-0 right-0 z-40 bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-4 text-white text-sm">
          <span className="font-bold">🔥 OFERTA DE LANÇAMENTO:</span>
          <span>Planos a partir de <strong>9,90€/mês</strong></span>
          <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">
              {formatNumber(countdownTime.hours)}:{formatNumber(countdownTime.minutes)}:{formatNumber(countdownTime.seconds)}
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={() => document.querySelector('#precos')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-orange-600 hover:bg-white/90 font-bold text-xs px-3 py-1 h-7"
          >
            VER PLANOS
          </Button>
        </div>
      </div>

      <main>
        {/* Hero Section - CONVERSION OPTIMIZED */}
        <section className="relative pt-44 lg:pt-52 pb-20 lg:pb-32" aria-labelledby="hero-heading">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
          
          <div className="container mx-auto px-4 lg:px-8">
            {/* Intro paragraph for SEO */}
            <p className="sr-only">
              AI INsight é a plataforma líder em marketing digital com inteligência artificial em Portugal. 
              Ajudamos empresas e profissionais de marketing a capturar mais leads qualificados, automatizar 
              campanhas e receber insights estratégicos em tempo real. Com análise de Instagram, Facebook, 
              TikTok, YouTube e websites, oferecemos uma solução completa para escalar o seu negócio digital.
            </p>
            
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                {/* Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
                >
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Powered by AI • +500 empresas confiam</span>
                </motion.div>

                {/* Headline - H1 - CONVERSION OPTIMIZED COPY */}
                <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Transforme Visitantes em <span className="text-gradient">Clientes</span> com a{" "}
                  <span className="text-orange-500">Inteligência de Vendas</span> do AI INsight
                </h1>

                {/* Subheadline - CONVERSION FOCUSED */}
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    <Check className="h-3 w-3" /> Auditoria SEO em segundos
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm">
                    <Check className="h-3 w-3" /> Análise de redes sociais
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm">
                    <Check className="h-3 w-3" /> Automação WhatsApp 24/7
                  </span>
                </div>

                {/* Description - CONVERSION FOCUSED */}
                <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                  Pare de perder tempo com análises manuais. Nossa IA audita seu SEO, redes sociais e estrutura em segundos, 
                  enquanto nossa <strong className="text-foreground">automação de WhatsApp converte seus leads 24/7</strong>.
                  <span className="block mt-2 text-primary font-medium">Comece grátis - sem cartão de crédito.</span>
                </p>

                {/* Result Badge */}
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 mb-8">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 font-semibold">= Crescimento de 340%</span>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
                  {trustBadges.map((badge) => (
                    <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <badge.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all"
                    aria-label="Iniciar auditoria gratuita do seu site e redes sociais"
                  >
                    Iniciar Minha Auditoria Gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => document.querySelector('#video')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-primary/50 text-primary hover:bg-primary/10"
                    aria-label="Ver demonstração do AI INsight"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Ver Demonstração
                  </Button>
                </div>

                {/* Social Media Icons */}
                <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                  <span className="text-sm text-muted-foreground">Analise:</span>
                  <div className="flex items-center gap-2 text-pink-500">
                    <Instagram className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium text-sm">Instagram</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Facebook className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium text-sm">Facebook</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <TikTokIcon className="h-5 w-5" />
                    <span className="font-medium text-sm">TikTok</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <Youtube className="h-5 w-5" aria-hidden="true" />
                    <span className="font-medium text-sm">YouTube</span>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - AI Brain Image with Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative flex justify-center lg:justify-end"
              >
                {/* Glow effect with pulse animation */}
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" aria-hidden="true" />
                
                <img 
                  src={aiSocialAnalysisHero} 
                  alt="Análise de redes sociais com IA - Dashboard mostrando Instagram, TikTok, YouTube e Facebook com gráficos de crescimento" 
                  className="relative z-10 w-[450px] md:w-[600px] lg:w-[700px] h-auto object-contain drop-shadow-[0_0_60px_rgba(6,182,212,0.6)] rounded-2xl"
                  loading="eager"
                  width="700"
                  height="394"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partner Logos Section - Social Proof */}
        <section className="py-16 border-y border-border/30 bg-background/50" aria-label="Empresas Parceiras">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">Empresas que Confiam na AI INsight</p>
              <p className="text-xs text-muted-foreground/60">+500 empresas usando nossa plataforma</p>
            </motion.div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {partnerLogos.map((logo, index) => (
                <motion.div
                  key={logo.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="w-24 h-12 flex items-center justify-center rounded-lg bg-muted/30 border border-border/30 transition-all group-hover:bg-primary/10 group-hover:border-primary/30">
                    <span className="text-muted-foreground/60 font-semibold text-sm group-hover:text-primary transition-colors">{logo.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b border-border/30 bg-background/50" aria-label="Estatísticas">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems Section - WHY AI INSIGHT */}
        <section id="problemas" className="py-24 lg:py-36 relative" aria-labelledby="problems-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="problems-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Por que o <span className="text-gradient">AI INsight</span>?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Resolvemos os problemas reais que estão a prejudicar o seu marketing digital
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {problems.map((item, index) => (
                <motion.article
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="glass-card-hover rounded-2xl p-8"
                >
                  <div className={`w-16 h-16 rounded-2xl ${item.bgColor} flex items-center justify-center mb-6`}>
                    <item.icon className={`h-8 w-8 ${item.color}`} aria-hidden="true" />
                  </div>
                  <div className="flex items-start gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-foreground leading-tight">{item.problem}</h3>
                  </div>
                  <p className="text-primary font-medium flex items-start gap-2">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{item.solution}</span>
                  </p>
                </motion.article>
              ))}
            </div>

            {/* CTA after problems */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground glow-neon"
                aria-label="Iniciar auditoria gratuita do seu site e redes sociais"
              >
                Iniciar Minha Auditoria Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Video Demo Section */}
        <section id="video" className="py-24 lg:py-36 relative bg-gradient-to-b from-primary/5 via-transparent to-primary/5" aria-labelledby="video-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 id="video-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Veja a <span className="text-gradient">AI iNsight</span> em Ação
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Descubra como nossa plataforma transforma sua estratégia de marketing em apenas 2 minutos
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              {/* Video from Google Drive */}
              <div className="relative aspect-video rounded-2xl overflow-hidden glass-card glow-soft">
                <iframe
                  src="https://drive.google.com/file/d/1BrA8Gj1tWpbW4iRnbeRzLpVgj0VzQaxq/preview"
                  width="100%"
                  height="100%"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title="Demonstração AI iNsight"
                />
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                <BadgeCheck className="inline h-4 w-4 text-primary mr-1" />
                Assista e veja como aumentar conversões em até 340%
              </p>
            </motion.div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solucoes" className="py-24 lg:py-36 relative" aria-labelledby="solutions-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="solutions-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Como a <span className="text-gradient">AI INsight</span> Soluciona
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tecnologia de ponta para transformar sua presença digital
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {solutions.map((solution, index) => (
                <motion.article
                  key={solution.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover rounded-xl p-6"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 glow-soft">
                    <solution.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{solution.title}</h3>
                  <p className="text-muted-foreground text-sm">{solution.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies Section - NEW */}
        <section id="casos" className="py-24 lg:py-36 relative" aria-labelledby="cases-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
          
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="cases-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Histórias Reais de <span className="text-gradient">Transformação</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Veja como empresas reais alcançaram resultados extraordinários com AI iNsight
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <motion.article
                  key={study.company}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="glass-card-hover rounded-2xl p-6 lg:p-8"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <Award className="h-6 w-6 text-primary" />
                    <h3 className="font-bold text-lg">{study.company}</h3>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-red-500/10 rounded-lg p-4">
                      <p className="text-xs text-red-400 font-medium mb-1">ANTES</p>
                      <p className="text-sm text-muted-foreground">{study.before}</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="bg-green-500/10 rounded-lg p-4">
                      <p className="text-xs text-green-400 font-medium mb-1">DEPOIS</p>
                      <p className="text-sm text-muted-foreground">{study.after}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <p className="text-2xl font-bold text-primary">{study.result}</p>
                      <p className="text-xs text-muted-foreground">{study.metric}</p>
                    </div>
                    <BadgeCheck className="h-8 w-8 text-green-500" />
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="sobre" className="py-24 lg:py-36 relative" aria-labelledby="how-it-works-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="how-it-works-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Como <span className="text-gradient">Funciona</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Três passos simples para transformar sua presença digital
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="glass-card-hover rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-soft">
                    <step.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div className="text-primary font-bold mb-2">Passo {index + 1}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Resources Section with Metrics */}
        <section id="recursos" className="py-24 lg:py-36 relative" aria-labelledby="resources-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
          
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="resources-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Ferramentas que <span className="text-gradient">Impulsionam</span> o seu Negócio
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Transforme dados em insights acionáveis com a sua agência de marketing pessoal
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource, index) => (
                <motion.article
                  key={resource.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover rounded-xl p-6 text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 glow-soft">
                    <resource.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{resource.title}</h3>
                  <p className="text-muted-foreground text-sm">{resource.description}</p>
                </motion.article>
              ))}
            </div>

            {/* Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <div className="glass-card rounded-2xl p-2 lg:p-4 glow-soft">
                <div className="bg-background/50 rounded-xl p-4 lg:p-8">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: "Score SEO", value: "98", color: "text-green-500", bgColor: "bg-green-500/10", icon: TrendingUp },
                      { label: "Velocidade", value: "95", color: "text-blue-500", bgColor: "bg-blue-500/10", icon: Gauge },
                      { label: "Conversão", value: "82", color: "text-yellow-500", bgColor: "bg-yellow-500/10", icon: BarChart2 },
                      { label: "Engajamento", value: "91", color: "text-purple-500", bgColor: "bg-purple-500/10", icon: Heart }
                    ].map((metric) => (
                      <div key={metric.label} className="glass-card rounded-lg p-4 flex items-center justify-center gap-3">
                        <p className={`text-2xl lg:text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                        <div className="flex flex-col items-start">
                          <div className={`w-8 h-8 rounded-lg ${metric.bgColor} flex items-center justify-center mb-1`}>
                            <metric.icon className={`h-4 w-4 ${metric.color}`} aria-hidden="true" />
                          </div>
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Performance Chart */}
                  <div className="bg-background/30 rounded-xl p-4 lg:p-6">
                    <p className="text-sm text-muted-foreground mb-4">Tendência Geral de Performance</p>
                    
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 h-48 lg:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { day: '10', content: 120, traffic: 180, social: 150 },
                            { day: '12', content: 140, traffic: 170, social: 165 },
                            { day: '14', content: 135, traffic: 200, social: 155 },
                            { day: '16', content: 180, traffic: 220, social: 180 },
                            { day: '18', content: 200, traffic: 240, social: 210 },
                            { day: '20', content: 190, traffic: 230, social: 225 },
                            { day: '22', content: 220, traffic: 260, social: 240 },
                            { day: '24', content: 250, traffic: 280, social: 260 },
                            { day: '26', content: 240, traffic: 270, social: 275 },
                            { day: '28', content: 280, traffic: 300, social: 290 },
                            { day: '30', content: 300, traffic: 320, social: 310 }
                          ]}>
                            <XAxis 
                              dataKey="day" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              domain={[100, 350]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line type="monotone" dataKey="content" stroke="#10B981" strokeWidth={2} dot={false} name="Conteúdo" />
                            <Line type="monotone" dataKey="traffic" stroke="#3B82F6" strokeWidth={2} dot={false} name="Tráfego" />
                            <Line type="monotone" dataKey="social" stroke="#A855F7" strokeWidth={2} dot={false} name="Social" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="lg:w-64 bg-background/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-4">Análise Detalhada de Últimos 30 Dias:</p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true"></span>
                            <span className="text-muted-foreground">Estratégia de Conteúdo</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true"></span>
                            <span className="text-muted-foreground">Tráfego Pago</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500" aria-hidden="true"></span>
                            <span className="text-muted-foreground">Interação Social</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Ver Demonstração Completa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section - WITH RESULTS */}
        <section id="testemunhos" className="py-24 lg:py-36 relative" aria-labelledby="testimonials-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="testimonials-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                O Que Dizem <span className="text-gradient">Nossos Clientes</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Histórias de sucesso de quem já transformou seu marketing
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.article
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="glass-card-hover rounded-2xl p-8"
                >
                  {/* Result Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />
                      {testimonial.result}
                    </div>
                    <span className="text-xs text-muted-foreground">{testimonial.metric}</span>
                  </div>
                  
                  <Quote className="h-8 w-8 text-primary/30 mb-4" aria-hidden="true" />
                  <blockquote className="text-muted-foreground mb-6">{testimonial.content}</blockquote>
                  
                  <div className="flex items-center gap-2 mb-4" aria-label={`Avaliação: ${testimonial.rating} de 5 estrelas`}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                    ))}
                  </div>

                  <footer className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold" aria-hidden="true">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <cite className="font-semibold not-italic">{testimonial.name}</cite>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </footer>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee Section - NEW */}
        <section className="py-16 lg:py-24 relative" aria-labelledby="guarantee-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center glass-card rounded-2xl p-8 lg:p-12 border-primary/20"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-green-500" />
              </div>
              <h2 id="guarantee-heading" className="text-2xl lg:text-3xl font-bold mb-4">
                Garantia de 7 Dias - <span className="text-green-500">Sem Risco</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Teste grátis por 7 dias. Se não gostar, cancelamos sem perguntas e sem taxas. 
                Você não tem nada a perder e tudo a ganhar.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Cancelamento a qualquer momento</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Suporte completo</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Badges - NEW */}
        <section className="py-12 border-y border-border/30" aria-label="Prova social">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {socialProofBadges.map((badge, index) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <badge.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-gradient mb-1">{badge.value}</p>
                  <p className="text-sm text-muted-foreground">{badge.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section - PREMIUM DESIGN */}
        <section id="precos" className="py-24 lg:py-36 relative" aria-labelledby="pricing-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
          
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="pricing-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Planos e <span className="text-gradient">Preços</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Escolha o plano ideal para escalar o seu negócio
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                const getIconColor = (color: string) => {
                  switch (color) {
                    case "amber": return "text-amber-400";
                    case "purple": return "text-purple-400";
                    default: return "text-cyan-400";
                  }
                };
                const getCheckColor = (color: string) => {
                  switch (color) {
                    case "amber": return "text-amber-400 bg-amber-500/20";
                    case "purple": return "text-purple-400 bg-purple-500/20";
                    default: return "text-cyan-400 bg-cyan-500/20";
                  }
                };
                const getGradient = (color: string) => {
                  switch (color) {
                    case "amber": return "from-amber-950/50 via-slate-900 to-slate-900";
                    case "purple": return "from-purple-950/50 via-slate-900 to-slate-900";
                    default: return "from-slate-800 to-slate-900";
                  }
                };
                const getBorderColor = (color: string) => {
                  switch (color) {
                    case "amber": return "border-amber-500/50";
                    case "purple": return "border-purple-500/30";
                    default: return "border-cyan-500/30";
                  }
                };

                return (
                  <motion.article
                    key={plan.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className={`relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br ${getGradient(plan.color)} border-2 ${getBorderColor(plan.color)} transition-all duration-300 hover:scale-[1.02]`}
                  >
                    {/* Glow effect for popular plan */}
                    {plan.popular && (
                      <>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full" />
                        <div className="absolute -top-1 -right-1 -left-1">
                          <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
                        </div>
                      </>
                    )}
                    
                    {/* Badges - Centered above title */}
                    {plan.badge && (
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          {plan.badge}
                        </span>
                        {(plan as any).secondBadge && (
                          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs rounded-full font-bold flex items-center gap-1 shadow-lg">
                            <Award className="h-3 w-3" />
                            {(plan as any).secondBadge}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="text-center mb-8 relative">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Icon className={`h-6 w-6 ${getIconColor(plan.color)}`} />
                        <h3 className={`text-2xl font-bold ${plan.popular ? "text-amber-300" : "text-foreground"}`}>
                          Plano {plan.name}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center">
                        <span className={`text-4xl font-bold ${plan.popular ? "text-amber-300" : "text-foreground"}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground ml-1">{plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {feature.included ? (
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${getCheckColor(plan.color)}`}>
                              <Check className="h-3 w-3" />
                            </div>
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50" />
                          )}
                          <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full py-6 font-semibold ${
                        plan.popular 
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-[0_0_30px_rgba(245,158,11,0.4)]" 
                          : plan.color === "purple"
                          ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      }`}
                      onClick={() => window.open(plan.link, "_blank")}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      {plan.cta}
                    </Button>
                  </motion.article>
                );
              })}
            </div>
            
            <div className="text-center mt-8 text-muted-foreground text-sm">
              <p>Pagamento seguro processado via Stripe. Cancele a qualquer momento.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section - EXPANDED */}
        <section id="faq" className="py-24 lg:py-36 relative" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 id="faq-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Perguntas <span className="text-gradient">Frequentes</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Respostas rápidas para as dúvidas mais comuns
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto glass-card rounded-2xl p-6 lg:p-8"
            >
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Lead Capture Section */}
        <section id="contato" className="py-24 lg:py-36" aria-labelledby="contact-heading">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 id="contact-heading" className="text-3xl lg:text-4xl font-bold mb-4">
                Pronto para <span className="text-gradient">Transformar</span> seu Marketing?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Comece grátis agora e veja resultados em 7 dias. Sem cartão de crédito.
              </p>

              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="full_name" className="sr-only">Seu nome</label>
                    <Input
                      id="full_name"
                      placeholder="Seu nome"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">Seu email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Seu email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-background/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="whatsapp" className="sr-only">WhatsApp (opcional)</label>
                  <Input
                    id="whatsapp"
                    placeholder="WhatsApp (opcional)"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white glow-neon"
                >
                  {isSubmitting ? "A processar..." : "Começar Grátis - Sem Compromisso"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Ao criar conta, você concorda com nossos{" "}
                  <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> e{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12" role="contentinfo">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="text-lg font-bold text-gradient">AI INsight</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-md mb-4">
                A sua agência de marketing pessoal com inteligência artificial. 
                Analise, automatize e escale o seu negócio digital com IA.
              </p>
              <div className="flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <div key={badge.text} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <badge.icon className="h-3 w-3 text-primary" aria-hidden="true" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <nav aria-label="Links do produto">
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#recursos" className="hover:text-primary transition-smooth">Recursos</a></li>
                <li><a href="#precos" className="hover:text-primary transition-smooth">Preços</a></li>
                <li><a href="#testemunhos" className="hover:text-primary transition-smooth">Testemunhos</a></li>
                <li><a href="#faq" className="hover:text-primary transition-smooth">FAQ</a></li>
              </ul>
            </nav>

            {/* Company Links */}
            <nav aria-label="Links da empresa">
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-smooth">Termos de Uso</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-smooth">Política de Privacidade</Link></li>
                <li><a href="#contato" className="hover:text-primary transition-smooth">Contacto</a></li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} AI INsight. Todos os direitos reservados.
            </p>

            {/* Social Links */}
            <nav aria-label="Redes sociais">
              <ul className="flex items-center gap-4">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth" aria-label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth" aria-label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth" aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-smooth" aria-label="Twitter">
                    <Twitter className="h-5 w-5" />
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Hidden admin link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/admin/login")}
              className="text-xs text-muted-foreground/20 hover:text-muted-foreground/40 transition-smooth"
              aria-label="Acesso administrativo"
            >
              Admin
            </button>
          </div>
        </div>
      </footer>

      {/* Sticky CTA Banner */}
      {showStickyBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 py-3 px-4"
        >
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary hidden sm:block" />
              <span className="text-sm font-medium text-center sm:text-left">
                <span className="text-primary font-bold">Auditoria SEO + Automação WhatsApp</span> • Planos desde 9,90€/mês
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                aria-label="Iniciar auditoria gratuita"
              >
                Iniciar Auditoria Gratuita
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.querySelector('#precos')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;
