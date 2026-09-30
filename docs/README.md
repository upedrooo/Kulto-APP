# Documentação

[← voltar](../README.md)

| Documento                            | O que tem dentro                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[arquitetura.md](arquitetura.md)** | O modelo de dados, onde a segurança mora, o caminho de uma review da busca ao feed, as três Edge Functions e como o estado é dividido no cliente |
| **[stack.md](stack.md)**             | Cada escolha de tecnologia com o motivo — inclusive onde a decisão foi contra o padrão — e o que ficou de fora                                   |
| **[decisoes.md](decisoes.md)**       | Dez decisões de produto e engenharia que moldaram o app, com o custo de cada uma                                                                 |
| **[design.md](design.md)**           | A regra de cor, as três exceções, tipografia, voz, e a conta da zona segura dos cartazes                                                         |

## Em três parágrafos, para quem tem pressa

O **Kulto** junta filme, série, livro e game num perfil só, com feed
cronológico e sem algoritmo. É um app Expo — um código para web, iOS e
Android — falando direto com um Postgres no Supabase, sem servidor de
aplicação no meio.

A decisão central é que **a segurança e as regras de negócio moram no banco**.
Toda tabela tem RLS; a `service_role` nunca chega ao cliente; regra que não
pode ser burlada é trigger, não verificação de formulário. O que precisa de
segredo — chaves de API externas, webhook de pagamento — vive em três Edge
Functions em Deno.

No cliente, estado de servidor é do TanStack Query e o resto é local. O
visual sai de um conjunto fechado de tokens, com a paleta do Tailwind
substituída inteira para que hex solto não tenha por onde entrar. Os textos
dos três idiomas são objetos TypeScript com chaves conferidas na compilação.
