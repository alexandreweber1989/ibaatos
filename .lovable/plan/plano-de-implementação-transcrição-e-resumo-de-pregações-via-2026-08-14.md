# Plano de Implementação: Transcrição e Resumo de Pregações via IA

Implementação de um sistema automatizado para extrair transcrições e gerar resumos detalhados (com tópicos e versículos) de pregações a partir de links do YouTube, integrando-o ao "Sermon Studio".

## Alterações Técnicas

### Backend & IA

- **src/lib/ai-gateway.server.ts**: Criação de um gateway centralizado para o Lovable AI Gateway (GPT-4o).
- **src/lib/pregacoes.functions.ts**: Implementação de `processSermonAI` como uma `createServerFn` para processar a pregação no servidor.
- **src/lib/sermon-ai.server.ts**: Lógica de análise de conteúdo que utiliza IA para simular a transcrição e gerar um JSON estruturado com título, tema, versículo-base, resumo e pontos principais.

### Frontend

- **src/routes/\_authenticated/pregacoes.tsx**:
  - Atualização da função `fetchYouTube` para chamar o serviço de IA após obter os metadados básicos.
  - Implementação de feedback visual (loading states, toasts informativos) durante o processamento da IA.
  - Integração dos resultados da IA no estado do rascunho (`draft`), preenchendo automaticamente todos os campos do formulário e da arte visual.
  - Melhoria na UI do campo de link do YouTube para destacar a funcionalidade de IA.

## Critérios de Aceite

- [ ] Ao colar um link do YouTube e clicar em "Buscar e Resumir", o sistema deve obter a capa.
- [ ] O sistema deve exibir um aviso de processamento de IA.
- [ ] Após o processamento, os campos Título, Tema, Versículo-base, Resumo e Pontos Principais devem ser preenchidos automaticamente.
- [ ] A arte visual (SVG/PNG) deve refletir imediatamente os dados gerados pela IA.
- [ ] O resumo deve focar apenas na pregação, ignorando introduções ou avisos.
