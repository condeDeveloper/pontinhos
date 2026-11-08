import test from 'node:test';
import assert from 'node:assert/strict';

import { tabuleiro, fechaQuantas, caixasFechadas, livres, desenhar } from '../js/tabuleiro.js';
import { memoria, valor, melhorLance } from '../js/solucionador.js';
import { valorSemMemoria, placarDeUmaPartida, invariante, otima, gulosa } from '../js/juiz.js';

test('a contagem de arestas e caixas de cada tabuleiro', () => {
  const t = tabuleiro(3, 2);
  assert.equal(t.caixas, 6);
  assert.equal(t.horizontais, 9);  // 3 colunas x 3 linhas de pontos
  assert.equal(t.verticais, 8);    // 2 linhas x 4 colunas de pontos
  assert.equal(t.arestas, 17);
  assert.equal(t.cheio, (1 << 17) - 1);
});

test('toda aresta de borda toca uma caixa e toda aresta de dentro toca duas', () => {
  const t = tabuleiro(2, 2);
  const umaSo = t.caixasDaAresta.filter((cs) => cs.length === 1).length;
  const duas = t.caixasDaAresta.filter((cs) => cs.length === 2).length;
  assert.equal(umaSo, 8, 'as oito arestas de borda');
  assert.equal(duas, 4, 'as quatro arestas de dentro');
  assert.equal(umaSo + duas, t.arestas);
});

test('uma aresta de dentro pode fechar duas caixas de uma vez', () => {
  const t = tabuleiro(2, 1);
  // tudo tracado menos a aresta vertical do meio
  const meio = t.horizontais + 1;
  const estado = t.cheio & ~(1 << meio);
  assert.equal(fechaQuantas(t, estado, meio), 2);
  assert.equal(caixasFechadas(t, estado), 0, 'nenhuma caixa fecha sem ela');
  assert.equal(caixasFechadas(t, t.cheio), 2);
});

test('o tabuleiro vazio tem todas as arestas livres', () => {
  const t = tabuleiro(3, 3);
  assert.equal(livres(t, 0).length, 24);
  assert.equal(livres(t, t.cheio).length, 0);
});

test('o desenho do tabuleiro cheio fecha todas as caixas', () => {
  const t = tabuleiro(2, 1);
  assert.equal(desenhar(t, t.cheio), [
    '*---*---*',
    '|   |   |',
    '*---*---*',
  ].join('\n'));
});

test('fechar caixa da outro lance ao mesmo jogador', () => {
  // numa caixa 1x1 com tres arestas, quem traca a quarta leva a caixa E joga
  // de novo — mas acabou o tabuleiro, entao o valor e exatamente +1.
  const t = tabuleiro(1, 1);
  const memo = memoria(t);
  const tresArestas = 0b0111;
  assert.equal(valor(t, tresArestas, memo), 1);
});

test('a terceira aresta de uma caixa entrega o ponto', () => {
  // com duas arestas tracadas, quem joga tem que evitar a terceira; se a
  // tracar, o outro fecha. Numa caixa 1x1 nao da para evitar.
  const t = tabuleiro(1, 1);
  const memo = memoria(t);
  assert.equal(valor(t, 0, memo), -1, 'quem comeca a caixa solta perde');
});

test('a busca com memoria e a busca sem memoria dao o mesmo valor', () => {
  for (const [c, l] of [[1, 1], [2, 1], [3, 1], [2, 2]]) {
    const t = tabuleiro(c, l);
    const memo = memoria(t);
    assert.equal(valor(t, 0, memo), valorSemMemoria(t, 0), c + 'x' + l);
  }
});

test('jogar a partida da o mesmo placar que o valor da posicao', () => {
  for (const [c, l] of [[2, 1], [3, 1], [2, 2], [3, 2]]) {
    const t = tabuleiro(c, l);
    const memo = memoria(t);
    const v = valor(t, 0, memo);
    const p = placarDeUmaPartida(t, [otima(memo), otima(memo)]);
    assert.equal(p.diferenca, v, c + 'x' + l);
    assert.equal(p.placar[0] + p.placar[1], t.caixas, 'o placar fecha com as caixas');
  }
});

test('o invariante da paridade vale em toda posicao do 3x2', () => {
  const t = tabuleiro(3, 2);
  const memo = memoria(t);
  valor(t, 0, memo);
  for (let estado = 0; estado <= t.cheio; estado++) {
    assert.ok(invariante(t, estado, valor(t, estado, memo)), 'estado ' + estado);
  }
});

test('o melhor lance e sempre legal e sempre atinge o valor', () => {
  const t = tabuleiro(2, 2);
  const memo = memoria(t);
  for (let estado = 0; estado < t.cheio; estado++) {
    const m = melhorLance(t, estado, memo);
    assert.ok(m.aresta >= 0 && m.aresta < t.arestas);
    assert.equal((estado >> m.aresta) & 1, 0, 'o lance escolhido estava livre');
    assert.equal(m.valor, valor(t, estado, memo));
  }
});

test('o guloso fecha caixa sempre que pode', () => {
  const t = tabuleiro(1, 1);
  // tres arestas: o guloso tem que tracar a quarta
  assert.equal(gulosa(t, 0b0111), 3);
});

test('o guloso nao entrega caixa quando ainda da para nao entregar', () => {
  const t = tabuleiro(2, 1);
  // uma aresta tracada: ainda existem arestas que nao deixam caixa com tres
  const e = gulosa(t, 0b0000001);
  const depois = 0b0000001 | (1 << e);
  let entrega = false;
  for (let f = 0; f < t.arestas; f++) {
    if ((depois >> f) & 1) continue;
    if (fechaQuantas(t, depois, f) > 0) entrega = true;
  }
  assert.equal(entrega, false);
});

test('o tabuleiro deitado vale o mesmo que o tabuleiro em pe', () => {
  for (const [c, l] of [[2, 1], [3, 1], [3, 2]]) {
    const a = tabuleiro(c, l);
    const b = tabuleiro(l, c);
    assert.equal(a.arestas, b.arestas);
    assert.equal(valor(a, 0, memoria(a)), valor(b, 0, memoria(b)), c + 'x' + l);
  }
});

test('um lance ilegal e recusado, nao aceito em silencio', () => {
  const t = tabuleiro(2, 1);
  assert.throws(() => placarDeUmaPartida(t, [() => 0, () => 0]), /lance ilegal/);
});

test('tabuleiro grande demais para a varredura e recusado', () => {
  assert.throws(() => tabuleiro(5, 3), /grande demais/);
});
