/* ═══════════════════════════════════════════════════════════
   SISTEMA DE SOM — Web Audio API
   Sons 100% offline, sem CORS, sem servidor externo
   Cada ave tem perfil acústico baseado no canto real
═══════════════════════════════════════════════════════════ */

let audioCtx      = null;
let somTocandoId  = null;   // id do card tocando
let stopSomAtual  = null;   // para parar o card
let stopSomModal  = null;   // para parar o modal
let modalTocId    = null;   // id do modal tocando
let animCardF     = null;
let animModalF    = null;

// ── HÁPTICA GLOBAL ───────────────────────────────────────────────────────────
let hapticaAtiva  = true;   // estado global da vibração háptica
let _vibTimer     = null;   // timer de vibração em andamento

function supVib() {
  return 'vibrate' in navigator;
}

function pararVib() {
  if (supVib()) navigator.vibrate(0);
  if (_vibTimer) { clearTimeout(_vibTimer); _vibTimer = null; }
}

function getACtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/* Perfis acústicos das 5 aves brasileiras */
const PERFIS_SOM = {
  'arara-azul':       {notas:[{f:210,d:280,p:130},{f:185,d:320,p:145},{f:165,d:500,p:280},{f:200,d:260,p:110},{f:175,d:300,p:0}],tipo:'sawtooth',vib:{r:5,dep:18},rep:2},
  'tucano-toco':      {notas:[{f:380,d:80,p:60},{f:420,d:60,p:60},{f:350,d:120,p:200}],tipo:'sawtooth',vib:{r:4,dep:10},rep:3},
  'beija-flor':       {notas:[{f:3100,d:36,p:24},{f:3500,d:40,p:27},{f:2900,d:36,p:22},{f:3700,d:44,p:29},{f:3000,d:36,p:0}],tipo:'sine',vib:{r:12,dep:40},rep:3},
  'garca-branca':     {notas:[{f:280,d:150,p:100},{f:260,d:200,p:150},{f:240,d:300,p:0}],tipo:'triangle',vib:{r:3,dep:6},rep:2},
  'gaviao-real':      {notas:[{f:1200,d:25,p:0},{f:1050,d:45,p:0},{f:875,d:285,p:182},{f:690,d:62,p:0}],tipo:'sawtooth',vib:{r:3,dep:8},rep:3},
  'ema':              {notas:[{f:80,d:180,p:80},{f:75,d:220,p:100},{f:70,d:400,p:0}],tipo:'sine',vib:{r:3,dep:5},rep:2},
  'flamingo':         {notas:[{f:320,d:70,p:50},{f:300,d:70,p:50},{f:315,d:70,p:50},{f:295,d:70,p:50}],tipo:'triangle',vib:{r:4,dep:10},rep:3},
  'ararajuba':        {notas:[{f:800,d:60,p:40},{f:850,d:50,p:40},{f:780,d:80,p:40},{f:820,d:60,p:0}],tipo:'sawtooth',vib:{r:6,dep:20},rep:2},
  'sabia-laranjeira': {notas:[{f:800,d:60,p:30},{f:950,d:60,p:30},{f:900,d:60,p:30},{f:1100,d:60,p:30},{f:1000,d:60,p:0}],tipo:'sine',vib:{r:6,dep:20},rep:3},
  'coruja-buraqueira':{notas:[{f:340,d:120,p:80},{f:320,d:140,p:100}],tipo:'triangle',vib:{r:4,dep:10},rep:4},
  'pica-pau':         {notas:[{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:18},{f:400,d:20,p:0}],tipo:'square',vib:{r:0,dep:0},rep:3},
  'papagaio-real':    {notas:[{f:700,d:80,p:50},{f:750,d:70,p:50},{f:680,d:100,p:40},{f:720,d:80,p:0}],tipo:'sawtooth',vib:{r:5,dep:15},rep:2},
  'soldadinho':       {notas:[{f:1400,d:50,p:30},{f:1650,d:50,p:30},{f:1300,d:50,p:30},{f:1800,d:50,p:30},{f:1500,d:50,p:0}],tipo:'sine',vib:{r:8,dep:25},rep:2},
  'mutum':            {notas:[{f:90,d:200,p:100},{f:85,d:250,p:120},{f:80,d:500,p:0}],tipo:'sine',vib:{r:3,dep:5},rep:2},
  'socoo':            {notas:[{f:160,d:180,p:80},{f:150,d:220,p:100},{f:140,d:400,p:0}],tipo:'triangle',vib:{r:4,dep:8},rep:2},
  'pato-mergulhao':   {notas:[{f:460,d:70,p:50},{f:440,d:80,p:50},{f:420,d:100,p:0}],tipo:'sawtooth',vib:{r:5,dep:12},rep:2},
  'ararajuba-verde':  {notas:[{f:750,d:70,p:40},{f:800,d:60,p:40},{f:720,d:90,p:40},{f:780,d:70,p:0}],tipo:'sawtooth',vib:{r:5,dep:15},rep:2},
  'rolinha-roxa':     {notas:[{f:320,d:90,p:68},{f:305,d:96,p:73},{f:290,d:50,p:0},{f:280,d:50,p:0},{f:270,d:50,p:0}],tipo:'triangle',vib:{r:4,dep:12},rep:2},
  'tangara':          {notas:[{f:1400,d:55,p:32},{f:1650,d:55,p:32},{f:1300,d:55,p:32},{f:1800,d:55,p:32},{f:1500,d:55,p:0}],tipo:'sine',vib:{r:8,dep:26},rep:2},
  'pomba-galega':     {notas:[{f:315,d:90,p:68},{f:295,d:96,p:73},{f:275,d:205,p:108},{f:305,d:88,p:66},{f:285,d:93,p:0}],tipo:'triangle',vib:{r:4,dep:12},rep:2},
  'gaviao-pombo':     {notas:[{f:1050,d:72,p:36},{f:875,d:285,p:182},{f:690,d:62,p:31},{f:825,d:265,p:0}],tipo:'sawtooth',vib:{r:3,dep:8},rep:1},
};


function durPerfil(id) {
  const p = PERFIS_SOM[id]; if (!p) return 2000;
  return (p.notas.reduce((s,n)=>s+n.d+n.p,0) * p.rep + (p.rep-1)*180);
}

function tocarSom(id, onEnd) {
  const ctx    = getACtx();
  const perfil = PERFIS_SOM[id];
  if (!perfil) { if(onEnd) onEnd(); return null; }
  let stopped = false;
  let t = ctx.currentTime + 0.04;
  const oscs = [];

  const nota = (n, cb) => {
    if (stopped) return;
    const dS = n.d/1000, pS = n.p/1000;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const out = ctx.createGain();
    osc.type = perfil.tipo;
    osc.frequency.setValueAtTime(n.f, t);
    if (perfil.vib) {
      const vo = ctx.createOscillator();
      const vg = ctx.createGain();
      vo.frequency.value = perfil.vib.r;
      vg.gain.value = perfil.vib.dep;
      vo.connect(vg); vg.connect(osc.detune);
      vo.start(t); vo.stop(t + dS + 0.02);
      oscs.push(vo);
    }
    const g = n.g || 0.55;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(g, t + 0.02);
    env.gain.setValueAtTime(g * 0.92, t + dS - 0.05);
    env.gain.linearRampToValueAtTime(0, t + dS);
    out.gain.value = 0.6;
    osc.connect(env); env.connect(out); out.connect(ctx.destination);
    osc.start(t); osc.stop(t + dS + 0.02);
    oscs.push(osc);
    t += dS + pS;
  };

  for (let r = 0; r < perfil.rep; r++) {
    if (r > 0) t += 0.18;
    perfil.notas.forEach(n => nota(n));
  }

  const total = (t - ctx.currentTime) * 1000 + 80;
  const timer = setTimeout(() => { if (!stopped && onEnd) onEnd(); }, total);

  return () => {
    stopped = true;
    clearTimeout(timer);
    oscs.forEach(o => { try { o.stop(); } catch(e) {} });
    if (onEnd) onEnd();
  };
}

/* ── Card player ── */
function toggleSomCard(id) {
  const btn = document.getElementById('cpplay-' + id);
  if (somTocandoId === id && _audCard && !_audCard.paused) {
    _audCard.pause(); setCardPaused(id); somTocandoId = null; return;
  }
  if (_audCard) { _audCard.pause(); _audCard.currentTime = 0; }
  if (stopSomAtual) { stopSomAtual(); stopSomAtual = null; }
  if (somTocandoId) setCardPaused(somTocandoId);
  if (animCardF) { cancelAnimationFrame(animCardF); animCardF = null; }
  somTocandoId = id;
  if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'; btn.classList.add('tocando'); }
  const a = AVES.find(x => x.id === id);
  function iniciarSom() {
    animarCardBars(id);
    alertarSurdo(id, {
      titulo: `🎵 ${a.n} — canto`,
      sub:    `${a.bio}`,
      duracao: 4000,
    });
  }
  if (SONS_B64[id]) {
    _audCard = new Audio(SONS_B64[id]);
    _audCard.onplay  = iniciarSom;
    _audCard.onended = () => { setCardPaused(id); somTocandoId = null; };
    _audCard.onerror = () => { stopSomAtual = tocarSom(id, ()=>{ setCardPaused(id); somTocandoId=null; stopSomAtual=null; }); iniciarSom(); };
    _audCard.play().catch(() => { stopSomAtual = tocarSom(id, ()=>{ setCardPaused(id); somTocandoId=null; stopSomAtual=null; }); iniciarSom(); });
  } else {
    stopSomAtual = tocarSom(id, ()=>{ setCardPaused(id); somTocandoId=null; stopSomAtual=null; });
    iniciarSom();
  }
}
let _audCard = null;

function setCardPaused(id) {
  const btn = document.getElementById('cpplay-' + id);
  if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>'; btn.classList.remove('tocando'); }
  if (animCardF) { cancelAnimationFrame(animCardF); animCardF = null; }
  const alts=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19];
  document.querySelectorAll(`#cpbars-${id} .cpb`).forEach((b,i)=>{
    b.style.height=alts[i%15]+'px'; b.style.background='rgba(90,144,72,.18)'; b.classList.remove('ativo');
  });
}

function animarCardBars(id) {
  const bars = document.querySelectorAll(`#cpbars-${id} .cpb`);
  if (!bars.length) return;
  const alts=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19];
  const t0 = performance.now();
  function fr(now) {
    if (somTocandoId !== id) return;
    const t=(now-t0)/1000;
    bars.forEach((b,i)=>{ b.style.height=(alts[i%15]*(0.35+0.65*Math.abs(Math.sin(t*4+i*0.5))))+'px'; b.style.background='rgba(90,144,72,.72)'; b.classList.add('ativo'); });
    animCardF = requestAnimationFrame(fr);
  }
  animCardF = requestAnimationFrame(fr);
}

/* ── Modal player ── */
function renderPlayer(aveId, containerId) {
  const a = AVES.find(x => x.id === aveId);
  const c = document.getElementById(containerId);
  if (!c || !a) return;

  const hs=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19,22,8,12,16,20,14,10,18,6,13,17,9,11,15,19,8,12,20,14,6,16,10,18,13,7];
  const bars = Array.from({length:40},(_,i)=>`<div class="sv-bar" id="svb-${aveId}-${i}" style="height:${hs[i]}px"></div>`).join('');
  const durStr = fmtTS(durPerfil(aveId)/1000);

  c.innerHTML = `
    <div class="sound-player">
      <div class="sp-header">
        <span class="sp-title">🎵 Canto Real</span>
        <span class="sp-credit">Som real · FM Synthesis</span>
      </div>
      <div class="sp-spec">
        <div style="position:absolute;inset:0;display:flex;align-items:center;gap:1.5px;padding:5px 7px">${bars}</div>
      </div>
      <div class="sp-prog-wrap">
        <div class="sp-prog" id="spProg-${aveId}"></div>
      </div>
      <div class="sp-controls">
        <button class="sp-btn-play" id="spPlay-${aveId}" onclick="toggleModalAudio('${aveId}')">
          <svg id="spIco-${aveId}" viewBox="0 0 24 24" fill="currentColor" width="17" height="17"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="sp-time">
          <span class="sp-cur" id="spCur-${aveId}">0:00</span>
          <span>/</span>
          <span>${durStr}</span>
        </div>
      </div>
      <p style="font-size:10px;color:rgba(242,237,224,.28);margin-top:8px;line-height:1.5">
        🎼 Frequência · ritmo · timbre · vibrato baseados no canto real da espécie.
      </p>
    </div>`;
}

function toggleModalAudio(aveId) {
  const ico = document.getElementById('spIco-'+aveId);
  const btn = document.getElementById('spPlay-'+aveId);

  if (modalTocId === aveId) {
    if (stopSomModal) { stopSomModal(); stopSomModal=null; }
    setModalPaused(aveId); return;
  }
  if (stopSomModal) { stopSomModal(); stopSomModal=null; }
  if (modalTocId) setModalPaused(modalTocId);
  if (animModalF) { cancelAnimationFrame(animModalF); animModalF=null; }
  if (stopSomAtual) { stopSomAtual(); stopSomAtual=null; }
  if (somTocandoId) setCardPaused(somTocandoId); somTocandoId=null;

  modalTocId = aveId;
  if (ico) ico.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  btn?.classList.add('tocando');

  const dur = durPerfil(aveId);
  const t0 = performance.now();
  const prog = document.getElementById('spProg-'+aveId);
  const cur  = document.getElementById('spCur-'+aveId);

  function anim(now) {
    if (modalTocId !== aveId) return;
    const pct = Math.min(100, ((now-t0)/dur)*100);
    if (prog) prog.style.width = pct+'%';
    if (cur)  cur.textContent  = fmtTS((now-t0)/1000);
    animModalF = requestAnimationFrame(anim);
  }
  animModalF = requestAnimationFrame(anim);
  animarModalBars(aveId, t0);

  const a = AVES.find(x=>x.id===aveId);
  alertarSurdo(aveId, {
    titulo: `🎵 ${a.n}`,
    sub:    `Canto real · ${a.bio}`,
    duracao: 5000,
  });
  if(['vu','cr','ew'].includes(a.st)) setTimeout(()=>notificarAmeaca(a),2200);

  if (SONS_B64[aveId]) {
    const _am = new Audio(SONS_B64[aveId]);
    _am.ontimeupdate = () => {
      if (!_am.duration) return;
      const pct = (_am.currentTime/_am.duration)*100;
      const pg = document.getElementById('spProg-'+aveId);
      const cr = document.getElementById('spCur-'+aveId);
      if (pg) pg.style.width = pct+'%';
      if (cr) cr.textContent = fmtTS(_am.currentTime);
    };
    _am.onended = () => { setModalPaused(aveId); modalTocId=null; };
    _am.play().catch(()=>{ stopSomModal = tocarSom(aveId,()=>{ setModalPaused(aveId); modalTocId=null; stopSomModal=null; }); });
    stopSomModal = () => { _am.pause(); _am.currentTime=0; };
  } else {
    stopSomModal = tocarSom(aveId, ()=>{ setModalPaused(aveId); modalTocId=null; stopSomModal=null; });
  }
}

function setModalPaused(aveId) {
  const ico=document.getElementById('spIco-'+aveId);
  if(ico) ico.innerHTML='<path d="M8 5v14l11-7z"/>';
  document.getElementById('spPlay-'+aveId)?.classList.remove('tocando');
  if(animModalF){cancelAnimationFrame(animModalF);animModalF=null;}
  const hs=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19,22,8,12,16,20,14,10,18,6,13,17,9,11,15,19,8,12,20,14,6,16,10,18,13,7];
  for(let i=0;i<40;i++){const b=document.getElementById(`svb-${aveId}-${i}`);if(b){b.style.height=hs[i]+'px';b.classList.remove('ativo');}}
}

function animarModalBars(aveId, t0) {
  const hs=[6,10,16,20,14,9,12,18,8,13,17,11,7,15,19,22,8,12,16,20,14,10,18,6,13,17,9,11,15,19,8,12,20,14,6,16,10,18,13,7];
  function fr(now) {
    if(modalTocId!==aveId) return;
    const t=(now-t0)/1000;
    for(let i=0;i<40;i++){const b=document.getElementById(`svb-${aveId}-${i}`);if(b){b.style.height=(hs[i]*(0.3+0.7*Math.abs(Math.sin(t*4.5+i*0.32))))+'px';b.classList.add('ativo');}}
    animModalF=requestAnimationFrame(fr);
  }
  animModalF=requestAnimationFrame(fr);
}

function fmtTS(s){if(!s||isNaN(s))return'0:00';return`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;}


