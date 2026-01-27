import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // 'instagram' or 'facebook'
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Autenticação cancelada: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Parâmetros de autenticação inválidos');
        }

        setMessage(`Conectando ${state === 'instagram' ? 'Instagram' : 'Facebook'}...`);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Sessão não encontrada. Faça login novamente.');
        }

        // Call edge function to exchange code for token and save account
        const { data, error: functionError } = await supabase.functions.invoke('oauth-callback', {
          body: {
            code,
            state,
          },
        });

        if (functionError) {
          throw functionError;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setStatus('success');
        setMessage(`${data.platform === 'instagram' ? 'Instagram' : 'Facebook'} conectado com sucesso!`);

        // Notify parent window and close popup
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth-success', platform: state }, '*');
          setTimeout(() => window.close(), 1500);
        } else {
          // If not a popup, redirect to analysis page
          setTimeout(() => navigate('/dashboard/analysis'), 1500);
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao conectar conta');

        // Close popup after showing error
        if (window.opener) {
          setTimeout(() => window.close(), 3000);
        }
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Processando...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sucesso!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Erro</h2>
          </>
        )}
        
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
