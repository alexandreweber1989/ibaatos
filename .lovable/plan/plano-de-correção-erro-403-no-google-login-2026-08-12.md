# Plano de Correção: Erro 403 no Google Login

O erro 403 reportado pelo Google ("Você não tem acesso a esta página") geralmente ocorre quando uma aplicação em desenvolvimento não está na whitelist do Google Cloud Console ou quando o fluxo de autenticação não consegue processar os tokens de resposta devido a redirecionamentos incorretos ou falta de configuração do provedor.

## Alterações Propostas

### Backend (Supabase)

- Reativar o provedor Google Auth usando a ferramenta dedicada para garantir que as chaves internas do Lovable Cloud estejam sincronizadas.

### Frontend

- **Rota de Autenticação (`src/routes/auth.tsx`)**: Refinar a chamada `signInWithOAuth` para usar o redirecionamento padrão do navegador (`skipBrowserRedirect: false`) e garantir que a `redirectTo` aponte para uma URL estável e absoluta.
- **Rota de Callback (`src/routes/auth.callback.tsx`)**: Implementar uma lógica de processamento de sessão mais resiliente que aguarde a detecção do token pelo cliente Supabase e redirecione para o dashboard somente após a confirmação.

## Detalhes Técnicos

- Configuração do `supabase.auth.signInWithOAuth` com `provider: 'google'`.
- Uso de `onAuthStateChange` no callback para capturar eventos de login assíncronos.
- Garantia de que a `redirect_uri` esteja corretamente formatada como `${window.location.origin}/auth/callback`.

## Verificação

- O usuário deve testar o login após a aplicação das mudanças. Se o erro 403 persistir, será necessário verificar as configurações do Google Cloud Console (IDs de cliente e Segredos) através do dashboard do Lovable Cloud.
