# A stack, escolha por escolha

[← voltar](../README.md)

Cada linha aqui é uma decisão com custo. O que segue é o motivo de cada uma —
inclusive onde a escolha foi contra o padrão do mercado.

## Expo SDK 54, e não 57

O `create-expo-app` instala a versão mais recente. O projeto ficou na 54 de
propósito: o NativeWind estável (v4) é validado até a SDK 54, e a v5, que
acompanha as versões novas, era pre-release. Entre ferramenta estável com
material de consulta e o número mais alto, a escolha foi a primeira. Subir de
SDK depois é trabalho conhecido; depurar um pre-release de biblioteca de
estilo, não.

**React Native 0.81 · React 19.1**

## Expo Router 6

Rotas por arquivo, como no Next.js. Na web isso significa URL de verdade:
`kulto.me/@usuario` é uma página, não um estado interno. Para um app que
nasce na web e depende de compartilhamento, isso não é conveniência — é
requisito.

Grupos de rota resolvem a arquitetura de acesso sem código: `(auth)` para
quem não tem sessão, `(app)` para quem tem sessão e perfil, e um `index.tsx`
que é o portão decidindo entre os dois.

## NativeWind 4

Tailwind rodando em React Native. As mesmas classes na web e no nativo, sobre
um conjunto de tokens que o tema troca em tempo de execução.

**A configuração é fechada de propósito** — a paleta do Tailwind foi
substituída inteira, sem `white`, `black` nem os cinzas padrão. Um hex solto
num componente é como um design system morre; se a classe não existe, o
atalho não existe.

Onde o NativeWind não serve: cor que muda com o estado. O react-native-web
**acumula** a classe antiga quando o `className` muda, em vez de trocá-la — o
elemento fica com as duas, e a cascata do CSS decide. Cor de estado vai em
`style` inline, que não tem cascata. Isso custou um bug real: um botão que
habilitava e continuava com a cor de desabilitado.

## TanStack Query 5

Estado de servidor é um problema diferente de estado de UI: tem cache,
revalidação, carregamento, erro, e o dado pode ficar velho enquanto você olha
para ele. Escrever isso à mão com `useState` e `useEffect` é reescrever o
TanStack Query pior.

Cada consulta é um hook nomeado em `lib/`. Quem escreve invalida o que a
escrita afeta — e manter esse mapa honesto é trabalho: renomear uma chave sem
renomear as invalidações quebra a atualização de uma tela distante, em
silêncio.

## Zustand 5

Para o que é local e global ao mesmo tempo, que é pouco: a sessão, o convite
de fundador. Um store de Zustand é um hook e um objeto — sem provider, sem
boilerplate, sem contexto envolvendo a árvore.

## react-hook-form + Zod 4

O schema Zod é a única definição da regra: valida o formulário, tipa o
`onSubmit` e documenta o que o banco espera. Mudar a regra é mudar uma linha,
e o TypeScript aponta quem quebrou.

## Supabase

Postgres de verdade, com acesso direto do cliente e RLS como fronteira.

A alternativa seria um backend próprio — Node ou Go na frente do banco. O
custo disso, para um projeto de uma pessoa, é uma camada inteira de CRUD para
manter, e nenhuma segurança a mais: RLS bem escrita é mais difícil de burlar
do que uma verificação de permissão esquecida num controller.

O que vem junto e foi usado: **Auth** (e-mail/senha, OAuth, recuperação),
**Realtime** (notificações chegam sem refresh), **Storage** (foto e capa de
perfil), **Edge Functions** (o que precisa de segredo).

O que exige cuidado: a `service_role` ignora RLS e não pode chegar ao
cliente; e políticas mal escritas falham em silêncio — devolvem lista vazia,
não erro. Toda política nova é testada com duas contas.

## Reanimated 4

Animação na thread de UI, não na thread de JavaScript. Na prática: a folha do
detalhe da review sobe lisa enquanto o feed carrega imagens atrás.

O custo é conhecer as armadilhas — medida que chega um quadro depois, animação
que reinicia quando o teclado muda a altura, `requestAnimationFrame` que o
navegador congela em aba de fundo. As três estão resolvidas em
[exemplos/folha-que-sobe.tsx](../exemplos/folha-que-sobe.tsx).

## i18next

Três idiomas: português, inglês e espanhol. O detalhe que importa é o tipo:
os dicionários são objetos TypeScript e as chaves são conferidas na
compilação. Uma chave removida quebra o build em vez de aparecer crua na tela.

## Sentry e PostHog, opcionais

Ambos atrás de uma camada que vira no-op quando não há chave. Quem clona o
projeto roda sem conta em serviço nenhum, e nenhum evento sai de um ambiente
de desenvolvimento por acidente.

## Vercel

Deploy da web e do site de documentação. O site de docs é **gerador próprio**
— dois arquivos, sem dependência, que transformam Markdown em HTML estático.
VitePress e Starlight resolveriam, mas trariam uma árvore de dependências e
um tema para customizar, para cinco páginas que precisam parecer o Kulto e
nada mais.

## O que ficou de fora, e por quê

**Redux / MobX** — o problema que resolvem (estado global complexo) não
existe aqui: dado de servidor é do TanStack Query, e o resto é local.

**Firebase** — banco de documentos onde o domínio é claramente relacional:
perfis seguem perfis, reviews têm notas, conquistas pertencem a pessoas.
Modelar isso sem `join` seria desnormalizar por limitação da ferramenta.

**Styled-components / Emotion** — o app precisa das mesmas regras na web e no
nativo, e Tailwind dá isso com um conjunto de tokens fechado, que é o que
mantém a marca inteira.

**Next.js** — resolveria a web muito bem e não resolveria as lojas. O ponto
do Expo é um código só para os três destinos.
