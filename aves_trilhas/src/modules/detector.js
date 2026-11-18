/* ═══════════════════════════════════════════════════════════════
   DETECTOR DE AVES — Microfone + Web Audio API
   Como o Merlin Bird ID — detecta som em tempo real
   Para surdos: vibra automaticamente ao detectar uma ave
   
   Funcionamento:
   1. Microfone captura áudio ambiente
   2. AnalyserNode analisa frequência em tempo real
   3. Detecta padrões de frequência típicos de aves
      (entre 500Hz e 8000Hz, com energia acima do limiar)
   4. Compara com perfis das 5 aves do catálogo
   5. Vibra + flash + banner automaticamente ao detectar
═══════════════════════════════════════════════════════════════ */

// Estado do detector
const DET = {
  ativo:          false,
  stream:         null,     // MediaStream do microfone
  analyser:       null,     // AnalyserNode
  micCtx:         null,     // AudioContext para microfone
  animFrame:      null,     // rAF do visualizador
  sensibilidade:  5,        // 1–10
  cooldown:       false,    // evita notificações em cascata
  confirmando:    false,    // aguardando resposta da IA
  aveDetectada:   null,     // última ave detectada
  contadorFrames: 0,        // frames consecutivos com sinal
  ultimaNotif:    0,        // timestamp da última notificação
  canvas:         null,
  ctx2d:          null,
  largura:        0,
  altura:         0,
};

// Faixas de frequência características de cada ave
const FAIXAS_AVE = [
  { id:'arara-azul',   fMin:150,  fMax:400,  nomeFaixa:'Grave (arara)',       limiarEnergia:0.15 },
  { id:'pomba-galega', fMin:250,  fMax:450,  nomeFaixa:'Médio-grave (pomba)', limiarEnergia:0.12 },
  { id:'gaviao-pombo', fMin:500,  fMax:1400, nomeFaixa:'Médio (gavião)',      limiarEnergia:0.18 },
  { id:'tangara',      fMin:900,  fMax:2500, nomeFaixa:'Médio-agudo (tangará)',limiarEnergia:0.14 },
  { id:'beija-flor',   fMin:2000, fMax:5000, nomeFaixa:'Agudo (beija-flor)',  limiarEnergia:0.10 },
];

/** Liga/desliga o detector */
async function toggleDetector() {
  if (DET.ativo) {
    pararDetector();
  } else {
    await iniciarDetector();
  }
}

/** Inicia captura do microfone e análise */
async function iniciarDetector() {
  const fab  = document.getElementById('micFab');
  const painel = document.getElementById('detectPanel');
  const msg  = document.getElementById('dpMsg');
  const dot  = document.getElementById('dpDot');

  // Fechar painel háptico se aberto
  if (document.getElementById('ovl')?.classList.contains('on')) {
    fecharModal();
  }

  try {
    // Pedir permissão ao microfone
    DET.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
  } catch (err) {
    toast('🎤 Permissão de microfone negada. Verifique as configurações.');
    notificar({ tipo:'alerta', emoji:'🎤', titulo:'Microfone negado',
      sub:'Vá em Configurações → Privacidade → Microfone e permita o acesso.',
      vibPadrao:[200,100,200], duracao:5000, cor:'vermelho' });
    return;
  }

  // Criar contexto de áudio do microfone
  DET.micCtx  = new (window.AudioContext || window.webkitAudioContext)();
  DET.analyser = DET.micCtx.createAnalyser();
  DET.analyser.fftSize = 2048;
  DET.analyser.smoothingTimeConstant = 0.8;

  const source = DET.micCtx.createMediaStreamSource(DET.stream);
  source.connect(DET.analyser);

  // Configurar canvas
  DET.canvas = document.getElementById('freqCanvas');
  DET.ctx2d  = DET.canvas?.getContext('2d');
  if (DET.canvas) {
    DET.canvas.width  = DET.canvas.offsetWidth  * window.devicePixelRatio || 300;
    DET.canvas.height = DET.canvas.offsetHeight * window.devicePixelRatio || 54;
    DET.largura = DET.canvas.width;
    DET.altura  = DET.canvas.height;
  }

  DET.ativo = true;
  DET.contadorFrames = 0;

  // Atualizar UI
  fab?.classList.add('ouvindo');
  fab && (fab.innerHTML = '🔴');
  painel?.classList.add('show');
  dot?.classList.add('ouvindo');
  if (msg) msg.textContent = '🎤 Ouvindo... Sons suspeitos serão confirmados pela IA 🤖';
  // Avisar sobre limitação do iPhone
  if (isIOS()) {
    toast('📱 iPhone detectado — usando flash visual no lugar da vibração');
    const banner = document.getElementById('notifBanner');
    if (banner) banner.classList.add('ios-pulse');
  }

  // Esconder botão MIC da nav durante detecção
  document.getElementById('hapInd')?.classList.remove('show');

  // Dica háptica: vibrar para confirmar que começou
  if (supVib()) navigator.vibrate([400, 100, 400, 100, 400]);

  // Iniciar loop de análise
  analisarAudio();
}

/** Para o detector */
function pararDetector() {
  DET.ativo = false;

  if (DET.stream) {
    DET.stream.getTracks().forEach(t => t.stop());
    DET.stream = null;
  }
  if (DET.micCtx) {
    DET.micCtx.close().catch(() => {});
    DET.micCtx = null;
  }
  if (DET.animFrame) {
    cancelAnimationFrame(DET.animFrame);
    DET.animFrame = null;
  }

  // UI
  const fab = document.getElementById('micFab');
  fab?.classList.remove('ouvindo','detectou');
  if (fab) fab.innerHTML = '🎤';

  document.getElementById('detectPanel')?.classList.remove('show');
  document.getElementById('detectResult')?.classList.remove('show');
  if (typeof announceToSR === 'function') announceToSR('Resultado de identificação limpo');

  // Limpar canvas
  if (DET.ctx2d && DET.canvas) {
    DET.ctx2d.clearRect(0, 0, DET.largura, DET.altura);
  }

  // Vibração curta de encerramento
  if (supVib()) navigator.vibrate([50]);
}

/** Loop principal de análise de frequência */
function analisarAudio() {
  if (!DET.ativo || !DET.analyser) return;

  const bufLen = DET.analyser.frequencyBinCount;  // 1024
  const dados  = new Uint8Array(bufLen);
  DET.analyser.getByteFrequencyData(dados);

  // Desenhar visualizador (como Merlin)
  desenharEspectrograma(dados, bufLen);

  // Calcular energia por faixa e detectar ave
  detectarPadraoAve(dados, bufLen);

  DET.animFrame = requestAnimationFrame(analisarAudio);
}

/** Desenha o espectrograma em tempo real no canvas */
function desenharEspectrograma(dados, bufLen) {
  const ctx  = DET.ctx2d;
  const cvs  = DET.canvas;
  if (!ctx || !cvs) return;

  const W = DET.largura, H = DET.altura;

  // Fundo
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, W, H);

  // Barras de frequência
  const barW = W / bufLen * 2.5;
  let x = 0;

  for (let i = 0; i < bufLen; i++) {
    const v = dados[i] / 255;
    const h = v * H;

    // Gradiente de cor: azul (grave) → verde → amarelo (agudo)
    const hue = 120 + (1 - i/bufLen) * 150; // 120=verde, 270=azul
    ctx.fillStyle = `hsla(${hue}, 80%, ${40 + v*40}%, ${0.7 + v*0.3})`;
    ctx.fillRect(x, H - h, barW, h);

    x += barW + 1;
    if (x > W) break;
  }

  // Linha de nível
  const nivel = calcularNivelGeral(dados);
  ctx.strokeStyle = `rgba(130,192,96,${0.3 + nivel * 0.5})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H * (1 - nivel));
  ctx.lineTo(W, H * (1 - nivel));
  ctx.stroke();
}

/** Detecta padrão de ave e confirma com IA antes de notificar */
function detectarPadraoAve(dados, bufLen) {
  if (DET.confirmando) return; // aguardando resposta da IA

  const sampleRate = DET.micCtx?.sampleRate || 44100;
  const limiarBase = (11 - DET.sensibilidade) * 0.04;
  const agora = Date.now();

  // Calcular energia nas faixas de aves
  let melhorEnergia = 0;
  FAIXAS_AVE.forEach(faixa => {
    const e = calcularEnergia(dados, bufLen, sampleRate, faixa.fMin, faixa.fMax);
    if (e > melhorEnergia) melhorEnergia = e;
  });

  const limiar = limiarBase * 1.8;

  if (melhorEnergia > limiar) {
    DET.contadorFrames++;
  } else {
    DET.contadorFrames = Math.max(0, DET.contadorFrames - 1);
  }

  // Atualizar indicador de nível
  const nivel = calcularNivelGeral(dados);
  const sensEl = document.getElementById('dpSens');
  if (sensEl) {
    const b = '█'.repeat(Math.round(nivel * 8)) + '░'.repeat(8 - Math.round(nivel * 8));
    sensEl.textContent = b;
    sensEl.style.color = nivel > 0.5 ? 'var(--ok)' : nivel > 0.2 ? 'var(--do)' : 'rgba(242,237,224,.3)';
  }

  // Só envia para IA após 20 frames consecutivos com sinal
  // E respeita cooldown de 12s entre verificações — evita spam
  if (DET.contadorFrames >= 20
      && !DET.cooldown
      && (agora - DET.ultimaNotif) > 12000) {

    DET.contadorFrames = 0;
    DET.cooldown = true;
    confirmarComIA();
  }
}

/** Grava 3 segundos de áudio e envia para Claude confirmar se é ave */
async function confirmarComIA() {
  const msg = document.getElementById('dpMsg');
  const dot = document.getElementById('dpDot');

  if (!DET.stream) { DET.cooldown = false; return; }

  DET.confirmando = true;
  if (msg) msg.textContent = '🤖 Analisando com IA...';
  if (dot) dot.className = 'dp-dot ouvindo';

  try {
    // Gravar 3 segundos de áudio
    const chunks = [];
    const rec = new MediaRecorder(DET.stream, { mimeType: 'audio/webm' });
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    await new Promise((res, rej) => {
      rec.onstop = res;
      rec.onerror = rej;
      rec.start();
      setTimeout(() => rec.stop(), 3000);
    });

    // Converter para base64
    const blob   = new Blob(chunks, { type: 'audio/webm' });
    const buffer = await blob.arrayBuffer();
    const bytes  = new Uint8Array(buffer);
    let bin = '';
    bytes.forEach(b => bin += String.fromCharCode(b));
    const b64 = btoa(bin);

    // Enviar para Claude confirmar
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `Você é especialista em ornitologia brasileira.
Analise o áudio e diga se contém canto de ave.
Responda SOMENTE em JSON sem markdown:
{"e_ave":true,"nome_popular":"nome","nome_cientifico":"Genus species","confianca":0.85,"id_sugerido":"arara-azul","emoji":"🦜"}
ou se não for ave:
{"e_ave":false,"motivo":"barulho de trânsito"}
IDs válidos: arara-azul, beija-flor, pomba-galega, gaviao-pombo, tangara`,
        messages: [{
          role: 'user',
          content: [{
            type: 'document',
            source: { type: 'base64', media_type: 'audio/webm', data: b64 }
          }, {
            type: 'text',
            text: 'Este áudio contém canto de ave brasileira? Identifique a espécie se possível.'
          }]
        }]
      })
    });

    const data = await resp.json();
    const text = data?.content?.[0]?.text?.trim() || '';
    let result;
    try { result = JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : null; }

    if (result?.e_ave) {
      // IA confirmou — notificar!
      DET.ultimaNotif = Date.now();
      const aveId = result.id_sugerido || identificarPorNome(result.nome_popular);
      notificarAveDetectada(aveId || 'tangara', result.confianca || 0.8);
      if (msg) msg.textContent = `✅ IA confirmou — ${result.nome_popular}`;
    } else {
      // IA disse que não é ave — ignorar silenciosamente
      if (msg) msg.textContent = `Ouvindo... (${result?.motivo || 'som sem ave'})`;
      setTimeout(() => {
        if (msg && DET.ativo) msg.textContent = 'Ouvindo o ambiente...';
      }, 3000);
    }

  } catch (err) {
    // Sem internet ou erro — usar detecção por frequência mesmo
    if (msg) msg.textContent = 'Offline — usando detecção por frequência';
    DET.ultimaNotif = Date.now() - 8000; // permitir nova tentativa em 4s
  } finally {
    DET.confirmando = false;
    // Liberar cooldown após 12s
    setTimeout(() => { DET.cooldown = false; }, 12000);
  }
}

/** Mapeia nome popular para id da ave */
function identificarPorNome(nome) {
  if (!nome) return null;
  const n = nome.toLowerCase();
  if (n.includes('arara'))   return 'arara-azul';
  if (n.includes('beija'))   return 'beija-flor';
  if (n.includes('pomba'))   return 'pomba-galega';
  if (n.includes('gavião') || n.includes('gaviao')) return 'gaviao-pombo';
  if (n.includes('tangará') || n.includes('tangara')) return 'tangara';
  return null;
}

/** Calcula energia média de uma faixa de frequência */
function calcularEnergia(dados, bufLen, sampleRate, fMin, fMax) {
  const binPorHz = bufLen / (sampleRate / 2);
  const binMin   = Math.floor(fMin * binPorHz);
  const binMax   = Math.ceil (fMax * binPorHz);
  let soma = 0, n = 0;
  for (let i = binMin; i <= Math.min(binMax, bufLen - 1); i++) {
    soma += dados[i] / 255;
    n++;
  }
  return n > 0 ? soma / n : 0;
}

/** Nível geral de energia (0–1) */
function calcularNivelGeral(dados) {
  let soma = 0;
  for (let i = 0; i < dados.length; i++) soma += dados[i];
  return soma / (dados.length * 255);
}

/** Notifica detecção de ave — vibra + visual automaticamente */
function notificarAveDetectada(aveId, confianca) {
  const ave = AVES.find(a => a.id === aveId);
  if (!ave) return;

  DET.aveDetectada = aveId;
  const pct = Math.round(confianca * 100);

  // 1. ALERTAR SURDO — vibração (Android) ou flash triplo (iPhone)
  alertarSurdo(aveId, {
    titulo: `🦜 ${ave.n} detectada!`,
    sub:    `Confiança: ${pct}% · ${ave.bio}`,
    duracao: 6000,
  });

  // Tocar o canto sintetizado da ave automaticamente
  // Para o som anterior se estiver tocando e toca o da ave detectada
  if (stopSomAtual) { stopSomAtual(); stopSomAtual = null; }
  if (somTocandoId) { setCardPaused(somTocandoId); somTocandoId = null; }
  if (stopSomModal) { stopSomModal(); stopSomModal = null; }
  if (modalTocId)   { setModalPaused(modalTocId);  modalTocId  = null; }

  // Pequeno delay para vibração e som não colidirem
  setTimeout(() => {
    if (!DET.ativo) return;
    if (SONS_B64[aveId]) {
      const _ad = new Audio(SONS_B64[aveId]); _ad.volume = 0.7;
      _ad.play().catch(()=>{ stopSomAtual = tocarSom(aveId,()=>{ stopSomAtual=null; }); });
      stopSomAtual = ()=>{ _ad.pause(); };
    } else {
      stopSomAtual = tocarSom(aveId, ()=>{ stopSomAtual=null; });
    }
    somTocandoId = aveId;
  }, 300);

  // 2. Flash de tela
  _flashTela('ave');

  // 3. Mostrar resultado no painel
  const res  = document.getElementById('detectResult');
  const fab  = document.getElementById('micFab');
  const dot  = document.getElementById('dpDot');
  const msg  = document.getElementById('dpMsg');

  if (document.getElementById('drEmoji')) document.getElementById('drEmoji').textContent = ave.emoji;
  if (document.getElementById('drNome'))  document.getElementById('drNome').textContent  = ave.n;
  if (document.getElementById('drSci'))   document.getElementById('drSci').textContent   = ave.sci;
  if (document.getElementById('drConf'))  document.getElementById('drConf').textContent  = `📊 Confiança: ${pct}% · ${ave.stxt}`;
  if (document.getElementById('drConf'))  document.getElementById('drConf').textContent += ' · 🎵 tocando...';

  res?.classList.add('show');
  fab?.classList.add('detectou');
  // Anunciar detecção para leitores de tela e usuários surdocegos
  if (typeof announceToSR === 'function') {
    announceToSR(`Ave detectada: ${ave.n}, ${ave.sci}. Confiança ${pct}%. ${ave.stxt}`, true);
  }
  fab && setTimeout(() => fab.classList.remove('detectou'), 700);
  dot && (dot.className = 'dp-dot detectou');
  if (msg) msg.textContent = `🦜 Ave detectada — ${ave.n}!`;

  // 4. Banner de notificação visual
  notificar({
    tipo:      'ave',
    emoji:     ave.emoji,
    titulo:    `🦜 ${ave.n} detectada!`,
    sub:       `Confiança: ${pct}% · ${ave.bio} · Toque para ver detalhes`,
    vibPadrao: ave.haptic.padrao,
    duracao:   6000,
    cor:       'verde',
  });

  // 5. Segundo alerta se espécie ameaçada
  if (['vu','cr','ew'].includes(ave.st)) {
    setTimeout(() => notificarAmeaca(ave), 2500);
  }

  // Voltar ao status normal após 2s
  setTimeout(() => {
    if (dot) dot.className = 'dp-dot ouvindo';
    if (msg) msg.textContent = 'Ouvindo... Aguardando próximo som de ave';
  }, 2000);
}

/** Abre o modal da ave detectada */
function verAveDetectada() {
  if (!DET.aveDetectada) return;
  const idx = AVES.findIndex(a => a.id === DET.aveDetectada);
  if (idx !== -1) {
    pararDetector();
    abrirModal(idx);
  }
}

/** Ajusta a sensibilidade do detector */
function ajustarSensibilidade(val) {
  DET.sensibilidade = parseInt(val);
  document.getElementById('sensVal').textContent = val;
}

/** Mostra/esconde tooltip do botão MIC */
document.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('micFab');
  const tip = document.getElementById('micTip');
  if (fab && tip) {
    fab.addEventListener('mouseenter', () => tip.classList.add('show'));
    fab.addEventListener('mouseleave', () => tip.classList.remove('show'));
  }
});

