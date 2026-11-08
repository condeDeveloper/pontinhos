import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TABULEIROS_JUIZ,
  linhaResultado, linhaJuiz, linhaGuloso, linhaGulosoPorPosicao,
  linhaInvariante, linhaTransposta,
} from '../js/medidas.js';

// Os numeros do README, presos.

const RESULTADOS = {
  '1x1': { arestas: 4, caixas: 1, diferenca: -1, primeiro: 0, segundo: 1 },
  '2x1': { arestas: 7, caixas: 2, diferenca: 0, primeiro: 1, segundo: 1 },
  '3x1': { arestas: 10, caixas: 3, diferenca: -1, primeiro: 1, segundo: 2 },
  '4x1': { arestas: 13, caixas: 4, diferenca: 0, primeiro: 2, segundo: 2 },
  '5x1': { arestas: 16, caixas: 5, diferenca: -1, primeiro: 2, segundo: 3 },
  '2x2': { arestas: 12, caixas: 4, diferenca: 2, primeiro: 3, segundo: 1 },
  '3x2': { arestas: 17, caixas: 6, diferenca: -2, primeiro: 2, segundo: 4 },
  '4x2': { arestas: 22, caixas: 8, diferenca: 2, primeiro: 5, segundo: 3 },
  '3x3': { arestas: 24, caixas: 9, diferenca: -3, primeiro: 3, segundo: 6 },
};

test('o valor exato de cada tabuleiro', { timeout: 600000 }, () => {
  for (const [nome, alvo] of Object.entries(RESULTADOS)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaResultado(c, l);
    assert.equal(r.arestas, alvo.arestas, nome + ' arestas');
    assert.equal(r.caixas, alvo.caixas, nome + ' caixas');
    assert.equal(r.diferenca, alvo.diferenca, nome + ' diferenca');
    assert.equal(r.primeiro, alvo.primeiro, nome + ' primeiro');
    assert.equal(r.segundo, alvo.segundo, nome + ' segundo');
    // a busca completa toca todos os estados menos o tabuleiro cheio
    assert.equal(r.estados, (2 ** alvo.arestas) - 1, nome + ' estados');
  }
});

test('o primeiro jogador nunca ganha uma tira de uma linha', { timeout: 600000 }, () => {
  // 1x1, 3x1 e 5x1 perdem; 2x1 e 4x1 empatam. Nenhuma vitoria em cinco tiras.
  const tiras = [1, 2, 3, 4, 5].map((c) => linhaResultado(c, 1).diferenca);
  assert.deepEqual(tiras, [-1, 0, -1, 0, -1]);
  assert.ok(tiras.every((d) => d <= 0));
});

test('quem comeca ganha o 2x2 e o 4x2, e perde o 3x2 e o 3x3', { timeout: 600000 }, () => {
  assert.equal(linhaResultado(2, 2).quemGanha, 'primeiro');
  assert.equal(linhaResultado(4, 2).quemGanha, 'primeiro');
  assert.equal(linhaResultado(3, 2).quemGanha, 'segundo');
  assert.equal(linhaResultado(3, 3).quemGanha, 'segundo');
});

test('a busca com memoria, a sem memoria e a partida concordam', () => {
  for (const [c, l] of TABULEIROS_JUIZ) {
    const r = linhaJuiz(c, l);
    assert.equal(r.bate, true, r.tabuleiro);
  }
  assert.deepEqual(linhaJuiz(2, 2).placar, [3, 1]);
});

const GULOSO = {
  '1x1': { perfeito: -1, comecando: -1, custo: 0 },
  '2x1': { perfeito: 0, comecando: -2, custo: 2 },
  '3x1': { perfeito: -1, comecando: -3, custo: 2 },
  '4x1': { perfeito: 0, comecando: -4, custo: 4 },
  '5x1': { perfeito: -1, comecando: -5, custo: 4 },
  '2x2': { perfeito: 2, comecando: 0, custo: 2 },
  '3x2': { perfeito: -2, comecando: -4, custo: 2 },
  '4x2': { perfeito: 2, comecando: -4, custo: 6 },
  '3x3': { perfeito: -3, comecando: -5, custo: 2 },
};

test('o que custa fechar toda caixa que aparece', { timeout: 600000 }, () => {
  for (const [nome, alvo] of Object.entries(GULOSO)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaGuloso(c, l);
    assert.equal(r.perfeito, alvo.perfeito, nome + ' perfeito');
    assert.equal(r.gulosoComecando, alvo.comecando, nome + ' guloso comecando');
    assert.equal(r.custoDeComecar, alvo.custo, nome + ' custo');
  }
});

test('na tira 1x5 o guloso comeca e nao leva uma caixa', { timeout: 600000 }, () => {
  const r = linhaGuloso(5, 1);
  assert.equal(r.caixas, 5);
  assert.equal(r.gulosoComecando, -5, 'placar 0 a 5');
});

test('no 4x2 o guloso troca uma vitoria de +2 por uma derrota de -4', { timeout: 600000 }, () => {
  const r = linhaGuloso(4, 2);
  assert.equal(r.perfeito, 2);
  assert.equal(r.gulosoComecando, -4);
  assert.equal(r.custoDeComecar, 6);
});

const POSICOES = {
  '1x1': { posicoes: 15, erra: 0 },
  '2x1': { posicoes: 127, erra: 14 },
  '3x1': { posicoes: 1023, erra: 113 },
  '4x1': { posicoes: 8191, erra: 738 },
  '5x1': { posicoes: 65535, erra: 4662 },
  '2x2': { posicoes: 4095, erra: 562 },
  '3x2': { posicoes: 131071, erra: 13415 },
  '4x2': { posicoes: 4194303, erra: 345085 },
  '3x3': { posicoes: 16777215, erra: 1414675 },
};

test('em quantas posicoes o lance guloso e um lance otimo', { timeout: 900000 }, () => {
  for (const [nome, alvo] of Object.entries(POSICOES)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaGulosoPorPosicao(c, l);
    assert.equal(r.posicoes, alvo.posicoes, nome + ' posicoes');
    assert.equal(r.erra, alvo.erra, nome + ' erra');
    assert.equal(r.acerta, alvo.posicoes - alvo.erra, nome + ' acerta');
  }
});

test('o guloso erra em menos de 14% das posicoes de todo tabuleiro', { timeout: 900000 }, () => {
  // acerta o lance otimo na maioria esmagadora das posicoes e mesmo assim
  // perde de 0 a 5. Errar pouco nao e errar de leve.
  assert.equal((linhaGulosoPorPosicao(3, 3).fracaoErra * 100).toFixed(2), '8.43');
  assert.equal((linhaGulosoPorPosicao(5, 1).fracaoErra * 100).toFixed(2), '7.11');
  assert.equal((linhaGulosoPorPosicao(2, 2).fracaoErra * 100).toFixed(2), '13.72');
});

test('o invariante vale em todas as posicoes de todos os tabuleiros', { timeout: 900000 }, () => {
  for (const nome of Object.keys(RESULTADOS)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaInvariante(c, l);
    assert.equal(r.falhas, 0, nome);
    assert.equal(r.conferidas, 2 ** RESULTADOS[nome].arestas, nome + ' conferidas');
  }
});

test('todas as transpostas batem', { timeout: 600000 }, () => {
  for (const [c, l] of [[2, 1], [3, 1], [4, 1], [5, 1], [3, 2], [4, 2]]) {
    assert.equal(linhaTransposta(c, l).bate, true, c + 'x' + l);
  }
});

test('quantas posicoes o invariante confere ao todo', { timeout: 900000 }, () => {
  // a soma esta aqui porque ela esta escrita no README, e numero derivado
  // escrito a mao e numero errado: eu escrevi 21.247.405 na primeira vez.
  let soma = 0;
  for (const nome of Object.keys(RESULTADOS)) {
    const [c, l] = nome.split('x').map(Number);
    soma += linhaInvariante(c, l).conferidas;
  }
  assert.equal(soma, 21181584);
});

test('a fracao de posicoes em que o guloso acerta', { timeout: 900000 }, () => {
  const tira = linhaGulosoPorPosicao(5, 1);
  assert.equal((tira.acerta / tira.posicoes * 100).toFixed(2), '92.89');
  const grande = linhaGulosoPorPosicao(3, 3);
  assert.equal((grande.acerta / grande.posicoes * 100).toFixed(2), '91.57');
});
