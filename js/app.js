// A pagina. O adversario aqui e a mesma varredura que os testes medem: ele
// nao tem heuristica, nao tem profundidade e nao tem sorte. Ele sabe o
// resultado de toda posicao do tabuleiro antes de voce clicar.

import { tabuleiro, fechaQuantas, caixasFechadas } from './tabuleiro.js';
import { memoria, valor, melhorLance } from './solucionador.js';
import { gulosa } from './juiz.js';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const estado = document.getElementById('estado');

let t = null;
let memo = null;
let tracadas = 0;
let dono = [];
let vez = 0;        // 0 = pessoa, 1 = computador
let humano = 0;
let acabou = false;

const PASSO = 90;
const MARGEM = 46;

function iniciar(colunas, linhas, quemComeca) {
  estado.textContent = 'Resolvendo o tabuleiro inteiro…';
  // deixa a mensagem pintar antes de travar a aba na varredura
  setTimeout(() => {
    t = tabuleiro(colunas, linhas);
    memo = memoria(t);
    valor(t, 0, memo);
    tracadas = 0;
    dono = new Array(t.caixas).fill(-1);
    humano = 0;
    vez = quemComeca;
    acabou = false;
    tela.width = MARGEM * 2 + colunas * PASSO;
    tela.height = MARGEM * 2 + linhas * PASSO;
    const d = valor(t, 0, memo);
    estado.innerHTML = 'Com os dois jogando perfeito este tabuleiro termina '
      + (d > 0 ? 'com <span class="forte">vitória de quem começa</span>, por ' + d + ' de diferença.'
        : d < 0 ? 'com <span class="forte">vitória de quem responde</span>, por ' + (-d) + ' de diferença.'
          : 'em <span class="forte">empate</span>.');
    desenhar();
    if (vez === 1) setTimeout(jogarComputador, 350);
  }, 30);
}

function pontoDe(r, c) {
  return [MARGEM + c * PASSO, MARGEM + r * PASSO];
}

function arestaEmPontos(e) {
  if (e < t.horizontais) {
    const r = Math.floor(e / t.colunas);
    const c = e % t.colunas;
    return [pontoDe(r, c), pontoDe(r, c + 1)];
  }
  const v = e - t.horizontais;
  const r = Math.floor(v / (t.colunas + 1));
  const c = v % (t.colunas + 1);
  return [pontoDe(r, c), pontoDe(r + 1, c)];
}

function desenhar() {
  ctx.fillStyle = '#0f0b17';
  ctx.fillRect(0, 0, tela.width, tela.height);

  // caixas ja fechadas, pintadas pelo dono
  for (let b = 0; b < t.caixas; b++) {
    if (dono[b] < 0) continue;
    const r = Math.floor(b / t.colunas);
    const c = b % t.colunas;
    const [x, y] = pontoDe(r, c);
    ctx.fillStyle = dono[b] === 0 ? 'rgba(212,83,111,0.30)' : 'rgba(78,201,168,0.22)';
    ctx.fillRect(x + 3, y + 3, PASSO - 6, PASSO - 6);
    ctx.fillStyle = dono[b] === 0 ? '#d4536f' : '#4ec9a8';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dono[b] === 0 ? 'eu' : 'ele', x + PASSO / 2, y + PASSO / 2);
  }

  // arestas
  ctx.lineCap = 'round';
  for (let e = 0; e < t.arestas; e++) {
    const [[x1, y1], [x2, y2]] = arestaEmPontos(e);
    const tem = (tracadas >> e) & 1;
    ctx.strokeStyle = tem ? '#ece7f5' : '#2a2139';
    ctx.lineWidth = tem ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // pontos
  ctx.fillStyle = '#a79cbe';
  for (let r = 0; r <= t.linhas; r++) {
    for (let c = 0; c <= t.colunas; c++) {
      const [x, y] = pontoDe(r, c);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function placar() {
  let meu = 0;
  let dele = 0;
  for (const d of dono) { if (d === 0) meu++; else if (d === 1) dele++; }
  return [meu, dele];
}

function tracar(e) {
  const fecha = fechaQuantas(t, tracadas, e);
  const antes = caixasFechadas(t, tracadas);
  tracadas |= 1 << e;
  if (fecha > 0) {
    for (let b = 0; b < t.caixas; b++) {
      if (dono[b] < 0 && (tracadas & t.mascaraDaCaixa[b]) === t.mascaraDaCaixa[b]) dono[b] = vez;
    }
    if (caixasFechadas(t, tracadas) !== antes + fecha) throw new Error('contagem de caixas furada');
  } else {
    vez = 1 - vez;
  }
  desenhar();
  if (tracadas === t.cheio) {
    acabou = true;
    const [meu, dele] = placar();
    estado.innerHTML = meu > dele
      ? '<span class="ok">Você ganhou</span>, ' + meu + ' a ' + dele + '.'
      : meu < dele
        ? 'Ele ganhou, ' + dele + ' a ' + meu + '. Estava decidido antes do primeiro clique.'
        : 'Empate, ' + meu + ' a ' + dele + '.';
    return;
  }
  if (vez === 1) setTimeout(jogarComputador, 320);
}

function jogarComputador() {
  if (acabou) return;
  tracar(melhorLance(t, tracadas, memo).aresta);
}

function arestaNoPonto(ev) {
  const r = tela.getBoundingClientRect();
  const escala = tela.width / r.width;
  const px = (ev.clientX - r.left) * escala;
  const py = (ev.clientY - r.top) * escala;
  let melhor = -1;
  let menor = 26;
  for (let e = 0; e < t.arestas; e++) {
    if ((tracadas >> e) & 1) continue;
    const [[x1, y1], [x2, y2]] = arestaEmPontos(e);
    const d = Math.hypot(px - (x1 + x2) / 2, py - (y1 + y2) / 2);
    if (d < menor) { menor = d; melhor = e; }
  }
  return melhor;
}

tela.addEventListener('click', (ev) => {
  if (acabou || vez !== humano) return;
  const e = arestaNoPonto(ev);
  if (e >= 0) tracar(e);
});

function novo() {
  const [c, l] = document.getElementById('tamanho').value.split(',').map(Number);
  iniciar(c, l, Number(document.getElementById('quem').value));
}

document.getElementById('novo').addEventListener('click', novo);
document.getElementById('tamanho').addEventListener('change', novo);
document.getElementById('quem').addEventListener('change', novo);

document.getElementById('guloso').addEventListener('click', () => {
  if (acabou || vez !== humano) return;
  tracar(gulosa(t, tracadas));
});

novo();
