
// ── FUNÇÕES DE ACESSIBILIDADE ──────────────────────────────────────────────
function announceToSR(msg, urgent) {
  const el = document.getElementById(urgent ? 'sr-alerts' : 'sr-announcer');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// Audiodescrição das aves para leitores de tela
function getAudioDesc(a) {
  const statusMap = {
    'vu':'espécie Vulnerável — ameaçada de extinção',
    'lc':'espécie de Pouco Preocupante — sem risco imediato',
    'nt':'espécie Quase Ameaçada — próxima do risco',
    'cr':'espécie Criticamente em Perigo — risco muito alto de extinção',
    'en':'espécie Em Perigo — alto risco de extinção'
  };
  const st = statusMap[a.st] || a.stxt;
  const bioma = a.bio ? `. Habita o bioma ${a.bio}` : '';
  const tam = a.tam ? `. Tamanho: ${a.tam}` : '';
  const diet = a.diet ? `. Dieta: ${a.diet}` : '';
  return `${a.n}. Nome científico: ${a.sci}. Nomes populares: ${a.nomes || 'não informado'}. Status de conservação: ${st}${bioma}${tam}${diet}. Descrição: ${a.desc} Padrão háptico — como sentir o canto por vibração: ${a.haptic.desc}`;
}

// Melhorar foco ao abrir modal

// ── TRAP DE FOCO NO MODAL ─────────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  const ovl = document.getElementById('ovl');
  if (!ovl || !ovl.classList.contains('on')) return;
  
  // ESC fecha o modal
  if (e.key === 'Escape') {
    e.preventDefault();
    fecharModal();
    return;
  }
  
  // Tab prende foco dentro do modal
  if (e.key === 'Tab') {
    const focusables = ovl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
});

// Fechar modal com ESC também no overlay
document.addEventListener('DOMContentLoaded', function() {
  // Verificar preferência de movimento reduzido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--anim-duration', '0.01ms');
  }
});

function moverFocoModal() {
  requestAnimationFrame(() => {
    const el = document.querySelector('#modal .m-x') || document.getElementById('modal');
    if (el) el.focus();
  });
}
