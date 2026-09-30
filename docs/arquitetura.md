# Arquitetura

[← voltar](../README.md)

O Kulto é um app Expo que fala com um Postgres através do Supabase. Não há
servidor de aplicação no meio: o cliente conversa direto com o banco, e é o
banco que decide o que cada um pode ver. O pouco que precisa de segredo — uma
chave de API externa, um webhook de pagamento — vive em Edge Functions.

## O modelo de dados

Doze tabelas. As relações que importam:

```
profiles ──┬── follows ──────► profiles      quem segue quem
           │
           ├── reviews ───────► works        uma review por obra, por pessoa
           │      │
           │      ├── review_ratings         uma nota por categoria
           │      ├── review_likes
           │      └── review_reports
           │
           ├── favorites ─────► works        "ver depois"
           ├── user_achievements ► achievements
           └── notifications

works ◄── cache local de TMDB / Open Library / IGDB
rating_categories ── critérios de nota, variáveis por mídia
```

Três decisões estruturais:

**`works` é cache, não catálogo.** A busca consulta as bases externas ao vivo.
Quando alguém publica uma review, a obra é copiada para o banco — capa, ano,
mídia. Assim a review continua existindo se a fonte mudar, e a mesma obra
aparece igual para todo mundo. A chave é `(source, external_id)`, única.

**A nota não é um número, é um conjunto.** `review_ratings` guarda uma nota
por categoria, e as categorias mudam conforme a mídia: um filme se avalia por
direção e fotografia; um game, por jogabilidade. A nota geral é derivada, não
digitada.

**As notificações são uma tabela, não um serviço.** Quem escreve nelas são
triggers do próprio banco, e o cliente assina as mudanças por Realtime.

## Onde a segurança mora

**No banco.** Toda tabela tem RLS ligada, com política por operação — 29 no
total. O app carrega a `anon key`, que sozinha não abre nada: o que o
Postgres devolve depende do JWT do usuário.

A `service_role`, que ignora RLS, **nunca chega ao cliente**. Ela existe em
exatamente um lugar: nas variáveis de ambiente das Edge Functions, no
servidor.

Isso muda o que um erro custa. Uma tela que pede a lista errada não vaza nada
— ela recebe uma lista vazia. Para vazar dados seria preciso escrever uma
política errada, que é um arquivo pequeno, revisado, e que vive junto do
schema.

Regras de negócio que não podem ser burladas ficam no banco pelo mesmo
motivo. Exemplo real: o nome de usuário só pode mudar a cada 14 dias. Isso é
um trigger — desligar o JavaScript não dá duas trocas no mesmo dia.

## O caminho de uma review

Da busca ao feed de quem segue:

```
1. a pessoa digita "duna"
        │
        ▼
2. Edge Function `search-works`
   consulta TMDB, Open Library e IGDB em paralelo
   normaliza os três formatos num só
   (a chave das APIs fica aqui, nunca no app)
        │
        ▼
3. escolhida a obra, ela é gravada em `works`
   (upsert por source + external_id — não duplica)
        │
        ▼
4. as categorias de nota vêm de `rating_categories`,
   filtradas pela mídia da obra
        │
        ▼
5. publicar = insert em `reviews` + insert em `review_ratings`
   se o segundo falhar, o primeiro é desfeito à mão:
   review sem nota não deveria existir
        │
        ├──► trigger: notifica quem segue o autor
        └──► Edge Function `check-achievements`
             recalcula o progresso e concede o que venceu
        │
        ▼
6. o feed de quem segue já tem a review
```

## As três Edge Functions

Funções Deno, rodando no Supabase. Cada uma existe por um motivo que o
cliente não resolve:

**`search-works`** — guarda as chaves de TMDB e IGDB. Se estivessem no app,
estariam no bundle, e bundle de web é texto aberto. De quebra, normaliza três
formatos de resposta diferentes numa forma só, então o app não sabe de qual
base veio a obra.

**`check-achievements`** — o motor de conquistas. Roda no servidor porque
conquista concedida pelo cliente é conquista que se falsifica.

**`stripe-webhook`** — recebe o `checkout.session.completed`, confere a
assinatura do Stripe e concede o selo e a medalha de fundador. Sem JWT, porque
quem chama é o Stripe, não um usuário — daí a assinatura ser a única forma de
saber que a chamada é legítima. O código está em
[exemplos/stripe-webhook.ts](../exemplos/stripe-webhook.ts).

## Estado no cliente

Duas ferramentas, com uma divisão que não se cruza:

**TanStack Query** cuida de tudo que vem do servidor. Cada consulta é um hook
em `lib/`, com a chave de cache nomeada por domínio — `['user-reviews', id]`,
`['notifications', id]`. Quem escreve invalida as chaves que a escrita afeta.

**Zustand** cuida do punhado de coisas que são de fato locais e globais: a
sessão, o convite de fundador que pode ser aberto de três telas diferentes.

O que **não** existe: contexto global de dados, prop drilling de listas,
estado de servidor duplicado em `useState`.

## A web não é um detalhe

O app nasceu para a web e vai para as lojas depois, o que impõe coisas que um
app só-nativo ignora:

- **URL é funcionalidade.** `kulto.me/@usuario` e `kulto.me/r/<id>` são links
  reais, compartilháveis, com Open Graph próprio gerado sob demanda.
- **Recarregar a página é um estado.** Toda tela que abre por link direto
  precisa saber se tem para onde voltar — `router.canGoBack()` aparece em
  todo modal do app.
- **O PWA é instalável** e avisa quando há versão nova, comparando a versão
  do bundle com um `version.json` publicado a cada release.
- **Detalhes do Safari viram bug de layout.** Campo com fonte menor que 16px
  faz o iPhone dar zoom ao focar, e o zoom desenquadra a tela inteira.

## Qualidade

- **TypeScript strict**, sem `any` implícito.
- **ESLint + Prettier**, rodando no CI a cada push.
- **Os textos são tipados**: as chaves de tradução são conferidas na
  compilação. Uma string removida do dicionário quebra o build.
- **Migrations numeradas e idempotentes**, aplicadas em ordem, nunca editadas
  depois de aplicadas.
