/* ═══════════════════════════════════════════════════════════════
   WIKIMEDIA COMMONS — Carregamento automático de fotos
   Busca a imagem principal de cada ave via Wikipedia REST API
   Fallback: placeholder SVG colorido por espécie
═══════════════════════════════════════════════════════════════ */
const WIKI_CACHE = {};  // cache de URLs já carregadas

/**
 * Busca imagem da ave no Wikimedia Commons via Wikipedia API
 * @param {string} wikiTitle - título da página (ex: Anodorhynchus_hyacinthinus)
 * @returns {Promise<string>} URL da imagem
 */
async function buscarFotoWikimedia(wikiTitle) {
  if (WIKI_CACHE[wikiTitle]) return WIKI_CACHE[wikiTitle];

  try {
    // Wikipedia REST API — retorna resumo com thumbnail
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const res  = await fetch(url, { headers: {'Accept': 'application/json'} });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    // Preferir imagem original (maior) sobre thumbnail
    const imgUrl = data.originalimage?.source || data.thumbnail?.source || null;
    if (imgUrl) {
      WIKI_CACHE[wikiTitle] = imgUrl;
      return imgUrl;
    }
  } catch (e) {
    // Se falhar, tentar Wikimedia Commons diretamente
    try {
      const url2 = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(wikiTitle)}.jpg&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const res2 = await fetch(url2);
      const data2 = await res2.json();
      const pages = Object.values(data2?.query?.pages || {});
      const imgUrl2 = pages[0]?.imageinfo?.[0]?.url;
      if (imgUrl2) {
        WIKI_CACHE[wikiTitle] = imgUrl2;
        return imgUrl2;
      }
    } catch(e2) {}
  }
  return null;
}

/**
 * Gera placeholder SVG quando não tem foto
 * Cada ave tem cor única baseada no emoji/status
 */
function gerarPlaceholder(ave) {
  const cores = {
    '💙': '#1a5276', '🦜': '#1e8449', '🌺': '#c0392b',
    '🕊️': '#7f8c8d', '🦅': '#784212', '🦩': '#e91e8c',
    '💛': '#f39c12', '🎵': '#884ea0', '🦉': '#6e2f00',
    '🐦': '#1a5276', '🦃': '#212121', '🦆': '#1565c0',
    '❤️': '#c0392b', '💃': '#1e8449', '🦚': '#145a32',
  };
  const cor = cores[ave.emoji] || '#2E5C30';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${cor}"/>
    <rect x="0" y="200" width="400" height="100" fill="rgba(0,0,0,.3)"/>
    <text x="200" y="130" font-size="80" text-anchor="middle" dominant-baseline="middle">${ave.emoji}</text>
    <text x="200" y="230" font-size="16" text-anchor="middle" fill="white" font-family="Arial">${ave.n}</text>
    <text x="200" y="255" font-size="12" text-anchor="middle" fill="rgba(255,255,255,.7)" font-family="Arial" font-style="italic">${ave.sci}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/**
 * Carrega foto de uma ave e atualiza todos os elementos da UI
 * @param {object} ave - objeto da ave
 */
async function carregarFotoAve(ave) {
  if (ave.img && !ave.img.startsWith('data:image/svg')) return; // já tem foto real

  // Placeholder imediato enquanto carrega
  if (!ave.img) {
    ave.img = gerarPlaceholder(ave);
    atualizarImgAve(ave);
  }

  const url = await buscarFotoWikimedia(ave.wiki);
  if (url) {
    ave.img = url;
    WIKI_CACHE[ave.wiki] = url;
    atualizarImgAve(ave);
  }
}

/** Atualiza todos os elementos img da ave na página */
function atualizarImgAve(ave) {
  // Cards da galeria
  document.querySelectorAll(`img[data-aveid="${ave.id}"]`).forEach(img => {
    img.src = ave.img;
  });
  // Modal (se aberto para esta ave)
  const mphoto = document.querySelector(`#ovl .m-photo img`);
  if (mphoto && mphoto.dataset.aveid === ave.id) mphoto.src = ave.img;
}

/** Carrega todas as fotos em paralelo ao iniciar */
async function carregarTodasFotos() {
  // Carregar em lotes de 4 para não sobrecarregar a API
  const LOTE = 4;
  for (let i = 0; i < AVES.length; i += LOTE) {
    const lote = AVES.slice(i, i + LOTE);
    await Promise.all(lote.map(a => carregarFotoAve(a)));
    if (i + LOTE < AVES.length) {
      await new Promise(r => setTimeout(r, 300)); // pausa entre lotes
    }
  }
}

function renderAves() {
  const g = document.getElementById('avesGrid');
  g.innerHTML = '';
  AVES.forEach((a, i) => {
    const barsHTML = Array.from({length:15},(_,j)=>{
      const alts=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19];
      return `<div class="cpb" style="height:\${alts[j]}px"></div>`;
    }).join('');
    const d = document.createElement('div');
    d.className = 'ave-card fi';
    d.innerHTML = `
      <div class="ave-img-w" onclick="abrirModal(${i})">
        <img src="${a.img}" alt="${a.n}" data-aveid="${a.id}">
        <span class="ave-st ${a.st === 'vu' ? 's-vu' : 's-lc'}">${a.stxt.split(' ')[0]}</span>
      </div>
      <div onclick="abrirModal(${i})" style="padding:10px 11px 7px">
        <p class="ave-name">${a.n}</p>
        <p class="ave-sci">${a.sci}</p>
      </div>
      <!-- Mini player de som -->
      <div class="card-player">
        <button class="cp-play" id="cpplay-${a.id}" onclick="toggleSomCard('${a.id}')" aria-label="Tocar canto de ${a.n}" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="cp-bars" id="cpbars-${a.id}">${barsHTML}</div>
        <span style="font-size:9px;color:rgba(24,40,26,.32);flex-shrink:0">♪ som</span>
      </div>
      <!-- Botão vibração háptica -->
      <button class="btn-hap-card" id="bhap-${a.id}" onclick="vibrarCard('${a.id}')" aria-label="Sentir canto por vibração">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
        📳 ${isIOS()?'✨ Flash visual (iPhone)':'📳 Sentir o canto'}
      </button>`;
    g.appendChild(d);
  });
  reobs();
}

function vibrarCard(id) {
  const btn = document.getElementById(`bvc-${id}`);
  const ok = vibrar(AVES.find(a=>a.id===id)?.haptic.padrao || [], AVES.find(a=>a.id===id)?.haptic.rep || 1);
  if (ok && btn) {
    btn.classList.add('vibrando');
    btn.textContent = '📳 Vibrando...';
    const dur = (AVES.find(a=>a.id===id)?.haptic.padrao.reduce((a,b)=>a+b,0) || 1000);
    setTimeout(() => {
      btn.classList.remove('vibrando');
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>📳 Sentir o canto`;
    }, dur);
  } else if (!supVib()) {
    toast('📱 Use Android com Chrome para vibração');
    announceToSR('Vibração não disponível neste dispositivo. Use Android com Chrome.', true);
  }
}

