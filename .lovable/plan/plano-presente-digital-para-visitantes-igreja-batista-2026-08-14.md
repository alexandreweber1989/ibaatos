# Plano: Presente Digital para Visitantes (Igreja Batista)

Implementação de um presente digital (e-book PDF gratuito) para novos visitantes, integrando-o ao fluxo de boas-vindas da Igreja Batista Atos (IBA).

## Alterações Propostas

### Backend & Conteúdo

- **Sugestão de Livro:** "O Progresso do Peregrino" (John Bunyan) - um clássico absoluto da tradição batista, em domínio público e com profunda didática bíblica.
- **Armazenamento:** Disponibilizar o link direto para o PDF gratuito ou configurar um redirecionamento amigável.

### Interface do Usuário (UI)

- **Tela de Sucesso (/boas-vindas):**
  - Adicionar o título e autor do livro no card de presente.
  - Incluir um botão "Baixar meu Presente Agora" visível imediatamente após o cadastro.
  - Melhorar a experiência visual com um ícone de livro.

### Fluxo de Comunicação

- Atualizar a mensagem visual de confirmação para ser mais específica sobre o conteúdo do presente.

## Detalhes Técnicos

- Edição do componente `src/routes/boas-vindas.tsx` para injetar as informações do livro.
- Criação de uma constante para o link do PDF, permitindo troca fácil pela liderança da igreja no futuro.
