# Plano de Implementação: Pedidos Online com Retirada Presencial

Ajustar a seção "Fases Concluídas" (Roadmap) no dashboard e garantir que a experiência de Livraria e Cantina reflita o modelo de "reserva com retirada na igreja".

## Alterações Propostas

### Frontend e Texto

- **Dashboard (`src/routes/_authenticated/dashboard.tsx`)**:
  - Renomear o item "rbca — menus dinâmicos por cargo" (ou similar) no Roadmap para "Pedidos online: reserva com retirada na igreja".
  - _Nota_: O usuário mencionou "parte 8", que no dashboard corresponde à seção de Roadmap.

### Ajustes nas Lojas (Livraria e Cantina)

- Validar se o fluxo de "retirada na igreja" já está claro nos componentes `LivrariaCatalog` e `CantinaMenus`.
- Adicionar/reforçar o aviso de retirada presencial nos rodapés dos pedidos.

## Detalhes Técnicos

- Edição do array de strings no componente `Dashboard` na rota `/_authenticated/dashboard`.
- Verificação de RLS nas tabelas `orders` e `canteen_reservations` para garantir que apenas o dono e admins acessem os dados.

---

### Relatório de Execução (Prévia)

**Padrão utilizado:** Feature Refinement / UX Alignment

**Sub-agentes ativados:**

- **UI Architect** — [X] Executado
- **Supabase Engineer** — [-] Não necessário
- **Code Auditor** — [X] Executado
- **Testing Agent** — [-] Não necessário
- **SEO Optimizer** — [-] Não necessário
- **Deploy Ops** — [-] Não necessário
- **API Integrator** — [-] Não necessário

**Resumo:** O Roadmap do dashboard será atualizado para refletir a conclusão do sistema de pedidos online com retirada presencial, alinhando a comunicação visual com a funcionalidade implementada nas rotas de Livraria e Cantina.
