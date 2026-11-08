// O valor exato do jogo, por varredura completa com memoria.
//
// A conta toda se apoia num ponto so: o valor de uma posicao NAO depende do
// placar nem de quem esta ganhando. Depende so das arestas ja tracadas, porque
// as caixas que faltam ainda vao ser repartidas, e quem ja marcou o que ja
// marcou nao muda isso. Por isso o estado cabe num numero de `arestas` bits, e
// a memoria e um vetor.
//
// v(S) = a melhor diferenca de caixas (minhas menos dele) que o jogador da vez
// consegue daqui ate o fim, com os dois jogando perfeito.

import { fechaQuantas } from './tabuleiro.js';

const NAO_CALCULADO = -128;

/** A memoria de um tabuleiro: um byte por estado possivel. */
export function memoria(t) {
  const v = new Int8Array(1 << t.arestas);
  v.fill(NAO_CALCULADO);
  return v;
}

/**
 * O valor da posicao `estado` para quem joga agora.
 *
 * Fechar caixa da outro lance ao mesmo jogador — e por isso que o sinal nao
 * inverte quando `fecha > 0`. Esquecer isso da um jogo parecido e errado.
 */
export function valor(t, estado, memo) {
  if (estado === t.cheio) return 0;
  const guardado = memo[estado];
  if (guardado !== NAO_CALCULADO) return guardado;

  let melhor = -128;
  for (let e = 0; e < t.arestas; e++) {
    if ((estado >> e) & 1) continue;
    const fecha = fechaQuantas(t, estado, e);
    const depois = estado | (1 << e);
    const r = fecha > 0 ? fecha + valor(t, depois, memo) : -valor(t, depois, memo);
    if (r > melhor) melhor = r;
  }
  // Devolver `melhor` direto devolveria -0 quando o melhor lance e a negacao
  // de um zero, e a MESMA posicao devolveria 0 na segunda visita, lida do
  // vetor. O numero e o mesmo para o `===` do JavaScript, mas nao para um
  // teste estrito — e uma funcao que responde duas coisas diferentes para a
  // mesma pergunta nao serve de base para medida nenhuma. O vetor normaliza.
  memo[estado] = melhor;
  return memo[estado];
}

/** O melhor lance da posicao, e o valor que ele garante. */
export function melhorLance(t, estado, memo) {
  let melhor = -128;
  let escolha = -1;
  for (let e = 0; e < t.arestas; e++) {
    if ((estado >> e) & 1) continue;
    const fecha = fechaQuantas(t, estado, e);
    const depois = estado | (1 << e);
    const r = fecha > 0 ? fecha + valor(t, depois, memo) : -valor(t, depois, memo);
    if (r > melhor) { melhor = r; escolha = e; }
  }
  return { aresta: escolha, valor: valor(t, estado, memo) };
}

/**
 * O resultado do tabuleiro vazio: a diferenca de caixas a favor de quem comeca,
 * e quantas caixas cada um leva.
 */
export function resultado(colunas, linhas, t, memo) {
  const d = valor(t, 0, memo);
  const total = t.caixas;
  // total = primeiro + segundo  e  d = primeiro - segundo
  const primeiro = (total + d) / 2;
  return {
    tabuleiro: colunas + 'x' + linhas,
    arestas: t.arestas,
    caixas: total,
    diferenca: d,
    primeiro,
    segundo: total - primeiro,
    quemGanha: d > 0 ? 'primeiro' : (d < 0 ? 'segundo' : 'empate'),
  };
}

/**
 * Quantos estados a busca com memoria realmente visita.
 *
 * Todo conjunto de arestas e alcancavel a partir do vazio, entao a busca
 * completa toca os 2^arestas estados. O numero esta aqui para confirmar isso,
 * e nao para supor.
 */
export function estadosVisitados(t, memo) {
  let n = 0;
  for (let i = 0; i < memo.length; i++) if (memo[i] !== NAO_CALCULADO) n++;
  return n;
}
