# Plano de Responsividade 100%

O objetivo é garantir que toda a aplicação seja fluida e adaptativa em todos os dispositivos, do mobile ao ultrawide, eliminando overflows e melhorando a usabilidade.

## Análise de Domínios e Impacto

1.  **Layout Base (`src/components/app-shell.tsx`)**
    - **Sidebar**: Já possui Drawer para mobile, mas precisa de refinamento em telas médias (tablets).
    - **Main Content**: Garantir que o grid de layout não cause overflow.
2.  **Página Inicial (`src/routes/index.tsx`)**
    - **Hero**: Título dinâmico (LinhaGlitch) precisa de ajustes para não quebrar em telas ultra-pequenas.
    - **Nossa Gênese (Historia)**: A animação de scroll pode ser agressiva em mobile; precisa de ajuste de espaçamento.
3.  **Formulário de Leads (`src/components/home/cadastro-lead.tsx`)**
    - Ajustar o container para ser `w-full` em mobile e crescer gradualmente.
    - Garantir que os `select` e `input` não quebrem o layout em telas estreitas.
4.  **Painéis Administrativos (`src/routes/_authenticated/*`)**
    - **Dashboard**: Cards de estatísticas precisam de grid adaptativo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
    - **Tabelas**: Implementar scroll horizontal seguro ou alternar para visualização em cards em mobile.
    - **Páginas de Listagem (Mesas, Ministérios)**: Ajustar o grid para evitar cards muito estreitos.

## Etapas de Implementação

### 1. Refinamento do Layout Global

- Ajustar `PageHeader` e `PageBody` em `src/components/app-shell.tsx` para usar padding responsivo.
- Garantir que o `NoiseOverlay` e fundos não interfiram no scroll mobile.

### 2. Otimização da Homepage

- Ajustar o `LinhaGlitch` em `src/routes/index.tsx` para ser mais conservador em fontes pequenas.
- Corrigir o padding da seção `Historia` para evitar que o texto fique colado nas bordas no mobile.

### 3. Ajustes nos Componentes de Formulário

- Refinar o `CadastroLead` para melhor usabilidade em telas touch (espaçamento entre inputs).

### 4. Responsividade nos Módulos Internos

- Revisar rotas de `membros`, `mesas` e `dashboard` aplicando a regra de "Mobile-First".

## Detalhes Técnicos

- **Breakpoints**: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`.
- **Flex/Grid**: Uso intensivo de `flex-col md:flex-row` e `grid-cols-1 md:grid-cols-2`.
- **Touch area**: Botões com `h-11 md:h-14` para facilitar o clique.
- **Font Scaling**: Uso de `text-base md:text-lg lg:text-xl` para hierarquia visual fluida.

---

### Relatório de Execução (Prévia)

**Padrão utilizado:** Enterprise Edition (Multi-agente)

**Sub-agentes ativados:**

- **UI Architect** — [X] Analisando e estruturando a responsividade
- **Code Auditor** — [X] Verificando quebras de layout
- **Deploy Ops** — [-] Não necessário agora
