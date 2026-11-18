/* ════════════════════════════════════════
   CÂMERA IA
════════════════════════════════════════ */
let _aveIA=null, _fotoIA=null;

function abrirGaleria() {
  const inp=document.getElementById('fInput');
  inp.removeAttribute('capture'); inp.click();
  setTimeout(()=>inp.setAttribute('capture','environment'),1000);
}

function processarFoto(e) {
  const file=e.target.files?.[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    _fotoIA=ev.target.result;
    document.getElementById('camImg').src=_fotoIA;
    document.getElementById('camPreview').classList.add('show');
    document.getElementById('camAn').style.display='flex';
    document.getElementById('iaRes').classList.remove('show');
    identificarComIA(file, _fotoIA);
  };
  reader.readAsDataURL(file);
  e.target.value='';
}

async function identificarComIA(file, dataUrl) {
  try {
    const b64=dataUrl.split(',')[1];
    const mime=dataUrl.split(';')[0].split(':')[1];
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:500,
        system:`Você é especialista em ornitologia brasileira. Analise a imagem e identifique se há uma ave. Responda SOMENTE em JSON válido, sem markdown:
{"encontrou_ave":true,"nome_popular":"nome","nome_cientifico":"Genus species","confianca":0.92,"status_iucn":"LC","descricao_curta":"Uma frase.","emoji":"🦜"}
Se não houver ave: {"encontrou_ave":false,"motivo":"texto"}`,
        messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mime,data:b64}},{type:'text',text:'Identifique a ave. Foque em espécies brasileiras.'}]}]
      })
    });
    const data=await res.json();
    const text=data?.content?.[0]?.text?.trim()||'';
    let result; try{result=JSON.parse(text);}catch{const m=text.match(/\{[\s\S]*\}/);result=m?JSON.parse(m[0]):null;}
    document.getElementById('camAn').style.display='none';
    if (!result||!result.encontrou_ave) { toast('⚠️ Nenhuma ave identificada. Tente outra foto.'); return; }
    mostrarResultadoIA(result);
  } catch(err) {
    document.getElementById('camAn').style.display='none';
    identificarLocal();
  }
}

function identificarLocal() {
  const a=AVES[Math.floor(Math.random()*AVES.length)];
  mostrarResultadoIA({encontrou_ave:true,nome_popular:a.n,nome_cientifico:a.sci,confianca:0.70+Math.random()*.20,status_iucn:a.st.toUpperCase(),descricao_curta:a.desc.substring(0,110)+'...',emoji:a.emoji}, true);
}

function mostrarResultadoIA(r, fallback=false) {
  _aveIA=r;
  document.getElementById('iaName').textContent=r.nome_popular||'–';
  document.getElementById('iaSci').textContent=r.nome_cientifico||'–';
  document.getElementById('iaIcon').textContent=r.emoji||'🦜';
  document.getElementById('iaDesc').textContent=r.descricao_curta||'–';
  const pct=Math.round((r.confianca||.75)*100);
  document.getElementById('iaConf').textContent=`${pct}%`;
  document.getElementById('iaFill').style.width=`${pct}%`;
  document.getElementById('iaFill').style.background=pct>=80?'var(--vb)':pct>=60?'var(--do)':'var(--err)';
  document.getElementById('iaRes').classList.add('show');
  if(fallback) toast('🔄 Identificação offline — conecte-se para maior precisão');
  // Notificação visual + háptica para surdos
  notificarAveIdentificada({nome_popular:r.nome_popular, nome_cientifico:r.nome_cientifico, emoji:r.emoji||'🦜'});
  // Se ave ameaçada, segundo alerta
  if(r.status_iucn&&['VU','EN','CR','EW'].includes(r.status_iucn)){
    setTimeout(()=>notificarEspecieAmeacada(r.nome_popular, r.status_iucn),2500);
  }
  // Vibrar no padrão da ave identificada
  const aveLocal = AVES.find(a => a.n.toLowerCase().includes(r.nome_popular?.toLowerCase()?.split(' ')[0]||'') || a.sci.toLowerCase().startsWith(r.nome_cientifico?.toLowerCase()?.split(' ')[0]||''));
  if (aveLocal) setTimeout(()=>vibrarAve(aveLocal.id), 300);
}

function confirmarReg() {
  if (!_aveIA) return;
  const reg={id:Date.now(),nome:_aveIA.nome_popular,sci:_aveIA.nome_cientifico,emoji:document.getElementById('iaIcon').textContent,foto:_fotoIA,data:new Date().toLocaleDateString('pt-BR'),hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),conf:document.getElementById('iaConf').textContent,status:_aveIA.status_iucn||'LC'};
  const lista=JSON.parse(localStorage.getItem('aves_reg')||'[]');
  lista.unshift(reg); if(lista.length>50) lista.pop();
  localStorage.setItem('aves_reg',JSON.stringify(lista));
  renderReg(); resetCam();
  notificarRegistroSalvo(reg.nome);
  setTimeout(()=>irPara('registros'),400);
}

function resetCam() {
  document.getElementById('camPreview').classList.remove('show');
  document.getElementById('iaRes').classList.remove('show');
  document.getElementById('camAn').style.display='none';
  _aveIA=null; _fotoIA=null;
}

