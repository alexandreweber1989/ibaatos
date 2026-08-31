# Auditoria de Autenticação e Segurança — Igreja Batista Atos

## 1. Situação atual

Existe um plano técnico de auditoria em `.lovable/plan/plano-de-auditoria-técnica-e-correção-de-bugs-igreja-batista-2026-08-23.md`, mas não há um documento de referência permanente no repositório para autenticação, segredos e RBAC em produção.

A revisão abaixo consolida os riscos observados no código e no fluxo de implantação.

## 2. Resumo executivo

Os maiores riscos não estão em uma falha óbvia de UI, mas em três pontos:

1. Credenciais e chaves de produção sendo substituídas por fallback embutido no código.
2. Mistura de ambientes (Lovable, Vercel, Supabase) sem origem única de segredos.
3. Dependência de políticas e permissões que precisam ser validadas com RLS real e não apenas por estado do cliente.

Isso torna a autenticação e a autorização vulneráveis a ambiguidades de ambiente e a uso indevido de chaves administrativas.

## 3. Prioridade 0 — Correção urgente

### 3.1 Fallbacks hardcoded de Supabase no cliente e no servidor

Achados:

- O cliente web usa fallbacks explícitos em `src/integrations/supabase/client.ts`.
- O cliente servidor usa fallbacks em `src/integrations/supabase/client.server.ts`.
- O middleware de autenticação também usa fallback para URL e anon key em `src/integrations/supabase/auth-middleware.ts`.

Risco:

- Se uma chave pública ou de serviço estiver faltando em produção, o app pode continuar funcionando com valores embutidos no código.
- Isso mascara falhas de configuração e pode expor fluxo de autenticação em um ambiente que não corresponde ao contexto correto.

Ação:

- Remover todos os valores de fallback hardcoded.
- Fazer o app falhar de forma explícita quando `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` não estiverem configurados.
- Manter apenas valores de ambiente no runtime do provedor.

### 3.2 Mistura de chave publica e serviço no servidor

Achados:

- O arquivo `src/integrations/supabase/client.server.ts` usa `SUPABASE_SERVICE_ROLE_KEY`, mas também faz fallback para `VITE_SUPABASE_PUBLISHABLE_KEY`.
- O middleware `auth-middleware.ts` usa a chave pública como base para autenticação de token.

Risco:

- No servidor, `SUPABASE_SERVICE_ROLE_KEY` deve ser um valor secreto e exclusivo.
- Usar uma chave pública ou publishable em lugar de chave de serviço pode quebrar o modelo de segurança e permitir acesso indevido em operações administrativas.

Ação:

- Separar claramente `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- Garantir que o cliente web nunca receba a chave de serviço.
- Garantir que o código do servidor não use o valor público como fallback para operação administrativa.

### 3.3 Propriedade dos segredos entre Lovable, Vercel e Supabase

Achados:

- A documentação do workspace já ressalta a diferença entre variáveis do Lovable e da Vercel em `docs/KNOWLEDGE-WORKSPACE.md`.
- O projeto usa esse modelo de múltiplos ambientes e precisa manter a origem da verdade clara.

Risco:

- O código pode parecer funcionar em preview local ou no Lovable, mas a produção na Vercel pode não ter as mesmas credenciais.
- Isso produz “login que funciona em um ambiente e falha no outro” e pode mascarar sequestra de sessão ou usuário não habilitado.

Ação:

- Registrar um único “inventário de segredos” do projeto.
- Validar que cada ambiente (dev, preview, production) tenha um conjunto de variáveis próprias.
- Nunca depender de valores do editor ou do preview para ambiente de produção.

## 4. Prioridade 1 — Reforço de autenticação e autorização

### 4.1 Fluxo de login, Google OAuth e callback

Achados:

- O login por senha está em `src/routes/auth.tsx`.
- O login com Google usa `supabase.auth.signInWithOAuth` com redirect para `/auth/callback`.
- A rota de callback está em `src/routes/auth.callback.tsx`.

Risco:

- O fluxo é funcional, mas depende de configuração correta do redirect URL no painel do Supabase.
- Qualquer descompasso entre `window.location.origin`, callback URL e domínio da Vercel pode quebrar autenticação social.

Ação:

- Validar no Supabase as URLs de redirect autorizadas.
- Usar uma lista explícita de domínios autorizados para produção, preview e localhost.
- Garantir que o callback não dependa de host ad hoc ou de preview em produção.

### 4.2 `useAuth` e permissões por papel

Achados:

- O provider principal está em `src/lib/auth-context.tsx`.
- A lógica de `isAdmin`, `isPastoral`, `isLeadership` e escopos por ministério/mesa está centralizada ali.
- O projeto reforça explicitamente que “papel” e “função eclesiástica” são modelos distintos em `docs/KNOWLEDGE-WORKSPACE.md`.

Risco:

- O cliente pode renderizar elementos de UI com base em roles, mas isso não substitui a validação no banco.
- Se a tabela `user_roles` ou `profiles` tiver dados inconsistentes, a UI pode mostrar acesso indevido.

Ação:

- Manter a UI apenas como camada de experiência.
- Garantir que todas as queries sensíveis passem por RLS e funções `SECURITY DEFINER`.
- Validar permissões em cada ação crítica, não só na renderização.

### 4.3 Servidor e middleware de autenticação

Achados:

- `src/integrations/supabase/auth-middleware.ts` exige `Authorization: Bearer <token>` e chama `supabase.auth.getClaims(token)`.
- Várias funções de servidor usam esse middleware para proteger operações em `src/lib/*.functions.ts`.

Risco:

- se a aplicação receber token inválido, vazio ou de ambiente errado, a rota pode cair em erro genérico.
- sem logs de diagnóstico claros, fica difícil distinguir problema de token, de RLS ou de ambiente.

Ação:

- Padronizar mensagens de erro sem expor segredos.
- Registrar o erro de forma consistente para distinguir falhas de auth, de token e de banco.
- Validar que todas as rotas protegidas exigem autenticação real e não apenas `process.env` disponível.

## 5. Prioridade 2 — RLS e modelagem de privilégio

### 5.1 RLS em tudo e risco de recursão

Achados:

- O projeto já registra explicitamente a regra de recursão infinita em `docs/KNOWLEDGE-WORKSPACE.md`.
- A recomendação é mover a verificação para funções `SECURITY DEFINER` em vez de escrever políticas que consultem outra tabela com RLS recursivo.

Risco:

- Uma policy mal escrita pode travar a leitura/escrita e ainda piorar a experiência de usuário.
- Em cenários sensíveis, isso altera a percepção de segurança por causar falhas em tempo de execução.

Ação:

- Revisar todas as políticas que consultam `profiles`, `user_roles`, `mesas`, `redes`, `ministries` e `kids`.
- Usar funções auxiliares para checagem de hierarquia.
- Priorizar as tabelas de perfil, liderança e membros em auditoria de RLS.

### 5.2 Dados pessoais (`profiles`) e exposição indevida

Achados:

- O workspace alerta que `profiles` contém e-mail, telefone, endereço e data de nascimento.
- Há regra de hierarquia de acesso em `docs/KNOWLEDGE-WORKSPACE.md`.

Risco:

- Se uma policy permitir leitura indiscriminada, o app passa a expor dados pessoais de membros.

Ação:

- Validar leitura por própria pessoa, liderança ou vínculo com mesa/rede/ministério.
- Reforçar que `profiles` seja uma tabela sensível e não pública.

## 6. Prioridade 3 — robustez operacional

### 6.1 Tratamento de erros e fallback silencioso

Achados:

- Há código que registra warnings quando faltam variáveis, mas continua com valores embutidos.
- Em `auth-context.tsx`, a lógica de permissão e sessão trata `session`, `roles` e `profile` sem bloquear o carregamento completo em caso de falha parcial.

Risco:

- A UI pode continuar carregando com estado inconsistente e dar sensação de sucesso falso.
- Isso é especialmente perigoso em autenticação, porque o usuário não sabe se o sistema está autenticado e autorizado.

Ação:

- Tratar falhas como falhas explícitas, não “continuar com fallback”.
- Exibir mensagens de erro concretas em login, recuperação de senha e autorização.
- Evitar a sensação de “login deu certo” quando o RLS negou a operação.

### 6.2 Preview e ambiente de desenvolvimento

Achados:

- O armazenamento de auth em preview está em `src/integrations/supabase/previewAuthStorage.ts`.
- Ele usa um broker específico do Lovable para manter sessão compartilhada em preview.

Risco:

- Isso é útil para preview do editor, mas não deve ser usado como fonte de verdade para produção.

Ação:

- Manter o broker somente em preview.
- Certificar que o ambiente de produção não depende de `window.parent`, `location.ancestorOrigins` ou host de preview.

## 7. Checklist recomendado de ajustes

### Bloqueante

- [ ] Remover todos os fallbacks hardcoded de Supabase.
- [ ] Validar origem única de segredos em `Vercel`, `Lovable`, `Supabase`.
- [ ] Revisar `SUPABASE_SERVICE_ROLE_KEY` e garantir uso somente no servidor.
- [ ] Confirmar que `RLS` em `profiles`, `user_roles` e tabelas sensíveis está totalmente validado.

### Importante

- [ ] Revisar OAuth Google e redirect URLs do Supabase.
- [ ] Validar `auth-middleware.ts` e `requireSupabaseAuth` em rotas protegidas.
- [ ] Revisar funções `SECURITY DEFINER` para autorização hierárquica.
- [ ] Normalizar logs de auth para distinguir erro de token, de usuário e de RLS.

### Desejável

- [ ] Criar documentação operacional de ambiente e segredos.
- [ ] Registrar o modelo de ambiente por projeto/preview/produção.
- [ ] Executar checagem final de sessão e autorização em fluxos críticos.

## 8. Conclusão

A prioridade principal não é “mais uma tela” ou “novo módulo”, mas garantir que o sistema não tenha autenticação e permissões que dependam de defaults embutidos em código ou de ambientes mal definidos. O projeto já demonstra boa orientação em RLS e RBAC, mas ainda precisa de uma correção explícita de segredos e de um processo claro de validação por ambiente.

Sem esse reforço, o risco principal permanece na camada de autenticação e autorização, mesmo que a interface pareça funcionar em desenvolvimento.
