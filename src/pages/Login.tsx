import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/components/SessionProvider';
import { MadeWithDyad } from '@/components/made-with-dyad'; // Importar o componente da logo
import { pt } from '@supabase/auth-ui-shared'; // Importar a localização em português

const Login = () => {
  const { session } = useSession();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border border-border">
        <div className="flex justify-center mb-6">
          <img src="/logo-gama.png" alt="Gama Creative Logo" className="h-20 w-auto" />
        </div>
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">Acessar Painel</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view="sign_in"
          theme="dark"
          showLinks={false}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Faça login',
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                email_label: 'Seu e-mail',
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar instruções de redefinição',
                back_to_sign_in_text: 'Voltar para o login',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Digite sua nova senha',
                button_label: 'Atualizar senha',
              },
              magic_link: {
                email_input_placeholder: 'Digite seu e-mail',
                button_label: 'Enviar link mágico',
                link_text: 'Enviar um link mágico por e-mail',
              },
            },
          }}
        />
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Login;