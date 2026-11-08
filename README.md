# pontinhos

**O jogo das caixinhas, resolvido.** Nove tabuleiros varridos até o último lance, do 1 × 1 ao
3 × 3 — 16.777.215 posições neste último, todas elas.

O achado não é quem ganha. É o preço do jeito que todo mundo joga: **quem fecha toda caixa que
aparece perde a tira 5 × 1 por 0 a 5**, sem levar uma única caixa — e mesmo assim o lance dele
é um lance ótimo em 92,89% das posições do jogo.

**[Abrir a página](https://condedeveloper.github.io/pontinhos/)** — dá para jogar contra a
varredura, e apertar um botão que joga por você fechando tudo que aparece.

JavaScript puro: sem dependência, sem build, e o mesmo núcleo roda no navegador e nos testes.

---

## O valor exato de cada tabuleiro

| tabuleiro | arestas | caixas | placar perfeito | quem ganha | posições varridas |
|---|---:|---:|---:|---|---:|
| 1 × 1 | 4 | 1 | 0 a 1 | o segundo | 15 |
| 2 × 1 | 7 | 2 | 1 a 1 | empate | 127 |
| 3 × 1 | 10 | 3 | 1 a 2 | o segundo | 1.023 |
| 4 × 1 | 13 | 4 | 2 a 2 | empate | 8.191 |
| 5 × 1 | 16 | 5 | 2 a 3 | o segundo | 65.535 |
| 2 × 2 | 12 | 4 | 3 a 1 | **o primeiro** | 4.095 |
| 3 × 2 | 17 | 6 | 2 a 4 | o segundo | 131.071 |
| 4 × 2 | 22 | 8 | 5 a 3 | **o primeiro** | 4.194.303 |
| 3 × 3 | 24 | 9 | 3 a 6 | o segundo | 16.777.215 |

Em nenhuma das cinco tiras de uma linha o primeiro jogador ganha: empata nas pares e perde nas
ímpares, sem exceção. E quem ganha não é quem o tamanho sugere — o primeiro leva o 2 × 2 e o
4 × 2, e perde o 3 × 2 que está entre os dois.

A última coluna é 2^arestas − 1, sempre: a busca toca todos os conjuntos de arestas menos o
tabuleiro cheio, que responde zero sem precisar de memória. Não é uma estimativa de custo, é a
contagem de quantas posições ficaram guardadas no vetor.

## O preço de fechar toda caixa que aparece

A estratégia gulosa é a que quase todo mundo usa: se dá para fechar caixa, fecha; se não dá,
traça uma aresta que não entregue caixa. Ela joga contra a varredura:

| tabuleiro | caixas | jogo perfeito | o guloso começando | custo | posições em que ele erra |
|---|---:|---:|---:|---:|---:|
| 1 × 1 | 1 | −1 | −1 | 0 | 0,00% |
| 2 × 1 | 2 | 0 | −2 | 2 | 11,02% |
| 3 × 1 | 3 | −1 | −3 | 2 | 11,05% |
| 4 × 1 | 4 | 0 | −4 | 4 | 9,01% |
| 5 × 1 | 5 | −1 | **−5** | 4 | 7,11% |
| 2 × 2 | 4 | +2 | 0 | 2 | 13,72% |
| 3 × 2 | 6 | −2 | −4 | 2 | 10,23% |
| 4 × 2 | 8 | +2 | **−4** | 6 | 8,23% |
| 3 × 3 | 9 | −3 | −5 | 2 | 8,43% |

A coluna "custo" é quanto o guloso joga fora. No 4 × 2 ele pega uma vitória de +2 e entrega uma
derrota de −4: seis caixas de diferença num tabuleiro de oito.

E a última coluna é a parte desconfortável. A fração de posições em que o lance guloso **não** é
um lance ótimo nunca passa de 13,72%, e no 5 × 1 é de 7,11% — ou seja, ele acerta o lance perfeito
em mais de nove de cada dez posições do jogo, e perde todas as cinco caixas.

## Os quatro achados

1. **O primeiro jogador não ganha nenhuma das cinco tiras de uma linha**: −1, 0, −1, 0, −1 do
   1 × 1 ao 5 × 1. Quem responde nunca perde a tira.
2. **Na tira 5 × 1, quem fecha toda caixa que aparece termina sem uma caixa: 0 a 5.** Não é
   "jogar mal": é perder o tabuleiro inteiro para um adversário que também só tem cinco caixas
   para ganhar.
3. **O lance guloso é um lance ótimo em 92,89% das posições da tira 5 × 1** e em 91,57% das
   16.777.215 posições do 3 × 3. O erro é raro e é caro — ele mora nas poucas posições que
   decidem a partida inteira.
4. **O valor da posição tem sempre a paridade das caixas que faltam, e nunca passa delas em
   módulo** — conferido nas 2^arestas posições de cada um dos nove tabuleiros, 21.181.584 ao
   todo, sem uma exceção.

## O que as medidas me corrigiram

**O jogo me devolveu −0.** O valor de uma posição é calculado negando o valor da posição
seguinte, e negar zero em JavaScript dá `-0`. Na primeira visita a função devolvia `-0`; na
segunda, lida do `Int8Array`, devolvia `0`. Para o `===` da linguagem os dois são iguais, e o
bug atravessou todas as tabelas sem mudar um número — quem pegou foi um teste estrito que
comparava `melhorLance().valor` com `valor()`. Uma função que responde duas coisas diferentes
para a mesma pergunta não serve de base para medida nenhuma, mesmo quando as duas respostas
valem o mesmo. Hoje o valor sai sempre do vetor, que normaliza.

**Achei que o guloso errasse muito.** Esperava uma fração de erro grande o bastante para
explicar a derrota — 30%, 40%. São 7,11% na tira 5 × 1. A derrota não vem de errar muito, vem
de errar nas posições certas, e eu só vi isso porque medi posição por posição em vez de olhar
o placar da partida.

**Esperava que o primeiro jogador ganhasse os tabuleiros maiores.** Ele ganha o 2 × 2 e o
4 × 2 e perde o 3 × 2, que está entre os dois em tamanho. Não existe a monotonia que eu tinha
escrito no rascunho.

**Esqueci que fechar caixa dá outro lance.** A primeira versão invertia o sinal em todo lance,
inclusive nos que fechavam caixa. O jogo que saiu dali é parecido com pontinhos e não é
pontinhos: ele dava +1 para o 1 × 1, e a varredura sem memória — escrita depois, para servir de
juiz — discordou na primeira posição que testei.

## Como está feito

```
js/tabuleiro.js     as arestas, as caixas, e que aresta fecha o quê
js/solucionador.js  o valor exato de toda posição, com memória
js/juiz.js          a busca sem memória, a partida jogada lance a lance, o invariante, o guloso
js/medidas.js       as tabelas deste README, uma função por linha
js/app.js           a página
ferramentas/medidor.js
```

**Por que o estado é só o conjunto de arestas.** O valor de uma posição não depende do placar
nem de quem está na frente: as caixas que faltam ainda vão ser repartidas, e o que já foi
marcado não muda isso. Por isso a posição cabe num número de `arestas` bits e a memória é um
vetor de bytes — 16 MB resolvem o 3 × 3 inteiro.

**Três juízes, nenhum compartilhando código com a busca.** O primeiro é uma busca pura, sem
memória nenhuma, que confere os tabuleiros até 12 arestas. O segundo joga a partida de verdade,
lance a lance, e conta as caixas na hora em que elas fecham — a diferença do placar tem que ser
o valor da posição vazia. O terceiro é o invariante da paridade, que vale em toda posição sem
que seja preciso saber jogar, e é o que pega erro de sinal.

## Rodar

```bash
node --test testes/*.test.js     # 29 testes
node ferramentas/medidor.js      # todas as tabelas
node ferramentas/medidor.js guloso
```

A página é estática: abrir o `index.html` basta, não tem build nem servidor.

## Licença

MIT.
