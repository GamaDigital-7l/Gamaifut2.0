import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/components/SessionProvider';
import { MadeWithDyad } from '@/components/made-with-dyad'; // Importar o componente da logo

// Objeto de localização ptBR para o componente Auth
const ptBR = {
  variables: {
    sign_in: {
      email_label: 'Endereço de e-mail',
      password_label: 'Sua senha',
      email_input_placeholder: 'seu@email.com',
      password_input_placeholder: '••••••••',
      button_label: 'Entrar',
      loading_button_label: 'Entrando...',
      social_provider_text: 'Entrar com {{provider}}',
      link_text: 'Não tem uma conta? Cadastre-se',
    },
    sign_up: {
      email_label: 'Endereço de e-mail',
      password_label: 'Crie uma senha',
      email_input_placeholder: 'seu@email.com',
      password_input_placeholder: '••••••••',
      button_label: 'Cadastrar',
      loading_button_label: 'Cadastrando...',
      social_provider_text: 'Cadastrar com {{provider}}',
      link_text: 'Já tem uma conta? Entrar',
    },
    forgot_password: {
      email_label: 'Endereço de e-mail',
      password_label: 'Sua senha',
      email_input_placeholder: 'seu@email.com',
      button_label: 'Enviar instruções de redefinição de senha',
      loading_button_label: 'Enviando instruções...',
      link_text: 'Esqueceu sua senha?',
    },
    update_password: {
      password_label: 'Nova Senha',
      password_input_placeholder: 'Sua nova senha',
      button_label: 'Atualizar Senha',
      loading_button_label: 'Atualizando senha...',
    },
  },
  // Você pode adicionar outras seções de localização aqui, se necessário.
  // Por exemplo:
  // email_otp: {
  //   email_input_label: 'Endereço de e-mail',
  //   email_input_placeholder: 'Seu endereço de e-mail',
  //   button_label: 'Enviar OTP',
  //   loading_button_label: 'Enviando OTP...',
  //   link_text: 'Enviar OTP por e-mail',
  //   confirmation_text: 'Verifique seu e-mail para o link mágico',
  // },
  // magic_link: {
  //   email_input_label: 'Endereço de e-mail',
  //   email_input_placeholder: 'Seu endereço de e-mail',
  //   button_label: 'Enviar link mágico',
  //   loading_button_label: 'Enviando link mágico...',
  //   link_text: 'Enviar link mágico por e-mail',
  //   confirmation_text: 'Verifique seu e-mail para o link mágico',
  // },
  // verify_otp: {
  //   email_input_label: 'Endereço de e-mail',
  //   email_input_placeholder: 'Seu endereço de e-mail',
  //   phone_input_label: 'Número de telefone',
  //   phone_input_placeholder: 'Seu número de telefone',
  //   token_input_label: 'Token',
  //   token_input_placeholder: 'Seu token OTP',
  //   button_label: 'Verificar token',
  //   loading_button_label: 'Verificando token...',
  //   link_text: 'Verificar token',
  //   confirmation_text: 'Verifique seu e-mail para o token OTP',
  // },
};

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