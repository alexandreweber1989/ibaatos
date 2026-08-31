# Seção 2 — Gestão de membros e comunidade

O que já existe hoje: bloco de aniversariantes no painel, ficha completa do membro, vínculos familiares (`family_links` com espelhamento automático) e campo de notas pastorais. A seção 2 completa o que falta e melhora o que já existe.

## 2.1 Aniversariantes do mês (melhoria)

- Destaque maior no painel: aniversariante do dia em evidência, próximos 7 dias e o restante do mês.
- Botão "Enviar mensagem" por pessoa, abrindo o WhatsApp com uma mensagem de parabéns já pronta (editável antes de enviar).
- Modelo de mensagem configurável pelo admin (guardado nas configurações do app).
- Filtro por igreja para quem é admin de mais de uma.

## 2.2 Mapa de membros e mesas (novo)

- Página "Mapa" mostrando membros e mesas por bairro/cidade, não por coordenadas exatas (evita expor endereço).
- Agrupamento visual por bairro com contagem de membros, mesas existentes e membros sem mesa.
- Sugestão de reorganização: lista de membros sem mesa com a mesa mais próxima (mesmo bairro, depois mesma cidade).
- Acesso restrito a pastores, apascentadores e admins.

## 2.3 Onboarding de novos membros (novo)

- Trilha de integração com etapas padrão (boas-vindas, visita/contato, curso de novos membros, definição de mesa, batismo, ministério).
- Cada novo membro recebe a trilha automaticamente; o líder marca as etapas como concluídas, com data e responsável.
- Modelos de trilha editáveis pelo admin (adicionar/remover/reordenar etapas).
- Painel de acompanhamento: quem está em qual etapa, há quanto tempo parado, quem concluiu.

## 2.4 Cadastro de família completo (melhoria)

- Bloco de família na ficha com árvore visual: cônjuge, filhos, pais, irmãos.
- Criar parente que ainda não é membro direto do bloco (cria a ficha básica e o vínculo de uma vez).
- Vinculação automática já existente mantida (cônjuge ↔ cônjuge, filho ↔ pai/mãe) e ampliada para irmãos entre filhos do mesmo casal.
- Indicação de família na listagem de membros e possibilidade de ver "todos da mesma casa".

## 2.5 Histórico pastoral (novo)

- Registro de acompanhamentos por membro: data, tipo (visita, aconselhamento, oração, ligação), texto e autor.
- Visível apenas para pastores, apascentadores e admins — invisível para o próprio membro e demais líderes.
- Nível de sigilo por anotação: "equipe pastoral" ou "somente autor".
- Linha do tempo dentro da ficha do membro, com busca e filtro por tipo.

## Detalhes técnicos

- Novas tabelas: `onboarding_templates`, `onboarding_steps`, `member_onboarding`, `member_onboarding_steps`, `pastoral_notes`.
- RLS: histórico pastoral com função `is_pastoral(uid)` (admin_geral, pastor, apascentador); onboarding legível por líderes do membro e admins.
- Novas rotas: `/mapa` e `/onboarding` (ambas sob `_authenticated`), com gate de papel.
- Componentes novos em `src/components/membros/` e `src/components/painel/`; reaproveita `family_links` e `profiles` existentes.
- Mapa sem serviço externo de mapas: agrupamento por bairro/cidade já presentes no perfil.

Ordem de entrega sugerida: 2.1 → 2.4 → 2.5 → 2.3 → 2.2.
