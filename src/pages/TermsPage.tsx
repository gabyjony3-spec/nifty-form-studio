import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o AI INsight, você concorda em cumprir e estar vinculado a estes 
              Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve 
              usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Descrição do Serviço</h2>
            <p>
              O AI INsight é uma plataforma de análise de presença digital que utiliza 
              inteligência artificial para avaliar websites e redes sociais, fornecendo 
              insights e recomendações para otimização.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Conta do Usuário</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você é responsável por manter a confidencialidade de sua conta</li>
              <li>Deve fornecer informações precisas e completas durante o registro</li>
              <li>É responsável por todas as atividades realizadas em sua conta</li>
              <li>Deve notificar imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Uso Aceitável</h2>
            <p>Você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Tentar acessar sistemas ou redes sem autorização</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Interferir no funcionamento adequado do serviço</li>
              <li>Coletar informações de outros usuários sem consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Planos e Pagamentos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Os preços estão sujeitos a alterações com aviso prévio de 30 dias</li>
              <li>Pagamentos são processados de forma segura via Stripe</li>
              <li>Reembolsos podem ser solicitados em até 7 dias após a compra</li>
              <li>O acesso é concedido imediatamente após confirmação do pagamento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, incluindo textos, gráficos, logos, ícones e software, 
              é propriedade do AI INsight ou de seus licenciadores e está protegido 
              por leis de direitos autorais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Limitação de Responsabilidade</h2>
            <p>
              O AI INsight fornece análises e recomendações com base em algoritmos de IA. 
              Não garantimos resultados específicos e não somos responsáveis por decisões 
              tomadas com base em nossas análises.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Alterações nos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes termos a qualquer momento. 
              Alterações significativas serão comunicadas por e-mail ou notificação no serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: 
              <a href="mailto:suporte@aiinsight.com" className="text-primary hover:underline ml-1">
                suporte@aiinsight.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
