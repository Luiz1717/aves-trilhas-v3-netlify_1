/* ════════════════════════════════════════
   UTILITÁRIOS DE DISPOSITIVO
════════════════════════════════════════ */
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/* ════════════════════════════════════════
   NAVEGAÇÃO
════════════════════════════════════════ */
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));document.getElementById(id).classList.add('on');}
function bnavShow(s){document.getElementById('bnav').style.display=s?'flex':'none';}
function voltarHome(){showView('hv');bnavShow(true);document.querySelectorAll('.bb').forEach(b=>b.classList.remove('on'));document.querySelector('.bb[data-s="trilhas"]')?.classList.add('on');setTimeout(()=>irPara('trilhas'),100);}
function irPara(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'});}
document.querySelectorAll('.bb[data-s]').forEach(b=>{
  b.addEventListener('click',()=>{document.querySelectorAll('.bb').forEach(x=>x.classList.remove('on'));b.classList.add('on');irPara(b.dataset.s);});
});

/* ════════════════════════════════════════
   SCROLL FADE-IN
════════════════════════════════════════ */
const obs=new IntersectionObserver(en=>en.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');}),{threshold:.07});
function reobs(){document.querySelectorAll('.fi').forEach(el=>obs.observe(el));}


/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
const hapSalvo=localStorage.getItem('haptica');
if(hapSalvo!==null) hapticaAtiva=hapSalvo==='1';

renderAves();
renderTrilhas();
renderReg();
// Carregar fotos do Wikimedia Commons
// fotos reais já embutidas — carregarTodasFotos() desativado
reobs();

// Boas-vindas hápticas
if(supVib()){
  setTimeout(()=>{
    notificar({tipo:'info',emoji:'🦜',titulo:'Bem-vindo ao Aves & Trilhas!',sub:'Toque em qualquer ave para sentir o canto por vibração 📳',vibPadrao:[300,100,300,100,500],duracao:5000,cor:'verde'});
    navigator.vibrate([60,40,60]); // pulso de boas-vindas
  },2500);
}