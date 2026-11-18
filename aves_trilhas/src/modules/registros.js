/* ════════════════════════════════════════
   REGISTROS
════════════════════════════════════════ */
function renderReg() {
  const lista=JSON.parse(localStorage.getItem('aves_reg')||'[]');
  const el=document.getElementById('regList');
  if (!lista.length) {
    el.innerHTML='<div class="reg-empty">📷 Sem registros ainda.<br>Use a câmera IA para identificar aves!</div>';
    return;
  }
  el.innerHTML=lista.map(r=>`
    <div class="reg-item">
      <div class="reg-photo">${r.foto?`<img src="${r.foto}" alt="${r.nome}">`:
        `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px">${r.emoji||'🦜'}</div>`}</div>
      <div style="flex:1;min-width:0">
        <p class="reg-name">${r.nome}</p>
        <div class="reg-meta"><span>📅 ${r.data} ${r.hora}</span><span>🤖 ${r.conf}</span></div>
        <p style="font-size:10.5px;color:rgba(24,40,26,.4);font-style:italic;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.sci}</p>
      </div>
      <button onclick="removerReg(${r.id})" style="background:none;border:none;cursor:pointer;color:rgba(24,40,26,.3);font-size:18px;padding:4px;flex-shrink:0">🗑️</button>
    </div>`).join('');
}

function removerReg(id) {
  const lista=JSON.parse(localStorage.getItem('aves_reg')||'[]').filter(r=>r.id!==id);
  localStorage.setItem('aves_reg',JSON.stringify(lista)); renderReg();
}

