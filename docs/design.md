# Design

[← voltar](../README.md)

O Kulto tem um sistema visual escrito antes das telas, e as telas obedecem.
O que segue são as regras — e as três exceções, todas deliberadas.

## A regra de cor

**Monocromático.** Creme `#F5F2EA` sobre preto `#0D0D0D`. Superfícies em dois
níveis acima do fundo, divisórias em `#2A2A2A`.

**Um preenchimento sólido por tela.** O creme cheio pertence à ação primária
daquela tela e à nota. Mais nada recebe fill. Quando uma tela ganha um
segundo botão em creme, os dois param de significar "é aqui que se toca".

**A paleta é fechada no Tailwind.** `white`, `black` e os cinzas padrão foram
removidos da configuração. Se a classe não existe, o hex solto não entra.
Cada token aponta para uma variável CSS que o tema troca em tempo de execução
— é assim que o modo claro existe sem uma segunda folha de estilo.

## As três exceções cromáticas

Cor no Kulto significa alguma coisa; quando não significa, não entra.

**A cor da mídia** — filme, série, livro e game têm cada um a sua, e ela
aparece só em ícone, chip ou traço. Nunca como fundo de superfície: quatro
cartões coloridos numa lista viram um mostruário de tinta, e a informação
"isto é um livro" cabe num ponto de 8 pixels.

**O dourado da curtida** — o mesmo dourado do selo de verificado. Coração
aceso é estado, e estado precisa ser visível de relance.

**O azul do "ver depois"** `#009DFF` — aqui a cor **é** o estado. Sem ela,
guardado e não guardado seriam o mesmo desenho de calendário, e a pessoa
tocaria para descobrir.

## Elevação é borda, não sombra

`boxShadow` está desativado no tema, de propósito. O que precisa parecer
acima usa uma superfície mais clara e uma borda de 1px.

Sombra sobre fundo quase preto vira um borrão cinza que muda de aparência
entre navegadores e densidades de tela. Borda é nítida em qualquer lugar.

## Tipografia com dois trabalhos

**Space Grotesk** para o que se lê: títulos, corpo, botões.

**Inter, com `tabular-nums`,** para o que se compara: nota, contador,
timestamp, rótulo em caixa alta. Números que mudam de largura fazem a coluna
tremer — `4,5` e `1,1` precisam ocupar o mesmo espaço.

Escala modular de razão 1,25 sobre base 16px. Máximo de dois pesos por bloco.
Sem serifada, sem itálico sintético.

**Todo campo de texto é 16px**, e isso não é estética: abaixo disso o Safari
do iPhone amplia a página ao focar o campo, e o zoom desenquadra a tela.

## Voz

Seca, direta, com ponto final. Sem exclamação, sem emoji decorativo.

O erro diz o que aconteceu e o que fazer. O botão diz o que vai acontecer, e
o aviso seguinte confirma no mesmo verbo: "Publicar" → "Publicado".

Exemplos do app:

> Ainda sem review de quem você segue.
> Siga alguém pra ver as reviews aqui.

> Você só pode trocar o @ a cada 14 dias. Tente de novo em 6 dias.

> SALVANDO. NÃO DESLIGUE O CONSOLE.

## A exceção que prova a regra: a tela de entrada

Quem ainda não tem conta não vê o app monocromático. Vê uma campanha.

A coluna da direita mostra três cartazes fotográficos que se revezam, e cada
um **veste a linguagem gráfica da sua mídia**: a série vira cartão de
episódio, com marquee repetido e tipografia condensada gigante; o livro vira
página impressa, em serifada preta pequena e paciente; o game vira tela de
save, em verde fósforo pixelado — "SALVANDO. NÃO DESLIGUE O CONSOLE."

A ideia da campanha é essa: cada mídia fala a própria língua, e o Kulto é
onde elas se encontram. Quem entra vê campanha; quem está dentro vê produto.

### O que a exceção obrigou a resolver

A coluna do banner **não tem proporção fixa** — ela é o que sobra da janela
depois do formulário, que ocupa até 600px. A imagem é cortada de forma
diferente em cada tela, e o eixo do corte muda:

| Janela                | Coluna      | Corta     | De cada ponta |
| --------------------- | ----------- | --------- | ------------- |
| 1024 × 768, meia tela | 512 × 650   | laterais  | 20%           |
| 1440 × 900            | 840 × 760   | laterais  | 9%            |
| 1920 × 1080           | 1320 × 901  | topo/base | 4%            |
| 2560 × 1440           | 1960 × 1260 | topo/base | 7%            |

Numa tela larga somem faixas do topo; numa janela estreita somem um quinto de
cada lado. Nenhuma proporção de arte escapa das duas coisas, então é o desenho
que se protege: **20% de margem nas laterais, 12% no topo e na base**, com
todo texto dentro dos 60% centrais da largura por 76% da altura.

Isso custou uma arte: a primeira leva tinha um marquee correndo colado às
bordas superior e inferior, e ele sumia inteiro em tela cheia. Na segunda, o
marquee virou uma régua dentro da composição — mesmo efeito, sem morrer no
corte.

## Acessibilidade

- Alvo de toque mínimo de 44×44, garantido por `hitSlop` quando o desenho é
  menor.
- `accessibilityRole` e `accessibilityLabel` em tudo que é tocável; a arte
  que carrega texto leva o texto no rótulo, porque quem não a vê precisa dele.
- `useReducedMotion` respeitado: carrossel que anda sozinho para, folha que
  sobe aparece no lugar.
- Contraste conferido nos dois temas — o `textFaint`, que é o menor, está em
  5,4:1 sobre o fundo.
