import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/components/SessionProvider';
import { MadeWithDyad } from '@/components/made-with-dyad'; // Importar o componente da logo
import ptBR from '@supabase/auth-ui-shared/locales/pt-BR'; // Importar a localização em português do caminho correto

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
          localization={ptBR} // Usar o objeto de localização ptBR completo
        />
      </div>
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Login;