// O juiz: a mesma pergunta por caminhos que nao se encostam.
//
// 1. `valorSemMemoria` nao guarda nada e nao reaproveita nada. E lento, e e
//    exatamente por isso que serve: nenhum erro de indice na memoria pode se
//    esconder nele.
// 2. `placarDeUmaPartida` joga a partida de verdade, lance a lance, e conta as
//    caixas de cada lado na hora em que elas fecham. O valor da posicao vazia
//    tem que ser a diferenca desse placar, ou uma das duas contas mente.
// 3. `invariante` confere uma coisa que vale em TODA posicao: o valor tem a
//    mesma paridade das caixas que faltam, e nunca passa delas em modulo.

import { fechaQuantas, caixasFechadas } from './tabuleiro.js';
import { melhorLance } from './solucionador.js';

/** O valor da posicao, por busca pura, sem memoria nenhuma. */
export function valorSemMemoria(t, estado) {
  if (estado === t.cheio) return 0;
  let melhor = -128;
  for (let e = 0; e < t.arestas; e++) {
    if ((estado >> e) & 1) continue;
    const fecha = fechaQuantas(t, estado, e);
    const depois = estado | (1 << e);
    const r = fecha > 0 ? fecha + valorSemMemoria(t, depois) : -valorSemMemoria(t, depois);
    if (r > melhor) melhor = r;
  }
  return melhor | 0;  // o `| 0` troca -0 por 0, pelo mesmo motivo do solucionador
}

/**
 * Joga a partida inteira com as duas estrategias dadas e devolve o placar.
 * Uma estrategia recebe `(t, estado)` e devolve a aresta que vai tracar.
 */
export function placarDeUmaPartida(t, estrategias) {
  let estado = 0;
  let vez = 0;
  const placar = [0, 0];
  const lances = [];
  while (estado !== t.cheio) {
    const e = estrategias[vez](t, estado);
    if (e < 0 || ((estado >> e) & 1)) throw new Error('lance ilegal: ' + e);
    const fecha = fechaQuantas(t, estado, e);
    estado |= 1 << e;
    lances.push({ vez, aresta: e, fecha });
    if (fecha > 0) placar[vez] += fecha;
    else vez = 1 - vez;
  }
  if (placar[0] + placar[1] !== t.caixas) throw new Error('o placar nao fecha com as caixas');
  return { placar, lances, diferenca: placar[0] - placar[1] };
}

/**
 * O invariante: em toda posicao o valor tem a paridade das caixas que faltam e
 * nao passa delas. Vale sem precisar saber jogar, e e a conferencia que pega
 * erro de sinal, que e o erro classico deste jogo.
 */
export function invariante(t, estado, v) {
  const faltam = t.caixas - caixasFechadas(t, estado);
  return Math.abs(v) <= faltam && ((faltam - v) % 2 === 0);
}

/** A estrategia otima: o lance que a varredura aponta. */
export function otima(memo) {
  return (t, estado) => melhorLance(t, estado, memo).aresta;
}

/**
 * A estrategia gulosa, que e como quase todo mundo joga: se da para fechar
 * caixa, fecha; se nao da, traca a primeira aresta que nao entrega caixa; se
 * toda aresta entrega, traca a primeira livre.
 *
 * Ela nunca abre mao de uma caixa na hora. E o erro que o jogo cobra.
 */
export function gulosa(t, estado) {
  let semEntregar = -1;
  for (let e = 0; e < t.arestas; e++) {
    if ((estado >> e) & 1) continue;
    if (fechaQuantas(t, estado, e) > 0) return e;
    if (semEntregar < 0) {
      const depois = estado | (1 << e);
      let entrega = false;
      for (let f = 0; f < t.arestas && !entrega; f++) {
        if ((depois >> f) & 1) continue;
        if (fechaQuantas(t, depois, f) > 0) entrega = true;
      }
      if (!entrega) semEntregar = e;
    }
  }
  if (semEntregar >= 0) return semEntregar;
  for (let e = 0; e < t.arestas; e++) if (!((estado >> e) & 1)) return e;
  return -1;
}
