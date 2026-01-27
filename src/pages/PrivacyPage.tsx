import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introdução</h2>
            <p>
              O AI INsight está comprometido com a proteção da sua privacidade. Esta política 
              descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Dados que Coletamos</h2>
            <h3 className="text-xl font-medium mt-4 mb-2">2.1 Dados fornecidos por você:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome completo e e-mail</li>
              <li>Número de WhatsApp (opcional)</li>
              <li>Nome da empresa e área de atuação</li>
              <li>URL do website para análise</li>
              <li>Perfis de redes sociais conectados</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-2">2.2 Dados coletados automaticamente:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Endereço IP e informações do navegador</li>
              <li>Dados de uso e navegação na plataforma</li>
              <li>Cookies e tecnologias similares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Como Usamos seus Dados</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e melhorar nossos serviços de análise</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Enviar comunicações sobre o serviço e atualizações</li>
              <li>Processar pagamentos de forma segura</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Compartilhamento de Dados</h2>
            <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provedores de serviço:</strong> Stripe (pagamentos), Supabase (banco de dados)</li>
              <li><strong>Integrações autorizadas:</strong> Redes sociais que você conectar</li>
              <li><strong>Requisitos legais:</strong> Quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              seus dados, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Autenticação segura e controle de acesso</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e recuperação de desastres</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Seus Direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário 
              para fornecer nossos serviços. Após o encerramento da conta, retemos dados 
              por até 5 anos para fins legais e fiscais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies</h2>
            <p>
              Utilizamos cookies essenciais para o funcionamento da plataforma e cookies 
              analíticos para entender como você usa nosso serviço. Você pode gerenciar 
              suas preferências de cookies nas configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre alterações 
              significativas por e-mail ou através de aviso na plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contato do DPO</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
              entre em contato com nosso Encarregado de Proteção de Dados:
            </p>
            <p className="mt-2">
              <strong>E-mail:</strong>{" "}
              <a href="mailto:privacidade@aiinsight.com" className="text-primary hover:underline">
                privacidade@aiinsight.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
