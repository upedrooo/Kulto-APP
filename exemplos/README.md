# Exemplos de código

[← voltar](../README.md)

Cinco trechos do Kulto, escolhidos porque cada um mostra uma decisão, não só
uma sintaxe. São extraídos do código real — comentários inclusive.

| Arquivo                                                    | Assunto                                                                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[rls-e-triggers.sql](rls-e-triggers.sql)**               | Como a segurança e as regras de negócio vivem dentro do Postgres: RLS composta, cooldown de `@` como trigger, notificação como efeito do dado, curtida que não vira spam |
| **[stripe-webhook.ts](stripe-webhook.ts)**                 | Edge Function em Deno, sem JWT: verificação de assinatura com Web Crypto, idempotência por `unique violation`, e por que não há chave da API do Stripe ali dentro        |
| **[notificacoes-agrupadas.ts](notificacoes-agrupadas.ts)** | Realtime por Postgres changes, e uma regra de agrupamento tirada do hook para poder ser testada de verdade                                                               |
| **[folha-que-sobe.tsx](folha-que-sobe.tsx)**               | Reanimated: três armadilhas de animação que só aparecem no aparelho, com o sintoma de cada uma                                                                           |
| **[design-tokens.js](design-tokens.js)**                   | Paleta fechada, dois temas por variável CSS, e a escala tipográfica — a fonte única de cor do app                                                                        |

## O que procurar em cada um

**`rls-e-triggers.sql`** — a política de `reviews` é composta: uma review
pública num perfil que fechou some junto. A regra mora num lugar só; espalhar
isso pelas telas seria garantir que uma esqueceria metade.

**`stripe-webhook.ts`** — o id de quem pagou vem do evento **assinado pelo
Stripe**, nunca do corpo cru. É o que impede alguém de pedir o selo para
outra conta. E o SDK é instanciado com uma chave de propósito inexistente,
porque a função nunca chama a API — só verifica assinatura.

**`notificacoes-agrupadas.ts`** — o canal do Realtime tem nome único por
instância. Dois componentes montados com o mesmo nome derrubam um ao outro,
em silêncio, e a tela simplesmente para de atualizar.

**`folha-que-sobe.tsx`** — a terceira armadilha é a mais cara: o teclado muda
a altura medida, o efeito roda de novo e a folha sobe outra vez no meio da
digitação.

**`design-tokens.js`** — não há `white` nem `black` no Tailwind do projeto. A
paleta foi substituída inteira.
