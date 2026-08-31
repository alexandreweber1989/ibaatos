# Plano de Implementação: Endereço Principal para Mesas

Este plano descreve a implementação da funcionalidade de "Endereço Principal" para as Mesas, permitindo que um endereço seja eleito como padrão e selecionado automaticamente ao criar eventos, mantendo a flexibilidade de escolha.

## 1. Alterações no Banco de Dados (Supabase)

### Adição de Coluna `is_main`

- Adicionar a coluna `is_main` (boolean, padrão false) na tabela `public.mesa_addresses`.
- Criar uma função e gatilho (trigger) para garantir que apenas um endereço seja o principal por mesa (ao marcar um como principal, os outros da mesma mesa devem ser desmarcados).

## 2. Interface de Gerenciamento de Endereços (`AddressManager`)

### UI de "Endereço Principal"

- Adicionar um botão de estrela ou checkbox "Principal" em cada card de endereço em `src/components/admin/address-manager.tsx`.
- Exibir um badge "Principal" visualmente distinto no endereço selecionado.
- Adicionar opção de marcar como principal ao adicionar um novo endereço.

### Lógica de Mutação

- Implementar mutação para atualizar o status `is_main`.

## 3. Diálogo de Agendamento de Eventos (`MesaEventDialog`)

### Seleção Automática

- Modificar o `MesaEventDialog` em `src/components/events/mesa-event-dialog.tsx` para carregar o endereço principal da mesa por padrão.
- Se houver um endereço com `is_main: true`, ele será o valor inicial do select.

### Flexibilidade de Escolha

- Manter a lista de seleção para permitir a troca manual para outro endereço cadastrado.

## Detalhes Técnicos

- **Tabela:** `public.mesa_addresses`
- **Componentes:** `AddressManager`, `MesaEventDialog`
- **Estilo:** Seguir o padrão de tokens semânticos e design do projeto (Tailwind v4).
