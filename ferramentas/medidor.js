#!/usr/bin/env node
// O medidor: roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js            todas
//   node ferramentas/medidor.js resultado  so uma

import {
  TABULEIROS, TABULEIROS_JUIZ,
  linhaResultado, linhaJuiz, linhaGuloso, linhaGulosoPorPosicao,
  linhaInvariante, linhaTransposta,
} from '../js/medidas.js';
import { tabuleiro } from '../js/tabuleiro.js';
import { memoria } from '../js/solucionador.js';
import { placarDeUmaPartida, otima, gulosa } from '../js/juiz.js';
import { desenhar } from '../js/tabuleiro.js';

const n = (x) => x.toLocaleString('pt-BR');
const pc = (x) => (x * 100).toFixed(2).replace('.', ',') + '%';
const sinal = (x) => (x > 0 ? '+' : '') + x;

function titulo(t) {
  console.log('');
  console.log(t);
  console.log('-'.repeat(t.length));
}

function resultado() {
  titulo('O valor exato de cada tabuleiro, com os dois jogando perfeito');
  console.log('tabuleiro  arestas  caixas  placar   diferenca  quem ganha  estados');
  for (const [c, l] of TABULEIROS) {
    const r = linhaResultado(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + String(r.arestas).padStart(7) + '  '
      + String(r.caixas).padStart(6) + '  '
      + (r.primeiro + ' a ' + r.segundo).padStart(6) + '  '
      + sinal(r.diferenca).padStart(9) + '  '
      + r.quemGanha.padStart(10) + '  '
      + n(r.estados).padStart(10),
    );
  }
}

function juiz() {
  titulo('Conferencia: com memoria, sem memoria, e jogando a partida');
  console.log('tabuleiro  com memoria  sem memoria  placar  bate');
  for (const [c, l] of TABULEIROS_JUIZ) {
    const r = linhaJuiz(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + sinal(r.comMemoria).padStart(11) + '  '
      + sinal(r.semMemoria).padStart(11) + '  '
      + (r.placar[0] + ' a ' + r.placar[1]).padStart(6) + '  '
      + (r.bate ? 'sim' : 'NAO'),
    );
  }
}

function guloso() {
  titulo('Quem fecha toda caixa que aparece: o placar contra o jogo perfeito');
  console.log('tabuleiro  caixas  perfeito  guloso comecando  guloso respondendo  custo');
  for (const [c, l] of TABULEIROS) {
    const r = linhaGuloso(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + String(r.caixas).padStart(6) + '  '
      + sinal(r.perfeito).padStart(8) + '  '
      + sinal(r.gulosoComecando).padStart(16) + '  '
      + sinal(r.gulosoRespondendo).padStart(18) + '  '
      + String(r.custoDeComecar).padStart(5),
    );
  }
}

function posicoes() {
  titulo('Em quantas posicoes do jogo o lance guloso e um lance otimo');
  console.log('tabuleiro  posicoes      acerta        erra       fracao que erra');
  for (const [c, l] of TABULEIROS) {
    const r = linhaGulosoPorPosicao(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + n(r.posicoes).padStart(8) + '  '
      + n(r.acerta).padStart(10) + '  '
      + n(r.erra).padStart(10) + '  '
      + pc(r.fracaoErra).padStart(21),
    );
  }
}

function invariante() {
  titulo('O invariante em todas as posicoes: paridade das caixas que faltam');
  console.log('tabuleiro  posicoes conferidas  falhas');
  for (const [c, l] of TABULEIROS) {
    const r = linhaInvariante(c, l);
    console.log(r.tabuleiro.padEnd(11) + n(r.conferidas).padStart(19) + '  ' + String(r.falhas).padStart(6));
  }
}

function transpostas() {
  titulo('O tabuleiro deitado vale o mesmo que o tabuleiro em pe');
  console.log('par          valor  valor  bate');
  for (const [c, l] of [[2, 1], [3, 1], [4, 1], [5, 1], [3, 2], [4, 2]]) {
    const r = linhaTransposta(c, l);
    console.log(r.par.padEnd(13) + sinal(r.valorA).padStart(5) + '  ' + sinal(r.valorB).padStart(5) + '  ' + (r.bate ? 'sim' : 'NAO'));
  }
}

function partida() {
  titulo('A tira 1x5: o guloso comeca e nao leva uma caixa');
  const t = tabuleiro(5, 1);
  const memo = memoria(t);
  const r = placarDeUmaPartida(t, [gulosa, otima(memo)]);
  console.log('placar ' + r.placar[0] + ' a ' + r.placar[1] + ', em ' + r.lances.length + ' lances');
  console.log('');
  console.log(desenhar(t, t.cheio));
}

const tabelas = { resultado, juiz, guloso, posicoes, invariante, transpostas, partida };
const pedido = process.argv[2];
if (pedido) {
  if (!tabelas[pedido]) {
    console.error('tabela desconhecida: ' + pedido);
    console.error('as que existem: ' + Object.keys(tabelas).join(', '));
    process.exit(1);
  }
  tabelas[pedido]();
} else {
  for (const t of Object.values(tabelas)) t();
}
console.log('');
