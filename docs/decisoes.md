# Dez decisões

[← voltar](../README.md)

Decisões de produto e de engenharia que mudaram o Kulto — cada uma com o
motivo e, onde houve, o que custou.

---

## 1. Feed cronológico, sem algoritmo

**Decisão:** o feed mostra quem você segue, na ordem em que publicaram.
Nenhuma reordenação, nenhum "achamos que você vai gostar".

**Por quê:** é a razão de o Kulto existir. Quem procura um lugar para
registrar o que consumiu não quer um algoritmo decidindo quais registros
merecem atenção — e um feed cronológico é a única promessa que não se quebra
sozinha com o tempo.

**Custo:** o app fica menos "viciante" pelos padrões da indústria. É o ponto.

---

## 2. Quatro mídias, uma review

**Decisão:** filme, série, livro e game no mesmo modelo, com os **critérios de
nota mudando por mídia**.

**Por quê:** avaliar um livro por "fotografia" é bobagem, e avaliar um game
sem "jogabilidade" é incompleto. Uma tabela `rating_categories` filtrada pela
mídia da obra resolve isso sem quatro telas diferentes.

**Consequência:** a nota geral é derivada das notas por categoria, nunca
digitada. Não existe "dar 7" — existe avaliar quatro coisas e a média ser 7.

---

## 3. A segurança mora no banco

**Decisão:** RLS em todas as tabelas, `service_role` só nas Edge Functions, o
cliente com a `anon key` e o JWT do usuário.

**Por quê:** a alternativa — verificar permissão no cliente ou num controller
— erra por omissão: basta esquecer uma verificação num endpoint novo. Com
RLS, o padrão é negar; para vazar é preciso escrever uma política errada, que
é um arquivo pequeno e revisado.

**O que exige cuidado:** política mal escrita falha em silêncio, devolvendo
lista vazia em vez de erro. Toda política nova é testada com duas contas.

---

## 4. Regra de negócio que não pode ser burlada vira trigger

**Decisão:** o nome de usuário só muda a cada 14 dias — e isso é um trigger no
Postgres, não uma verificação no formulário.

**Por quê:** qualquer regra que exista só no cliente é uma sugestão. O trigger
devolve um erro específico (`P0001`), e a tela traduz em "tente de novo em N
dias", com a conta feita a partir do `username_changed_at` do perfil.

---

## 5. A paleta é fechada por decreto

**Decisão:** o Tailwind foi configurado **sem** `white`, `black` e sem os
cinzas padrão. Só existem os tokens do Kulto, e cada um aponta para uma
variável CSS que o tema troca em tempo de execução.

**Por quê:** design system morre por hex solto. Se a classe não existe, o
atalho não existe, e o tema claro não nasce quebrado.

**Exceções, todas deliberadas:** a cor da mídia (filme, série, livro, game),
o dourado da curtida e o azul do "ver depois". Nesse último a cor **é** o
estado — sem ela, guardado e não guardado seriam o mesmo desenho.

---

## 6. Elevação é borda, não sombra

**Decisão:** `boxShadow` está desativado no tema. O que precisa parecer
acima usa superfície mais clara e uma borda de 1px.

**Por quê:** sombra sobre fundo quase preto vira borrão cinza. Borda é nítida
em qualquer densidade de tela e não muda de aparência entre navegadores.

---

## 7. Os textos são um arquivo tipado

**Decisão:** os três dicionários são objetos TypeScript, e as chaves de
tradução são conferidas na compilação.

**Por quê:** string faltando aparece para o usuário como `notifications.like`
— um bug que passa pela revisão e morre na tela de alguém. Com a chave
tipada, remover uma string usada **quebra o build**.

**Custo:** as chaves não podem ser montadas por concatenação. Uma lista de
passos numerados vira um array de chaves literais, escritas por extenso. É
mais verboso, e é o que faz o compilador continuar servindo para alguma coisa.

---

## 8. A tela de entrada foge da marca, e só ela

**Decisão:** o app é monocromático; a tela de entrada tem cartazes
fotográficos coloridos, cada um com a linguagem gráfica da sua mídia —
cartela de créditos, cartão de episódio, página impressa, tela de save.

**Por quê:** o contraste é o argumento. Quem chega vê campanha; quem está
dentro vê produto. Um app de resenha que se apresenta cinza não convence
ninguém a entrar.

**O que isso obrigou a resolver:** a coluna do banner não tem proporção fixa
— é o que sobra da janela depois do formulário. A imagem é cortada de forma
diferente em cada tela, e **o eixo do corte muda**: numa tela larga somem
faixas do topo, numa janela estreita somem 20% de cada lado. Daí a zona
segura declarada nos prompts das artes: texto dentro dos 60% centrais da
largura por 76% da altura, nada sangrando pela borda.

---

## 9. Numeração de versão que se lê de bate-pronto

**Decisão:** o último número vai de 1 a 9 e para. Depois da 1.2.9 vem a
1.3.0, nunca a 1.2.10. O do meio sobe quando chega função nova.

**Por quê:** não é semver, e não precisa ser — nada consome o Kulto como
dependência. O que a versão precisa fazer é ser lida em voz alta e caber no
rodapé das configurações.

**Onde aparece:** a versão do bundle é comparada com um `version.json`
publicado a cada release; quando diferem, um aviso oferece recarregar.

---

## 10. Um gerador de site próprio para a documentação

**Decisão:** `docs.kulto.me` é gerado por dois arquivos sem dependência
nenhuma — um conversor de Markdown e um montador de HTML.

**Por quê:** VitePress ou Starlight resolveriam, e trariam uma árvore de
dependências, um tema para customizar e um processo de build para manter. São
cinco páginas que precisam parecer o Kulto e mais nada. O gerador inteiro é
menor do que o arquivo de configuração que qualquer um deles pediria.

**Onde compensou:** as notas de atualização precisavam agrupar por ano e abrir
a mais recente. Isso é uma função de dez linhas no gerador próprio, e seria um
plugin no alheio.
