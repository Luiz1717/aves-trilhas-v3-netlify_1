/* ════════════════════════════════════════
   QUIZ ENGINE
════════════════════════════════════════ */
let CT=null,CQ=0,SC=0,ANS=false,T0=0;

function iniciarQuiz(i) {
  CT=TRILHAS[i]; CQ=0; SC=0; ANS=false; T0=Date.now();
  document.getElementById('qtn').textContent = CT.n;
  showView('qv'); bnavShow(false); window.scrollTo(0,0);
  renderQ();
}

function renderQ() {
  const q=CT.quiz[CQ], tot=CT.quiz.length;
  ANS=false;
  document.getElementById('qlbl').textContent=`Questão ${CQ+1} de ${tot}`;
  document.getElementById('qpts').textContent=`${SC} ponto${SC!==1?'s':''}`;
  document.getElementById('qfill').style.width=`${(CQ/tot)*100}%`;
  const L=['A','B','C','D'];
  document.getElementById('qbody').innerHTML=`
    <div class="qcard">
      <p class="qnum">Questão ${CQ+1} / ${tot}</p>
      <div class="qimg"><img src="${q.img}" alt="${q.cap}"></div>
      <p class="qcap">${q.cap}</p>
      <p class="qtxt">${q.q}</p>
      <div class="qopts">${q.ops.map((o,i)=>`<button class="qopt" onclick="responder(${i})"><span class="qltr">${L[i]}</span>${o}</button>`).join('')}</div>
      <div class="qfb" id="qfb"></div>
    </div>
    <button class="qnext" id="qnxt" onclick="proxQ()">${CQ+1<tot?'Próxima questão →':'Ver resultado 🏆'}</button>`;
}

function responder(idx) {
  if (ANS) return; ANS=true;
  const q=CT.quiz[CQ];
  document.querySelectorAll('.qopt').forEach(o=>o.style.pointerEvents='none');
  const opts=document.querySelectorAll('.qopt');
  const fb=document.getElementById('qfb');
  const L=['A','B','C','D'];
  if (idx===q.c) {
    opts[idx].classList.add('cor'); opts[idx].querySelector('.qltr').textContent='✓'; SC++;
    fb.className='qfb show ok'; fb.innerHTML=`✅ <strong>Correto!</strong> ${q.exp}`;
    vibrarOk();
  } else {
    opts[idx].classList.add('wrg'); opts[q.c].classList.add('rcor');
    opts[idx].querySelector('.qltr').textContent='✗'; opts[q.c].querySelector('.qltr').textContent='✓';
    fb.className='qfb show bad'; fb.innerHTML=`❌ <strong>Quase!</strong> ${q.exp}`;
    vibrarErr();
  }
  document.getElementById('qpts').textContent=`${SC} ponto${SC!==1?'s':''}`;
  document.getElementById('qnxt').classList.add('show');
}

function proxQ() {
  CQ++;
  if (CQ<CT.quiz.length) { renderQ(); window.scrollTo(0,0); }
  else resultado();
}

function resultado() {
  const tot=CT.quiz.length, pct=Math.round(SC/tot*100);
  const ts=Math.round((Date.now()-T0)/1000), m=Math.floor(ts/60), s=ts%60;
  let em,tt,sub;
  if(pct===100){em='🏆';tt='Perfeito!';sub='Você domina o ecossistema desta trilha!';}
  else if(pct>=80){em='🌿';tt='Muito bem!';sub='Ótimo conhecimento. Continue explorando!';}
  else if(pct>=60){em='🦜';tt='Bom resultado!';sub='Mais visitas e você será expert!';}
  else{em='🌱';tt='Continue aprendendo!';sub='Releia as explicações e tente de novo!';}
  notificarResultadoQuiz(pct);
  document.getElementById('qfill').style.width='100%';
  document.getElementById('qbody').innerHTML=`
    <div class="rw show">
      <div class="rring" style="background:conic-gradient(#82C060 ${pct*3.6}deg,rgba(242,237,224,.1) 0)">
        <div class="rinner"><span class="rscore">${SC}<span>/${tot}</span></span></div>
      </div>
      <div style="font-size:50px;margin-bottom:8px">${em}</div>
      <p style="font-family:'Lora',serif;font-size:25px;color:var(--cr);margin-bottom:9px">${tt}</p>
      <p style="font-size:13.5px;color:rgba(242,237,224,.58);line-height:1.66;max-width:285px;margin-bottom:26px">${sub}</p>
      <div style="width:100%;background:rgba(242,237,224,.07);border-radius:17px;padding:16px 18px;margin-bottom:20px;text-align:left">
        <div style="display:flex;justify-content:space-between;padding:7px 0"><span style="font-size:13px;color:rgba(242,237,224,.58)">Trilha</span><span style="font-size:13px;color:var(--cr);font-weight:600">${CT.n}</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid rgba(242,237,224,.07)"><span style="font-size:13px;color:rgba(242,237,224,.58)">Acertos</span><span style="font-size:13px;color:var(--cr);font-weight:600">${SC}/${tot} (${pct}%)</span></div>
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid rgba(242,237,224,.07)"><span style="font-size:13px;color:rgba(242,237,224,.58)">Tempo</span><span style="font-size:13px;color:var(--cr);font-weight:600">${m>0?m+'min ':''}${s}s</span></div>
      </div>
      <button class="btn btn-a" style="margin-bottom:10px" onclick="iniciarQuiz(${TRILHAS.findIndex(t=>t.id===CT.id)})">🔄 Refazer Quiz</button>
      <button class="btn btn-o" onclick="voltarHome()">← Voltar às Trilhas</button>
    </div>`;
  window.scrollTo(0,0);
}

