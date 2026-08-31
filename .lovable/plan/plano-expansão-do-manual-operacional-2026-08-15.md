# Plano: Expansão do Manual Operacional

Implementar um sistema de detalhes interativos no Manual Operacional, permitindo que cada módulo (card) seja expandido para uma visualização completa com explicações detalhadas, fluxos de trabalho e capturas de tela conceituais.

## Alterações Sugeridas

### Frontend (UI/UX)

- **Modal de Detalhes**: Criar um componente de diálogo (ou utilizar o `Sheet` do shadcn) que abre ao clicar em um card do manual.
- **Conteúdo Expandido**: Adicionar descrições detalhadas para cada módulo, incluindo:
  - **Dashboard**: Lógica de priorização de avisos e integração de métricas em tempo real.
  - **Membros**: Detalhes do Onboarding, trilha de discipulado e critérios de visibilidade do Mapa.
  - **Louvor**: Funcionamento da transposição, integração com CifraClub e gestão de repertório.
  - **Kids**: Protocolos de segurança em caso de alertas e fluxo de check-in/checkout.
  - **Cuidado**: Regras de privacidade (RLS) para pedidos de oração e fluxos de assistência social.
  - **Agenda**: Lógica de endereços múltiplos e sincronização de calendário.
  - **Visitantes**: Automação de WhatsApp e entrega de presentes digitais.

### Técnico

- Refatorar a lista de módulos no `PlatformManual` para uma estrutura de dados (array de objetos) para facilitar a manutenção e a renderização do conteúdo detalhado.
- Utilizar `Framer Motion` para transições suaves ao abrir os detalhes.

## Detalhes Técnicos

- **Componentes**: `Dialog`, `ScrollArea`, `Badge`, `Tabs` (para organizar sub-seções dentro do manual detalhado).
- **Estilo**: Manter a tipografia `Syne` e `Plus Jakarta Sans` e o estilo minimalista dark.
- **Responsividade**: Garantir que a visualização detalhada seja legível em dispositivos móveis.
