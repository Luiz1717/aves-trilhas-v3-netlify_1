/* ════════════════════════════════════════
   MAPA GPS + OVERPASS
════════════════════════════════════════ */
let MAP=null,ME_MK=null,ME_CI=null,GPS_W=null,T_LYS=[],OSM_T=[],LOADING=false;

function abrirMapa() {
  showView('mv'); bnavShow(false);
  document.querySelectorAll('.bb').forEach(b=>b.classList.remove('on'));
  document.getElementById('btnMapa').classList.add('on');
  requestAnimationFrame(()=>requestAnimationFrame(()=>initMapa()));
}

function initMapa() {
  if (MAP) { MAP.invalidateSize(true); return; }
  MAP=L.map('lmap',{center:[-15.79,-47.88],zoom:5,zoomControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(MAP);
  MAP.invalidateSize(true);
  setSt('loading','Buscando GPS...');
  pedirGPS();
}

function pedirGPS() {
  if (!navigator.geolocation) { setSt('err','GPS indisponível — busque uma cidade'); buscarTrilhas(-15.79,-47.88); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude:la,longitude:lo,accuracy:ac}=pos.coords;
    MAP.setView([la,lo],13); MAP.invalidateSize(true);
    addMe(la,lo,ac); setSt('loading','📍 Localizado! Buscando trilhas...');
    buscarTrilhas(la,lo);
    if(GPS_W) navigator.geolocation.clearWatch(GPS_W);
    GPS_W=navigator.geolocation.watchPosition(p=>addMe(p.coords.latitude,p.coords.longitude,p.coords.accuracy),()=>{},{enableHighAccuracy:true,maximumAge:10000});
  },err=>{
    const m={1:'GPS negado',2:'Sinal fraco',3:'Timeout'};
    setSt('err',(m[err.code]||'GPS falhou')+' — busque uma cidade');
    MAP.setView([-15.79,-47.88],5); MAP.invalidateSize(true);
  },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
}

function addMe(la,lo,ac) {
  const ll=[la,lo];
  if (!ME_MK) {
    ME_MK=L.marker(ll,{icon:L.divIcon({html:'<div style="width:20px;height:20px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(41,121,255,.22)"></div>',iconSize:[20,20],iconAnchor:[10,10],className:''}),zIndexOffset:1000}).addTo(MAP).bindPopup('<b>📍 Você está aqui</b>');
    ME_CI=L.circle(ll,{radius:ac||30,color:'#2979FF',fillColor:'#2979FF',fillOpacity:.08,weight:1.5}).addTo(MAP);
  } else { ME_MK.setLatLng(ll); ME_CI.setLatLng(ll).setRadius(ac||30); }
}

async function buscarTrilhas(la,lo,r=15000) {
  if (LOADING) return; LOADING=true;
  setSt('loading',`Buscando em ${r/1000}km...`);
  T_LYS.forEach(l=>{try{MAP.removeLayer(l);}catch{}}); T_LYS=[]; OSM_T=[];
  const q=`[out:json][timeout:25];(way["highway"="path"]["foot"!="no"](around:${r},${la},${lo});way["highway"="footway"]["access"!="private"](around:${r},${la},${lo});way["highway"="track"]["foot"!="no"](around:${r},${la},${lo});relation["route"="hiking"](around:${r},${la},${lo});way["route"="hiking"](around:${r},${la},${lo}););out geom;`;
  try {
    const res=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
    if (!res.ok) throw new Error(res.status);
    const {elements}=await res.json();
    mostrarTrilhasOSM(elements,la,lo);
  } catch(e) {
    setSt('err','Erro ao buscar trilhas.');
    document.getElementById('tresults').innerHTML='<div class="tri-empty">❌ Erro. Toque "Buscar Aqui".</div>';
  } finally { LOADING=false; }
}

function mostrarTrilhasOSM(els,uLa,uLo) {
  const ways=els.filter(e=>e.type==='way'&&e.geometry?.length>1);
  if (!ways.length) { setSt('ok','Nenhuma trilha aqui.'); document.getElementById('tresults').innerHTML='<div class="tri-empty">🌱 Sem trilhas aqui.<br>Tente: Chapada Diamantina, Serra dos Órgãos</div>'; return; }
  const lista=[];
  ways.forEach(w=>{
    const cs=w.geometry.map(n=>[n.lat,n.lon]);
    const tags=w.tags||{};
    const nome=tags.name||tags['name:pt']||`Caminho #${w.id}`;
    let cor='#2E7D32',esp=3;
    if(tags.route==='hiking'||tags.sac_scale){cor='#1565C0';esp=4;}
    if(tags.highway==='track'){cor='#F57F17';}
    const ln=L.polyline(cs,{color:cor,weight:esp,opacity:.82,lineJoin:'round',lineCap:'round'}).addTo(MAP);
    ln.bindPopup(`<b>${nome}</b><br><span style="font-size:11px;color:#555">${tags.highway||'trilha'}</span>`);
    T_LYS.push(ln);
    const mid=Math.floor(cs.length/2);
    lista.push({nome,cor,ln,dist:calcD(cs),d2me:hav(uLa,uLo,cs[mid][0],cs[mid][1])});
  });
  lista.sort((a,b)=>a.d2me-b.d2me);
  OSM_T=lista.slice(0,25);
  setSt('ok','Trilhas encontradas!',`✅ ${lista.length}`);
  document.getElementById('tresults').innerHTML=OSM_T.map((t,i)=>`
    <div class="tri" id="ti-${i}" onclick="focarTrilha(${i})">
      <p class="tri-n">${t.nome}</p>
      <div class="tri-m"><span style="color:${t.cor}">⬤</span><span>~${t.dist}</span><span>${t.d2me<1?Math.round(t.d2me*1000)+'m':t.d2me.toFixed(1)+'km'} de você</span></div>
    </div>`).join('');
  if (T_LYS.length) try{MAP.fitBounds(L.featureGroup(T_LYS).getBounds(),{padding:[25,25]});}catch{}
}

function focarTrilha(i) {
  document.querySelectorAll('.tri').forEach(e=>e.classList.remove('sel'));
  document.getElementById(`ti-${i}`)?.classList.add('sel');
  const t=OSM_T[i];
  if (t?.ln) { t.ln.setStyle({weight:7,opacity:1}); try{MAP.fitBounds(t.ln.getBounds(),{padding:[40,40]});}catch{} t.ln.openPopup(); setTimeout(()=>t.ln.setStyle({weight:4,opacity:.82}),3500); }
}

function irParaMim() { if(ME_MK){MAP.setView(ME_MK.getLatLng(),15);ME_MK.openPopup();}else pedirGPS(); }
function buscarAqui() { const c=MAP.getCenter(); buscarTrilhas(c.lat,c.lng); }
async function buscarCidade() {
  const q=document.getElementById('mapQ').value.trim(); if (!q) return;
  setSt('loading',`Buscando "${q}"...`);
  try {
    const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+', Brasil')}&format=json&limit=1&countrycodes=br`,{headers:{'Accept-Language':'pt-BR'}});
    const data=await res.json();
    if (!data.length){setSt('err',`"${q}" não encontrado`);return;}
    const {lat,lon}=data[0]; MAP.setView([+lat,+lon],12); MAP.invalidateSize(true); buscarTrilhas(+lat,+lon);
  } catch { setSt('err','Erro na busca.'); }
}
document.getElementById('mapQ').addEventListener('keydown',e=>{if(e.key==='Enter')buscarCidade();});
function setSt(tipo,msg,cnt='') {
  document.getElementById('sdot').className='sdot '+(tipo==='loading'?'loading':tipo==='ok'?'ok':'err');
  document.getElementById('smsg').textContent=msg;
  document.getElementById('scnt').textContent=cnt;
}
function fecharMapa() {
  if(GPS_W){navigator.geolocation.clearWatch(GPS_W);GPS_W=null;} voltarHome();
}
function calcD(cs){if(cs.length<2)return'0m';let d=0;for(let i=1;i<cs.length;i++)d+=hav(cs[i-1][0],cs[i-1][1],cs[i][0],cs[i][1]);return d<1?Math.round(d*1000)+'m':d.toFixed(1)+'km';}
function hav(a,b,c,d){const R=6371,dA=(c-a)*Math.PI/180,dB=(d-b)*Math.PI/180;const x=Math.sin(dA/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dB/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}

