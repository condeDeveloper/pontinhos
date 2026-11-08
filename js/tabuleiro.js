// O tabuleiro do jogo dos pontinhos.
//
// Um tabuleiro de `colunas` x `linhas` caixas tem pontos nos cantos e arestas
// entre pontos vizinhos. O estado do jogo inteiro e o conjunto de arestas ja
// tracadas — um numero de `arestas` bits. Nada mais precisa ser guardado: de
// quem e a vez nao entra no estado, e a razao esta no `solucionador.js`.

/**
 * Prepara as tabelas de um tabuleiro:
 *
 *   arestas          quantas arestas existem
 *   caixas           quantas caixas existem
 *   mascaraDaCaixa   as quatro arestas de cada caixa, em mascara de bits
 *   caixasDaAresta   que caixas cada aresta ajuda a fechar
 *
 * As arestas horizontais vem primeiro, linha de pontos por linha de pontos, e
 * depois as verticais. A ordem nao importa para o jogo, mas importa para os
 * numeros: trocar a ordem troca a numeracao dos estados.
 */
export function tabuleiro(colunas, linhas) {
  const horizontais = colunas * (linhas + 1);
  const verticais = linhas * (colunas + 1);
  const arestas = horizontais + verticais;
  const caixas = colunas * linhas;
  // O estado e uma mascara de `arestas` bits e a memoria do solucionador e um
  // vetor de 2^arestas bytes. Acima de 26 o vetor passa de 64 MB e a varredura
  // deixa de ser honesta: melhor falhar aqui do que devolver numero pela metade.
  if (arestas > 26) throw new Error('tabuleiro grande demais: ' + arestas + ' arestas');

  const h = (r, c) => r * colunas + c;
  const v = (r, c) => horizontais + r * (colunas + 1) + c;

  const mascaraDaCaixa = [];
  const caixasDaAresta = Array.from({ length: arestas }, () => []);
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      const b = r * colunas + c;
      const lados = [h(r, c), h(r + 1, c), v(r, c), v(r, c + 1)];
      let m = 0;
      for (const e of lados) { m |= 1 << e; caixasDaAresta[e].push(b); }
      mascaraDaCaixa.push(m);
    }
  }

  return {
    colunas, linhas, arestas, caixas, horizontais, verticais,
    mascaraDaCaixa, caixasDaAresta,
    cheio: (1 << arestas) - 1,
  };
}

/** Quantas caixas a aresta `e` fecha, se tracada no estado `estado`. */
export function fechaQuantas(t, estado, e) {
  const depois = estado | (1 << e);
  let n = 0;
  for (const b of t.caixasDaAresta[e]) {
    if ((depois & t.mascaraDaCaixa[b]) === t.mascaraDaCaixa[b]) n++;
  }
  return n;
}

/** Quantas caixas ja estao fechadas no estado. */
export function caixasFechadas(t, estado) {
  let n = 0;
  for (let b = 0; b < t.caixas; b++) {
    if ((estado & t.mascaraDaCaixa[b]) === t.mascaraDaCaixa[b]) n++;
  }
  return n;
}

/** As arestas ainda livres, em lista. */
export function livres(t, estado) {
  const saida = [];
  for (let e = 0; e < t.arestas; e++) if (!((estado >> e) & 1)) saida.push(e);
  return saida;
}

/** O tabuleiro desenhado em texto, para olhar um estado sem abrir a pagina. */
export function desenhar(t, estado) {
  const h = (r, c) => r * t.colunas + c;
  const v = (r, c) => t.horizontais + r * (t.colunas + 1) + c;
  const tem = (e) => ((estado >> e) & 1) === 1;
  const saida = [];
  for (let r = 0; r <= t.linhas; r++) {
    let topo = '';
    for (let c = 0; c < t.colunas; c++) topo += '*' + (tem(h(r, c)) ? '---' : '   ');
    saida.push(topo + '*');
    if (r === t.linhas) break;
    let meio = '';
    for (let c = 0; c <= t.colunas; c++) meio += (tem(v(r, c)) ? '|' : ' ') + '   ';
    saida.push(meio.trimEnd());
  }
  return saida.join('\n');
}
