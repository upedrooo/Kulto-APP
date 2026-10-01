<div align="center">

<img src="imagens/marca.png" alt="Kulto" width="100%">

### Reviews de filme, série, livro e game num lugar só.

Feed cronológico, sem algoritmo. Web primeiro, iOS e Android depois.

**[kulto.me](https://kulto.me)** · no ar, com conta, pagamento e dados reais · **[docs.kulto.me](https://docs.kulto.me)**

![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white)
![React Native 0.81](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NativeWind 4](https://img.shields.io/badge/NativeWind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![TanStack Query 5](https://img.shields.io/badge/TanStack%20Query-5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Deno](https://img.shields.io/badge/Edge%20Functions-Deno-70FFAF?style=flat-square&logo=deno&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-pagamentos-635BFF?style=flat-square&logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deploy-000000?style=flat-square&logo=vercel&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-instal%C3%A1vel-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-pt%20%C2%B7%20en%20%C2%B7%20es-A3A099?style=flat-square)

</div>

---

Quem lê, assiste e joga hoje tem a vida espalhada: Letterboxd para filme,
Skoob para livro, Backloggd para game, um print no story para série. O
histórico fica repartido entre quatro serviços que não conversam, e a pessoa
que consome as quatro mídias não tem um lugar que a represente por inteiro.

O Kulto é esse lugar. Uma review, uma nota por critério, um perfil que reúne
tudo — e um feed que mostra o que quem você segue publicou, na ordem em que
foi publicado.

> Este repositório é uma **vitrine técnica**. O código-fonte do Kulto é
> fechado; aqui ficam a arquitetura, as decisões e trechos representativos do
> que foi construído.

---

## O que está de pé

O app está em produção na web, com conta real, pagamento real e dados reais.

| Área                | Estado                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| Autenticação        | E-mail/senha + Google OAuth, confirmação por e-mail, troca e recuperação de senha |
| Busca de obras      | TMDB, Open Library e IGDB atrás de uma Edge Function única                        |
| Reviews             | Nota por categoria (variável conforme a mídia), texto, edição e exclusão          |
| Social              | Seguir, curtir, feed cronológico, perfis públicos por `@handle`                   |
| Conquistas          | 10 conquistas × 4 níveis, com motor de verificação no servidor                    |
| Notificações        | Realtime via Postgres changes, com agrupamento de curtidas                        |
| Monetização         | Apoio único via Stripe, com selo e medalha concedidos por webhook                 |
| Internacionalização | Português, inglês e espanhol                                                      |
| Temas               | Escuro e claro, seguindo o sistema                                                |
| PWA                 | Instalável, com aviso de nova versão                                              |

## Em números

```
17.032  linhas de TypeScript/TSX
    28  telas (Expo Router, rotas por arquivo)
    69  componentes
    12  tabelas no Postgres
    29  políticas RLS
    17  migrations
     3  Edge Functions (Deno)
     3  idiomas
```

## A stack, e por que cada peça

| Camada            | Escolha                                                          | Por quê                                                                                      |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| App               | **Expo SDK 54** · React Native 0.81 · React 19                   | Um código para web, iOS e Android. A web é o lançamento; as lojas vêm depois sem reescrever. |
| Rotas             | **Expo Router 6**                                                | Rotas por arquivo, com URL de verdade na web — `kulto.me/@usuario` é link compartilhável.    |
| Estilo            | **NativeWind 4** (Tailwind 3)                                    | As mesmas classes nas três plataformas, sobre um conjunto fechado de tokens.                 |
| Dados de servidor | **TanStack Query 5**                                             | Cache, revalidação e estados de carregamento/erro sem escrever um reducer.                   |
| Estado local      | **Zustand 5**                                                    | Para o punhado de coisas que são de fato globais (convite de fundador, sessão).              |
| Formulários       | **react-hook-form + Zod 4**                                      | Validação declarada uma vez, tipada, compartilhada entre cliente e schema.                   |
| Backend           | **Supabase** (Postgres, Auth, Storage, Realtime, Edge Functions) | Postgres de verdade, com RLS como fronteira de segurança — não um BaaS opaco.                |
| Animação          | **Reanimated 4**                                                 | Animação na thread de UI; folhas e transições que não travam com a lista rolando.            |
| Observabilidade   | **Sentry** + **PostHog**                                         | Ambos opcionais: sem chave, viram no-op e o app roda igual.                                  |

Detalhe de cada escolha em **[docs/stack.md](docs/stack.md)**.

## Arquitetura em uma imagem

```
┌──────────────────────────────────────────────────────────┐
│  Expo Router  ·  web (Vercel) · iOS · Android            │
│                                                          │
│  telas ── componentes ── design tokens                   │
│    │                                                     │
│    ├── TanStack Query ──────┐                            │
│    └── Zustand (local)      │                            │
└─────────────────────────────┼────────────────────────────┘
                              │ supabase-js (JWT do usuário)
                              ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase                                                │
│                                                          │
│  Postgres + RLS ◄── a fronteira de segurança             │
│    triggers: notificações, conquistas, cooldown do @     │
│                                                          │
│  Realtime ──► notificações chegam sem refresh            │
│                                                          │
│  Edge Functions (Deno)                                   │
│    search-works ──► TMDB · Open Library · IGDB           │
│    check-achievements ──► motor de conquistas            │
│    stripe-webhook ──► concede selo e medalha             │
└──────────────────────────────────────────────────────────┘
```

O desenho completo, com o modelo de dados e o caminho de cada operação, está
em **[docs/arquitetura.md](docs/arquitetura.md)**.

## Trechos de código

Cinco exemplos representativos, comentados, em **[exemplos/](exemplos/)**:

| Arquivo                                                           | O que mostra                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`rls-e-triggers.sql`](exemplos/rls-e-triggers.sql)               | Segurança no banco: RLS por tabela, notificação por trigger, regra de negócio que o cliente não consegue burlar |
| [`stripe-webhook.ts`](exemplos/stripe-webhook.ts)                 | Edge Function em Deno: verificação de assinatura com Web Crypto, idempotência, concessão de benefício           |
| [`notificacoes-agrupadas.ts`](exemplos/notificacoes-agrupadas.ts) | Realtime + uma função pura testável separada do hook                                                            |
| [`folha-que-sobe.tsx`](exemplos/folha-que-sobe.tsx)               | Reanimated: três armadilhas reais de animação e como foram resolvidas                                           |
| [`design-tokens.js`](exemplos/design-tokens.js)                   | Paleta fechada com dois temas, consumida por Tailwind e por código                                              |

## Decisões que valem ser contadas

Portfólio bom não é lista de tecnologia — é decisão com motivo. As dez que
mais moldaram o Kulto estão em **[docs/decisoes.md](docs/decisoes.md)**.
Três delas:

**A segurança mora no banco, não no cliente.** Toda tabela tem RLS, e o app
nunca vê uma `service_role`. O cliente pede o que quiser; quem decide o que
volta é o Postgres. A consequência prática: uma tela mal escrita vira um bug
visual, nunca um vazamento.

**A paleta é fechada por decreto.** O Tailwind foi configurado **sem**
`white`, `black` e sem os cinzas padrão. Não é purismo: hex solto num arquivo
qualquer é como um design system morre, e um tema claro que ninguém testou
começa aí. Cada cor aponta para uma variável CSS que o tema troca em tempo de
execução.

**Os textos do app são um arquivo tipado.** As três traduções são objetos
TypeScript, e a chave é conferida na compilação. Remover uma string usada em
tela **quebra o build** em vez de virar `notifications.like` aparecendo para
o usuário.

## A marca

O nome vem de **culto** — no sentido de quem cultiva o que consome, e de quem
tem cultura sobre aquilo. O K troca o C porque a marca precisava de um
símbolo que funcionasse sozinho, e um K desenhado em quatro pétalas dá isso:
as **quatro mídias** do app, girando em torno do mesmo centro.

<div align="center">
  <img src="imagens/marca.png" alt="Símbolo e assinatura do Kulto" width="70%">
</div>

O símbolo vive sozinho no ícone do app, no canto do cabeçalho e no bloco creme
da tela de entrada. A assinatura completa aparece onde há espaço e onde a
marca precisa se apresentar por extenso.

### Cor

**Monocromático.** Creme sobre preto, com uma escala curta de ambientes entre
os dois — nunca preto puro, que fecha a tela.

![Paleta neutra](imagens/paleta.png)

A cor entra em três lugares, e **só significando alguma coisa**. As mídias
têm cada uma a sua, com o mesmo peso entre si, e ela aparece só em ícone, chip
ou traço — nunca como fundo de superfície:

![Cores das mídias](imagens/paleta-verticais.png)

E os estados, que comunicam e não decoram — o azul do "ver depois" é o caso
mais claro: sem ele, guardado e não guardado seriam o mesmo desenho.

![Cores de estado](imagens/paleta-estado.png)

> A paleta é **fechada no Tailwind**: `white`, `black` e os cinzas padrão
> foram removidos da configuração. Se a classe não existe, o hex solto não
> entra — e o tema claro não nasce quebrado.

### Tipografia

**Space Grotesk** para o que se lê: título, corpo, botão.
**Inter com `tabular-nums`** para o que se compara: nota, contador, timestamp,
rótulo em caixa alta. Números que mudam de largura fazem a coluna tremer —
`4,5` e `1,1` precisam ocupar o mesmo espaço.

### Elevação é borda, não sombra

`boxShadow` está desativado no tema. O que precisa parecer acima usa
superfície mais clara e uma borda de 1px. Sombra sobre fundo quase preto vira
borrão cinza e muda de aparência entre navegadores; borda é nítida em qualquer
tela.

### Voz

Seca, direta, com ponto final. Sem exclamação, sem emoji decorativo. O botão
diz o que vai acontecer, e o aviso seguinte confirma no mesmo verbo.

> Ainda sem review de quem você segue.
> Siga alguém pra ver as reviews aqui.

As regras completas, com a conta da zona segura dos cartazes, em
**[docs/design.md](docs/design.md)**.

## Telas

|                                                            |                                                    |
| ---------------------------------------------------------- | -------------------------------------------------- |
| ![Entrada](imagens/entrada.png)                            | ![Feed](imagens/feed.png)                          |
| **Entrada** — os cartazes se revezam na coluna da direita  | **Início** — feed cronológico, sem algoritmo       |
| ![Perfil](imagens/perfil.png)                              | ![Acervo](imagens/acervo.png)                      |
| **Perfil** — capa, conquistas, favoritos e últimas reviews | **Acervo** — balanço, destaques e filtro por mídia |
| ![Nova review](imagens/nova-review.png)                    | ![Notificações](imagens/notificacoes.png)          |
| **Nova review** — a nota é um conjunto de critérios        | **Notificações** — curtidas agrupadas por review   |

As nove capturas, com legenda, em **[imagens/](imagens/)**.

---

## Sobre

Kulto é um projeto autoral, tocado do desenho ao deploy — produto, design,
front-end, banco, infraestrutura e o site de documentação.

## Contato

**Pedro Silva** · [LinkedIn](https://www.linkedin.com/in/pedro-lucas-silva-6b1678358/?isSelfProfile=true) · [pedrol09872@gmail.com](mailto:pedrol09872@gmail.com)

## Licença

Todos os direitos reservados. Os textos, imagens e trechos de código deste repositório são apresentados para fins de portfólio e consulta; não podem ser reutilizados comercialmente sem autorização. Veja [`LICENSE`](LICENSE).
