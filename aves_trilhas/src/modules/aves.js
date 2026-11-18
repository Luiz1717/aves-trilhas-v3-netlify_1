/* ════════════════════════════════════════
   MODAL COM BLOCO HÁPTICO COMPLETO
════════════════════════════════════════ */
function abrirModal(i) {
  const aveAtual = AVES[i];
  if (aveAtual) announceToSR(getAudioDesc(aveAtual));
  // Salvar foco atual para restaurar ao fechar
  window._lastFocusedBirdChip = document.activeElement;
  const a = AVES[i];
  // Garantir foto carregada
  if (!a.img || a.img.startsWith('data:image/svg')) carregarFotoAve(a);
  const temVib = supVib();
  const barras = gerarBarras(a.id);

  document.getElementById('mbox').innerHTML = `
    <div style="position:relative">
      <div class="m-photo"><img src="${a.img}" alt="Foto de ${a.n} (${a.sci}), ${a.stxt}. ${a.desc.substring(0,150)}" data-aveid="${a.id}"><span class="m-credit">📷 Equipe VALORA · WikiAves · CBRO 2021</span></div>
      <button class="m-x" onclick="fecharModal()" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="m-body">
      <p class="m-name" id="modal-ave-titulo">${a.n}</p>
      <p class="m-sci">${a.sci}</p>
      <p class="m-nomes">${a.nomes}</p>
      <span class="m-badge" style="background:${a.stbg};color:${a.sttc}">${a.st==='vu'?'🟡':'🟢'} ${a.stxt}</span>

      <!-- ★ PLAYER SOM ★ -->
      <div id="playerContainer-${a.id}"></div>

      <!-- ══ BLOCO HÁPTICO ══ -->
      <div class="haptic-block">
        <div class="haptic-block-header">
          <span class="haptic-lbl">📳 Canto em vibração</span>
          <button class="haptic-toggle ${hapticaAtiva?'on':'off'}" id="htoggle" onclick="toggleHaptica()">${hapticaAtiva?'Vibração: ON':'Vibração: OFF'}</button>
        </div>

        <!-- Barras visuais do padrão — "espectrograma tátil" -->
        <div class="haptic-bars" id="hapticBars" role="img" aria-label="Espectrograma tátil: representação visual das barras de vibração do canto desta ave. Cada barra corresponde a um pulso de vibração.">${barras}</div>
        <p class="haptic-desc">${a.haptic.desc}</p>

        <!-- Botão principal -->
        <button class="btn-sentir" id="btnSentir" onclick="sentirCanto('${a.id}')" ${!temVib?'disabled':''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          ${temVib ? 'Sentir o canto' : 'Vibração indisponível neste dispositivo'}
        </button>
        ${!temVib ? '<p style="font-size:11px;color:rgba(24,40,26,.4);text-align:center;margin-top:8px;line-height:1.5">📱 Android com Chrome para vibração · iOS não suporta</p>' : ''}
      </div>
      <!-- ══ FIM HÁPTICO ══ -->

      <div class="m-perigo">${a.perigo}</div>
      <div class="m-facts">
        <div class="mf"><p class="mf-l">Bioma</p><p class="mf-v" style="font-size:10.5px">${a.bio}</p></div>
        <div class="mf"><p class="mf-l">Tamanho</p><p class="mf-v">${a.tam}</p></div>
        <div class="mf"><p class="mf-l">Peso</p><p class="mf-v">${a.peso}</p></div>
        <div class="mf"><p class="mf-l">Dieta</p><p class="mf-v" style="font-size:11px">${a.diet}</p></div>
      </div>
      <p class="m-desc" id="modal-ave-desc">${a.desc}</p>
    </div>`;

  const ovlEl = document.getElementById('ovl');
  ovlEl.classList.add('on');
  document.body.style.overflow = 'hidden';
  // Mover foco para o botão fechar (acessibilidade)
  requestAnimationFrame(() => {
    const closeBtn = ovlEl.querySelector('.m-x');
    if (closeBtn) closeBtn.focus();
  });
  // Renderizar player de som
  setTimeout(() => renderPlayer(a.id, `playerContainer-${a.id}`), 60);

  // Vibrar automaticamente após 500ms ao abrir
  setTimeout(() => sentirCanto(a.id), 500);
  // Alerta visual para ave ameaçada
  if(['vu','cr','ew'].includes(a.st)){
    setTimeout(()=>notificarEspecieAmeacada(a.n, a.stxt), 1200);
  }
}

function sentirCanto(id) {
  vibrarAve(id);
  const ok = true;
  const btn = document.getElementById('btnSentir');
  const bars = document.getElementById('hapticBars');
  if (ok) {
    if (btn) { btn.classList.add('pulsando'); btn.textContent = '📳 Vibrando...'; }
    if (bars) animarBarras(bars, id);
    const dur = (AVES.find(a=>a.id===id)?.haptic.padrao.reduce((a,b)=>a+b,0)||1500);
    setTimeout(() => {
      if (btn) {
        btn.classList.remove('pulsando');
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Sentir o canto novamente`;
      }
    }, dur + 200);
  }
}

function toggleHaptica() {
  hapticaAtiva = !hapticaAtiva;
  localStorage.setItem('haptica', hapticaAtiva?'1':'0');
  if (!hapticaAtiva) pararVib();
  const btn = document.getElementById('htoggle');
  const bvs = document.getElementById('btnSentir');
  if (btn) { btn.textContent = hapticaAtiva?'Vibração: ON':'Vibração: OFF'; btn.className = `haptic-toggle ${hapticaAtiva?'on':'off'}`; }
  if (bvs) bvs.style.opacity = hapticaAtiva?'1':'0.4';
}

function fecharModal(e) {
  if (e && e.target !== document.getElementById('ovl')) return;
  document.getElementById('ovl').classList.remove('on');
  document.body.style.overflow = '';
  // Restaurar foco para o chip que abriu o modal
  if (window._lastFocusedBirdChip && typeof window._lastFocusedBirdChip.focus === 'function') {
    requestAnimationFrame(() => { window._lastFocusedBirdChip.focus(); });
  }
  // Anunciar fechamento para leitores de tela
  if (typeof announceToSR === 'function') announceToSR('Modal fechado');
}

