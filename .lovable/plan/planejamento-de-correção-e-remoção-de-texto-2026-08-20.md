# Planejamento de Correção e Remoção de Texto

O objetivo deste plano é remover o texto instrucional (Prompt Anti-Alucinação) que está visível na página inicial e identificar/remover um botão fantasma ou em branco relatado na página de Mídia (YouTube Atos).

## Passos para Implementação

### 1. Limpeza da Página Inicial

Remover o texto explicativo sobre "Anti-Alucinação" do arquivo `src/routes/index.tsx`. Este texto parece ter sido injetado acidentalmente ou deixado como rascunho.

### 2. Correção na Central de Mídia

Investigar e remover o botão que aparece "em branco" na aba YouTube Atos da Central de Mídia. Pelo código visualizado, existe uma área de ações vazia ou um botão mal posicionado que causa estranheza visual (visto no print do usuário).

### Detalhes Técnicos

- **Arquivo `src/routes/index.tsx`**: Limpar o conteúdo textual nas primeiras linhas do componente ou fora dele que esteja renderizando no topo da página.
- **Arquivo `src/routes/_authenticated/midia.tsx`**: Verificar o bloco de `actions` no `PageHeader` e a transição entre as tabs para garantir que não existam elementos fantasmas renderizando por trás ou fora de lugar.

---

### Relatório de Execução Sugerido (após aplicação)

**Padrão utilizado:** Hotfix / UI Cleanup
**Sub-agentes ativados:** UI Architect, Code Auditor.
**Resumo:** Removido texto de controle interno da homepage e corrigido elemento visual indesejado na Central de Mídia.
