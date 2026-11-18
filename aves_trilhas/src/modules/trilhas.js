/* ════════════════════════════════════════
   RENDER TRILHAS
════════════════════════════════════════ */
function renderTrilhas() {
  const c = document.getElementById('trailList');
  c.innerHTML = '';
  TRILHAS.forEach((t, ti) => {
    const chips = t.aves.map(ai => {
      const a = AVES[ai];
      return `<div class="bird-chip" onclick="abrirModal(${ai})" onkeydown="if(event.key==='Enter'||event.key===' '){abrirModal(${ai});event.preventDefault()}" role="button" tabindex="0" aria-label="Ave: ${a.n}, nome científico ${a.sci}. Conservação: ${a.stxt}. Ative para ver ficha completa, ouvir o canto e sentir a vibração háptica.">
        <img src="${a.img}" alt="${a.n}" data-aveid="${a.id}">
        <p class="bird-chip-n">${a.n}</p>
      </div>`;
    }).join('');
    const fatos = t.fatos.map(f=>`<div class="trail-fact">${f}</div>`).join('');
    const d = document.createElement('div');
    d.className = `trail-card ${t.lv} fi`;
    d.id = `tr-${t.id}`;
    d.innerHTML = `
      <div class="trail-bar"></div>
      <div class="trail-top" onclick="toggleTrilha('${t.id}')">
        <div class="trail-thumb"><img src="${t.foto}" alt="${t.n}"></div>
        <div>
          <p class="trail-name">${t.n}</p>
          <div class="trail-meta"><span>📍 ${t.km} km</span><span>⏱ ${t.t}</span><span>🦜 ${t.sp} sp.</span></div>
        </div>
        <div class="trail-right">
          <span class="trail-lvl">${t.lvn}</span>
          <svg class="trail-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
      <div class="trail-expand">
        <div class="trail-photo"><img src="${t.foto}" alt="${t.n}"><span class="trail-photo-cap">${t.cap}</span></div>
        <p class="trail-desc">${t.desc}</p>
        <div class="trail-facts">${fatos}</div>
        <p class="birds-lbl">Aves desta trilha</p>
        <div class="birds-scroll">${chips}</div>
        <button class="btn btn-d" onclick="iniciarQuiz(${ti})" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Fazer Quiz (${t.quiz.length} questões)
        </button>
      </div>`;
    c.appendChild(d);
  });
  reobs();
}

function toggleTrilha(id) {
  const el = document.getElementById(`tr-${id}`);
  const foi = el.classList.contains('open');
  document.querySelectorAll('.trail-card').forEach(c => c.classList.remove('open'));
  if (!foi) { el.classList.add('open'); setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),150); }
}

