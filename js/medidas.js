// As tabelas do README, uma funcao por linha.

import { tabuleiro, caixasFechadas } from './tabuleiro.js';
import { memoria, valor, resultado, estadosVisitados } from './solucionador.js';
import { valorSemMemoria, placarDeUmaPartida, invariante, otima, gulosa } from './juiz.js';

export const TABULEIROS = [
  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
  [2, 2], [3, 2], [4, 2], [3, 3],
];

/** Os tabuleiros pequenos o bastante para o juiz sem memoria aguentar. */
export const TABULEIROS_JUIZ = [[1, 1], [2, 1], [3, 1], [2, 2]];

/** Uma linha do resultado: quem ganha o tabuleiro vazio, e por quanto. */
export function linhaResultado(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const memo = memoria(t);
  const r = resultado(colunas, linhas, t, memo);
  return { ...r, estados: estadosVisitados(t, memo) };
}

/** Uma linha da conferencia: a busca com memoria contra a busca sem nada. */
export function linhaJuiz(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const memo = memoria(t);
  const comMemoria = valor(t, 0, memo);
  const semMemoria = valorSemMemoria(t, 0);
  const partida = placarDeUmaPartida(t, [otima(memo), otima(memo)]);
  return {
    tabuleiro: colunas + 'x' + linhas,
    comMemoria,
    semMemoria,
    placar: partida.placar,
    diferencaDaPartida: partida.diferenca,
    bate: comMemoria === semMemoria && comMemoria === partida.diferenca,
  };
}

/**
 * Uma linha do guloso: o que acontece com quem fecha toda caixa que aparece.
 * O guloso joga de um lado e o otimo do outro, nas duas ordens.
 */
export function linhaGuloso(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const memo = memoria(t);
  const otimo = otima(memo);
  const comecando = placarDeUmaPartida(t, [gulosa, otimo]);
  const respondendo = placarDeUmaPartida(t, [otimo, gulosa]);
  const perfeito = valor(t, 0, memo);
  return {
    tabuleiro: colunas + 'x' + linhas,
    caixas: t.caixas,
    perfeito,
    gulosoComecando: comecando.diferenca,
    gulosoRespondendo: -respondendo.diferenca,
    custoDeComecar: perfeito - comecando.diferenca,
  };
}

/**
 * Em quantas posicoes do tabuleiro o lance guloso e um lance otimo.
 *
 * Varre TODAS as posicoes alcancaveis, nao uma partida. E a medida que diz o
 * tamanho do erro: nao "o guloso perde", e "o guloso erra em tantos por cento
 * das posicoes do jogo".
 */
export function linhaGulosoPorPosicao(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const memo = memoria(t);
  valor(t, 0, memo);
  let posicoes = 0;
  let acerta = 0;
  for (let estado = 0; estado < (1 << t.arestas); estado++) {
    if (estado === t.cheio) continue;
    posicoes++;
    const e = gulosa(t, estado);
    const depois = estado | (1 << e);
    let fecha = 0;
    for (const b of t.caixasDaAresta[e]) {
      if ((depois & t.mascaraDaCaixa[b]) === t.mascaraDaCaixa[b]) fecha++;
    }
    const r = fecha > 0 ? fecha + valor(t, depois, memo) : -valor(t, depois, memo);
    if (r === memo[estado]) acerta++;
  }
  return {
    tabuleiro: colunas + 'x' + linhas,
    posicoes,
    acerta,
    erra: posicoes - acerta,
    fracaoErra: (posicoes - acerta) / posicoes,
  };
}

/**
 * O invariante conferido em TODAS as posicoes de um tabuleiro: o valor tem a
 * paridade das caixas que faltam e nao passa delas em modulo.
 */
export function linhaInvariante(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const memo = memoria(t);
  valor(t, 0, memo);
  let conferidas = 0;
  let falhas = 0;
  for (let estado = 0; estado < (1 << t.arestas); estado++) {
    conferidas++;
    if (!invariante(t, estado, valor(t, estado, memo))) falhas++;
  }
  return { tabuleiro: colunas + 'x' + linhas, conferidas, falhas };
}

/** O tabuleiro deitado tem que valer o mesmo que o tabuleiro em pe. */
export function linhaTransposta(colunas, linhas) {
  const a = linhaResultado(colunas, linhas);
  const b = linhaResultado(linhas, colunas);
  return {
    par: colunas + 'x' + linhas + ' / ' + linhas + 'x' + colunas,
    valorA: a.diferenca,
    valorB: b.diferenca,
    bate: a.diferenca === b.diferenca && a.arestas === b.arestas,
  };
}

/** Quantas caixas estao fechadas num estado — usado pela pagina e pelos testes. */
export { caixasFechadas };
