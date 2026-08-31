# Plano de Implementação: Redesign Imersivo 3D da Seção "Nossa Gênese"

O objetivo é transformar a seção "Nossa Gênese" em uma experiência de scrolltelling 3D profunda, onde os capítulos (CAP 01, 02, 03) parecem estar em diferentes camadas de profundidade, criando um efeito de "mergulho" (depth immersion) conforme o usuário rola a página.

## Alterações Propostas

### 1. Estrutura de Camadas (Layers)

- Implementar um sistema de 3 camadas por capítulo:
  - **Fundo (Background):** Números gigantes do ano/marca com opacidade baixa e movimento lento.
  - **Meio (Content):** Título e texto principal com movimento moderado.
  - **Frente (Foreground):** Elementos decorativos ou ícones que passam rápido pela tela, reforçando a profundidade.

### 2. Efeito de Profundidade (Z-Axis)

- Utilizar o `scrollYProgress` do Framer Motion para controlar não apenas a opacidade e o Y, mas também o `scale` (escala) e o `z` (profundidade).
- Conforme o usuário rola, o capítulo atual "cresce" e desaparece em direção à câmera, enquanto o próximo capítulo surge do fundo da tela.

### 3. Atmosfera e Iluminação

- Adicionar gradientes radiais dinâmicos que mudam de posição e intensidade baseados no scroll.
- Implementar um efeito de "parallax focal", onde o fundo desfoca levemente quando o texto está nítido, e vice-versa.

### 4. Refinamento da Navegação

- Manter a linha do tempo lateral, mas torná-la mais orgânica, com os pontos de navegação reagindo à proximidade do scroll.

## Detalhes Técnicos

- **Framer Motion:** Uso intensivo de `useTransform` para mapear o scroll em `perspective`, `translateZ` e `scale`.
- **CSS:** Adição de `perspective: 1000px` no container pai para habilitar transformações 3D reais.
- **Responsividade:** Ajuste das escalas de profundidade para telas menores, garantindo que o texto nunca fique ilegível ou saia da área visível.

## Verificação

- Testar a fluidez da animação em diferentes velocidades de scroll.
- Validar a legibilidade dos textos durante as transições de profundidade.
- Garantir que o modo `reduce-motion` continue oferecendo uma versão estática e funcional.
