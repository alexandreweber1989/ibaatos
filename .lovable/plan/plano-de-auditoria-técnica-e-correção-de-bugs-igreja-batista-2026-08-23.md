# Plano de Auditoria Técnica e Correção de Bugs - Igreja Batista Atos

Este plano detalha a auditoria profunda solicitada para identificar e corrigir falhas em toda a plataforma.

## 1. Análise e Diagnóstico

- [ ] **Interface e Responsividade**: Verificar todos os componentes `src/components/ui` e páginas em `src/routes`.
- [ ] **Segurança e RLS**: Auditar migrations em `supabase/migrations/` e garantir que não haja recursão infinita ou vazamento de PII.
- [ ] **Estado e Performance**: Verificar uso de `useQuery`, `useMemo`, `useCallback` e identificar re-renderizações excessivas.
- [ ] **Auth e Sessão**: Testar fluxos em `src/lib/auth-context.tsx` e middleware de proteção de rotas.
- [ ] **Erros de Runtime**: Analisar logs do console e erros reportados pelo Vite/React.

## 2. Correções Técnicas

- [ ] **Depreciações**: Atualizar `inputValidator()` para `validator()` em `createServerFn` (TanStack Start v1).
- [ ] **RLS Recursion**: Garantir que todas as tabelas usem funções `SECURITY DEFINER` para checagem de permissões hierárquicas.
- [ ] **Hydration Errors**: Corrigir possíveis mismatches de hidratação em componentes que acessam `window` ou `localStorage`.
- [ ] **Tratamento de Erros**: Adicionar `ErrorBoundaries` e melhorar o feedback visual em falhas de API.

## 3. Melhorias de UX e Performance

- [ ] **Loading States**: Adicionar skeletons em todas as telas de carregamento de dados.
- [ ] **Bundle Size**: Verificar se há pacotes pesados que podem ser carregados dinamicamente.
- [ ] **Acessibilidade**: Garantir semantic HTML e suporte a leitores de tela.

## 4. Validação Final

- [ ] Testes E2E (Playwright) nos fluxos críticos (Login, Cadastro de Membro, Cuidado).
- [ ] Varredura completa de console logs em produção.
