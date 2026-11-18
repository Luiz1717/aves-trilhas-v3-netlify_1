/* ════════════════════════════════════════
   SISTEMA DE NOTIFICAÇÃO PARA SURDOS
   Não depende de som — visual + háptico

   Como surdos percebem uma ave "gritando":
   1. Flash de tela — tela pisca na cor da urgência
   2. Banner visual — aparece no topo com descrição
   3. Barrinhas animadas — mostram o "ritmo" do alerta
   4. Vibração do celular — padrão específico por tipo
   5. Indicador 📳 — bolinha pulsante enquanto vibra
   6. Notificação nativa — aparece na barra do celular
════════════════════════════════════════ */

let notifTimer = null;
let notifProg  = null;
let indTimer   = null;

/**
 * Notificação completa para surdos
 * @param {object} opts
 *   tipo: 'ave' | 'alerta' | 'sucesso' | 'info'
 *   emoji: emoji da ave ou ícone
 *   titulo: texto principal
 *   sub: texto secundário
 *   vibPadrao: array de vibração
 *   duracao: ms que fica visível (padrão 4000)
 *   cor: 'verde' | 'vermelho' | 'dourado'
 */
function notificar(opts) {
  const {
    tipo      = 'info',
    emoji     = '🦜',
    titulo    = '',
    sub       = '',
    vibPadrao = [100, 60, 100],
    duracao   = 4000,
    cor       = 'verde',
  } = opts;

  // 1. Flash de tela (pisca na cor do tipo)
  _flashTela(tipo);

  // 2. Vibração háptica específica
  if (hapticaAtiva && supVib()) {
    navigator.vibrate(vibPadrao);
    _mostrarIndicador(vibPadrao.reduce((a,b)=>a+b,0));
  }

  // 3. Banner visual
  _mostrarBanner({emoji, titulo, sub, tipo, cor, duracao});

  // 4. Toast curto (texto na parte inferior)
  toast(titulo);

  // 5. Notificação nativa do sistema (barra do celular)
  _notificacaoNativa(emoji + ' ' + titulo, sub);
}

/* ── Flash de tela ── */
function _flashTela(tipo) {
  const el = document.getElementById('screenFlash');
  if (!el) return;

  // Cor do flash conforme tipo
  const cores = {
    ave:     'rgba(90,144,72,.5)',
    alerta:  'rgba(176,48,32,.6)',
    sucesso: 'rgba(34,136,68,.5)',
    info:    'rgba(30,51,32,.4)',
  };
  el.style.background = cores[tipo] || cores.info;
  el.classList.remove('ativo');
  void el.offsetWidth; // força reflow para reiniciar animação
  el.classList.add('ativo');
  setTimeout(() => el.classList.remove('ativo'), 700);
}

/* ── Banner visual ── */
function _mostrarBanner({emoji, titulo, sub, tipo, cor, duracao}) {
  const banner   = document.getElementById('notifBanner');
  const progress = document.getElementById('notifProgress');
  const iconWrap = document.getElementById('notifIconWrap');
  const iconEmj  = document.getElementById('notifIconEmoji');
  const tituloEl = document.getElementById('notifTitulo');
  const subEl    = document.getElementById('notifSub');
  const vibwave  = document.getElementById('notifVibwave');
  if (!banner) return;

  // Preencher conteúdo
  iconEmj.textContent  = emoji;
  tituloEl.textContent = titulo;
  subEl.textContent    = sub;

  // Estilo conforme tipo
  banner.className = `notif-banner ${{
    alerta:  'urgente',
    sucesso: 'sucesso',
    ave:     'info',
    info:    'info',
  }[tipo] || 'info'}`;

  iconWrap.className = `notif-icon-wrap ${{
    alerta:  'vermelho',
    sucesso: 'verde',
    ave:     'verde',
    info:    'dourado',
  }[tipo] || 'verde'}`;

  // Barrinhas animadas só enquanto visível
  vibwave.style.display = (hapticaAtiva && supVib()) ? 'flex' : 'none';
  const vwBars = vibwave.querySelectorAll('.vw-bar');
  vwBars.forEach(b => b.style.background = tipo === 'alerta' ? 'var(--err)' : 'var(--vb)');

  // Mostrar banner
  clearTimeout(notifTimer);
  clearInterval(notifProg);
  banner.classList.add('show');

  // Barra de progresso
  progress.style.transition = 'none';
  progress.style.transform = 'scaleX(1)';
  void progress.offsetWidth;
  progress.style.transition = `transform ${duracao}ms linear`;
  progress.style.transform = 'scaleX(0)';

  // Fechar após duração
  notifTimer = setTimeout(() => fecharBanner(), duracao);
}

function fecharBanner() {
  clearTimeout(notifTimer);
  document.getElementById('notifBanner')?.classList.remove('show');
}

/* ── Indicador 📳 pulsante ── */
function _mostrarIndicador(duracaoMs) {
  const el = document.getElementById('hapticIndicator');
  if (!el) return;
  clearTimeout(indTimer);
  el.classList.add('show');
  indTimer = setTimeout(() => el.classList.remove('show'), duracaoMs + 300);
}

/* ── Notificação nativa do celular ── */
async function _notificacaoNativa(titulo, corpo) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    // Pedir permissão na primeira vez
    await Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(titulo, {
        body: corpo,
        icon: '', // pode colocar URL de ícone aqui
        badge: '',
        vibrate: [200, 100, 200], // vibração nativa da notificação
        silent: false, // deixa o sistema decidir
        tag: 'aves-trilhas', // substitui notificação anterior
      });
    } catch(e) {
      // Algumas versões não suportam todos os campos
    }
  }
}

/* ══ NOTIFICAÇÕES ESPECÍFICAS POR EVENTO ══ */

/**
 * Notifica quando uma ave é identificada pela câmera IA
 * @param {object} ave - dados da ave identificada
 */
function notificarAveIdentificada(ave) {
  notificar({
    tipo:      'ave',
    emoji:     ave.emoji || '🦜',
    titulo:    `${ave.nome_popular || ave.n} identificada!`,
    sub:       `${ave.nome_cientifico || ave.sci} · Toque para sentir o canto`,
    vibPadrao: [80, 50, 80, 50, 200], // padrão de "descoberta"
    duracao:   5000,
    cor:       'verde',
  });
}

/**
 * Notifica quando uma ave é avistada na trilha
 * @param {string} nomeAve
 * @param {string} trilhaNome
 */
function notificarAveAvistada(nomeAve, trilhaNome) {
  notificar({
    tipo:      'ave',
    emoji:     '👀',
    titulo:    `Ave avistada: ${nomeAve}`,
    sub:       `Na trilha ${trilhaNome} — toque para ver detalhes`,
    vibPadrao: [50, 30, 50, 30, 50, 30, 200], // pulsos rápidos = animação
    duracao:   4500,
    cor:       'verde',
  });
}

/**
 * Notifica alerta de conservação (ave ameaçada)
 * @param {string} nomeAve
 * @param {string} status - ex: "Vulnerável (VU)"
 */
function notificarEspecieAmeacada(nomeAve, status) {
  notificar({
    tipo:      'alerta',
    emoji:     '⚠️',
    titulo:    `${nomeAve} está ameaçada`,
    sub:       `Status: ${status} · Ajude a proteger esta espécie`,
    vibPadrao: [300, 100, 100, 100, 300], // SOS háptico
    duracao:   6000,
    cor:       'vermelho',
  });
}

/**
 * Notifica registro confirmado
 * @param {string} nomeAve
 */
function notificarRegistroSalvo(nomeAve) {
  notificar({
    tipo:      'sucesso',
    emoji:     '✅',
    titulo:    `${nomeAve} registrada!`,
    sub:       'Seu avistamento foi salvo. Obrigado pela contribuição científica!',
    vibPadrao: [80, 60, 80], // confirmação suave
    duracao:   3500,
    cor:       'verde',
  });
}

/**
 * Notifica quando o quiz termina
 * @param {number} pct - percentual de acerto
 */
function notificarResultadoQuiz(pct) {
  const ok = pct >= 70;
  notificar({
    tipo:      ok ? 'sucesso' : 'info',
    emoji:     pct === 100 ? '🏆' : pct >= 70 ? '🌿' : '🌱',
    titulo:    ok ? `Quiz concluído — ${pct}% de acerto!` : `Quiz concluído — ${pct}%`,
    sub:       ok ? 'Parabéns! Você conhece bem as aves brasileiras.' : 'Continue estudando — você vai melhorar!',
    vibPadrao: ok ? [100, 50, 100, 50, 200] : [200],
    duracao:   4000,
    cor:       ok ? 'verde' : 'dourado',
  });
}

/* ── Toast simples (texto só na parte inferior) ── */
let toastT;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),3200);
}

