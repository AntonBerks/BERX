/* ═══════════════════════════════════════════════════════════════
   BERX — runtime. Всё после первой отрисовки, ничего не блокирует.
   ═══════════════════════════════════════════════════════════════ */
const H = document.documentElement, $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const mode = H.dataset.introMode;            // full | short | reduced | off
let   tier = +H.dataset.tier;                // 3 | 2 | 1
const reduced = () => H.dataset.motion === 'reduced';
if (new URLSearchParams(location.search).has('dev')) H.dataset.dev = '1';
$('#yr').textContent = new Date().getFullYear();

/* ─── media manifest ─── */
let MEDIA = {
  trailer:    { src:'assets/media/video/berx-trailer.mp4', webm:'assets/media/video/berx-trailer.webm',
                poster:'assets/media/video/berx-trailer.poster.jpg', posterStatus:'final',
                captions:'assets/media/video/berx-trailer.vtt', status:'placeholder' },
  atmosphere: { src:'assets/media/audio/berx-atmosphere.m4a', status:'placeholder' }
};
fetch('media.manifest.json').then(r=>r.ok?r.json():null).then(j=>{
  if (j && j.media){
    MEDIA = { trailer:{...MEDIA.trailer, ...j.media.trailer}, atmosphere:{...MEDIA.atmosphere, ...j.media.atmosphere} };
  }
}).catch(()=>{});

/* ═══ 1. INTRO ORCHESTRATOR ═══════════════════════════════════ */
const TL = {
  full:    { light:200, symbol:900, word:2000, hold:3150, reveal:4050, done:5250 },
  short:   { light:60,  symbol:200, word:620,  hold:1120, reveal:1480, done:2280 },
  reduced: { light:0,   symbol:100, word:240,  hold:820,  reveal:1180, done:1720 }
}[mode === 'off' ? 'reduced' : mode];

const intro = $('#intro');
let timers = [], finished = mode === 'off';

function setPhase(p){ H.dataset.intro = p; }

function finishIntro(fast){
  if (finished) return; finished = true;
  timers.forEach(clearTimeout); timers = [];
  if (fast) intro.dataset.fast = '1';
  setPhase('reveal');
  try { localStorage.setItem('berx.intro.seen', Date.now()); } catch {}
  setTimeout(()=>{ setPhase('done'); intro.remove(); startAmbient(); },
             fast ? 620 : (reduced() ? 520 : 1250));
  // фокус на первый интерактивный элемент — для клавиатуры и скринридеров
  setTimeout(()=>$('#nav .brand')?.focus({preventScroll:true}), 300);
}

if (!finished){
  // draw-длины штрихов символа (для точной stroke-анимации)
  $$('#intro .mark path').forEach(p=>p.style.setProperty('--len', Math.ceil(p.getTotalLength())+1));
  const at = (t,fn)=>timers.push(setTimeout(fn,t));
  requestAnimationFrame(()=>{                       // старт только после первого кадра
    at(TL.light,  ()=>setPhase('light'));
    at(TL.symbol, ()=>setPhase('symbol'));
    at(TL.word,   ()=>setPhase('word'));
    at(TL.hold,   ()=>setPhase('hold'));
    at(TL.reveal, ()=>finishIntro(false));
    at(600,       ()=>intro.dataset.skip='1');
  });
  timers.push(setTimeout(()=>finishIntro(true), 9000));           // жёсткая страховка
  $('#skip').addEventListener('click', ()=>finishIntro(true));
  addEventListener('keydown', e=>{ if(e.key==='Escape') finishIntro(true); }, {once:false});
  // ушли со вкладки во время интро — не тратим кадры, доигрываем при возврате
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) finishIntro(true); });
} else { setPhase('done'); intro.remove(); }

/* ═══ 1b. THE BERX WORLD ═══════════════════════════════════════
   The site stands in the same room the app does.

   berx-5d.runtime.js is generated from the same TypeScript the React
   Native client runs — one resolver, two platforms — and until now
   the site shipped it and loaded nothing. The hero now mounts a real
   v9 scene from the archive's own BERX-001 contract, so its
   environment, materials, lighting, parallax and tilt are BERX's
   rather than a second implementation that happens to look similar.

   It is additive and it fails quietly: a browser that cannot load a
   module, or a build without the artefacts, keeps the page exactly as
   it was. The site's own beams and haze stay — they now sit inside a
   resolved room instead of standing in for one.
   ═══════════════════════════════════════════════════════════════ */
let heroScene = null;
let phoneScene = null;
/** Set once the 5D runtime is up; null without it, and the page is unchanged. */
let mountPhoneScene = null;
const phoneScreen = $('.phone .screen');
(async () => {
  const host = $('#heroScene');
  if (!host) return;
  try {
    const [{mountBerxScene}, {BERX_SITE_CONTRACTS}] = await Promise.all([
      import('./berx-5d.runtime.js'),
      import('./berx-5d.scenes.js'),
    ]);
    const contract = BERX_SITE_CONTRACTS['BERX-001'];
    if (!contract) return;
    heroScene = mountBerxScene(host, contract, {
      /* the page's own tier watchdog already measures frames; the
         scene's sampler would fight it for the same budget */
      sampleFrames: false,
    });
    H.dataset.berx5d = heroScene.scene.budget.tier;

    /* Page chrome that belongs to no section — the modal's scrim, and
       anything else that has to fall toward the room rather than
       toward black — reads the resolved substrate and accent from the
       document. Custom properties inherit downward only, so a scene
       mounted on the hero cannot be read by a fixed element that is a
       sibling of it. */
    for (const prop of ['--berx-bg', '--berx-accent']) {
      const v = getComputedStyle($('#heroScene')).getPropertyValue(prop);
      if (v) H.style.setProperty(prop, v.trim());
    }

    /* Each feature section stands in its own family's room: the
       conversation lit as a corridor, the map with a ground plane and
       a horizon, the events sky read from the real clock. Same
       resolver, same eleven environments the app uses.

       These are painted, not driven: a card does not need parallax or
       tilt, and six scenes each binding scroll and pointer listeners
       would be cost for movement nobody would notice. */
    for (const card of $$('[data-berx-screen]')) {
      if (card === phoneScreen) continue;   /* mounted below, and re-mounted as it rotates */
      const c = BERX_SITE_CONTRACTS[card.dataset.berxScreen];
      if (!c || !$('.sec-scene', card)) continue;
      /* The card itself is the scene root, not the layer wrapper inside
         it. Custom properties inherit downward only, so mounting on an
         inner element left the card unable to read its own scene's
         material — it kept a hand-written border while the room behind
         it was resolved. Now the card takes D2, the demo panel inside
         it takes D3, and the two layers in .sec-scene paint D0 and D1. */
      mountBerxScene(card, c, {sampleFrames: false, interactive: false});
    }
    /* The phone's own screen. It rotates between three BERX screens,
       and each one gets the room its family actually has — so the
       device shows the messages corridor, then the map's ground
       plane, then the feed, rather than three layouts on one flat
       black. Re-resolved on each turn: nothing is bound to the
       pointer or the scroll here, so a turn costs one resolve and a
       write of custom properties. */
    if (phoneScreen) {
      mountPhoneScene = (id) => {
        const pc = BERX_SITE_CONTRACTS[id];
        if (!pc) return;
        phoneScene?.destroy();
        phoneScene = mountBerxScene(phoneScreen, pc, {sampleFrames: false, interactive: false});
      };
      mountPhoneScene('BERX-176');
    }
  } catch {
    /* no 5D runtime available — the page is unchanged, not broken */
  }
})();

/* ═══ 2. PARTICLE DUST (tier 3 only) ══════════════════════════ */
function dust(canvas, count, speed){
  /* canvas can legitimately be absent: with ?intro=off the intro block
     is removed before this runs, and reading getContext on null threw
     an uncaught TypeError on every such load. */
  if (!canvas || tier < 3 || reduced()) return ()=>{};
  const ctx = canvas.getContext('2d', {alpha:true}); if(!ctx) return ()=>{};
  const DPR = Math.min(devicePixelRatio||1, 1.75);
  let w, h, ps = [], raf = 0, on = true;
  const size = ()=>{ const r=canvas.getBoundingClientRect();
    w=canvas.width=Math.max(1,r.width*DPR); h=canvas.height=Math.max(1,r.height*DPR); };
  const seed = ()=>{ ps = Array.from({length:count},()=>({
    x:Math.random()*w, y:Math.random()*h, r:(Math.random()*1.5+.3)*DPR,
    vx:(Math.random()-.5)*speed*DPR, vy:(-Math.random()*speed-.05)*DPR,
    a:Math.random()*.5+.08, t:Math.random()*Math.PI*2 })); };
  const tick = ()=>{ if(!on) return;
    ctx.clearRect(0,0,w,h);
    for(const p of ps){
      p.x+=p.vx; p.y+=p.vy; p.t+=.012;
      if(p.y<-10){p.y=h+10;p.x=Math.random()*w}
      if(p.x<-10)p.x=w+10; if(p.x>w+10)p.x=-10;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283);
      ctx.fillStyle=`rgba(160,215,255,${p.a*(.55+.45*Math.sin(p.t))})`; ctx.fill();
    }
    raf = requestAnimationFrame(tick); };
  size(); seed(); tick();
  addEventListener('resize', ()=>{size();seed();}, {passive:true});
  return ()=>{ on=false; cancelAnimationFrame(raf); ctx.clearRect(0,0,w,h); };
}
const stopIntroDust = dust($('#introDust'), 42, .16);
let stopHeroDust = null;
function startAmbient(){ stopIntroDust(); if(!stopHeroDust) stopHeroDust = dust($('#heroDust'), 34, .12); }
if (mode === 'off') startAmbient();

/* ═══ 3. FPS WATCHDOG → мягкая деградация ════════════════════ */
(function watchdog(){
  if (reduced()) return;
  let f=0, t0=performance.now(), bad=0;
  const loop=()=>{ f++; const now=performance.now();
    if(now-t0>1000){ const fps=f*1000/(now-t0); f=0; t0=now;
      if(fps<42){ if(++bad>=2 && tier>1){ tier--; H.dataset.tier=tier;
        if(tier<3){ stopIntroDust(); stopHeroDust?.(); stopHeroDust=null; } bad=0; } }
      else bad=0;
      if(tier>1) requestAnimationFrame(loop); return; }
    requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();

/* ═══ 4. MOTION / SOUND CONTROLS ══════════════════════════════ */
const mBtn = $('#motion');
const syncMotion = ()=>{ const off = reduced();
  mBtn.setAttribute('aria-pressed', String(off));
  mBtn.setAttribute('aria-label', off ? 'Анимации: выключены' : 'Анимации: включены'); };
syncMotion();
mBtn.addEventListener('click', ()=>{
  const off = !reduced();
  H.dataset.motion = off ? 'reduced' : 'full';
  try{ localStorage.setItem('berx.motion', off ? 'off' : 'on'); }catch{}
  if(off){ stopIntroDust(); stopHeroDust?.(); stopHeroDust=null; } else if(tier===3) startAmbient();
  syncMotion(); toast(off ? 'Анимации выключены' : 'Анимации включены');
});

/* Аудио: только после жеста, с плавным ramp, никогда не autoplay */
const sBtn = $('#sound'); let audio = null;
sBtn.addEventListener('click', async ()=>{
  if (MEDIA.atmosphere.status !== 'final'){
    toast('Атмосферный саундтрек подключится после загрузки финального трека'); return; }
  if (!audio){
    audio = new Audio(MEDIA.atmosphere.src);
    audio.loop = true; audio.preload='none'; audio.volume = 0;
  }
  const on = sBtn.getAttribute('aria-pressed') === 'true';
  if (on){ ramp(audio, 0, 600, ()=>audio.pause()); }
  else { try{ await audio.play(); ramp(audio, .34, 1400); }catch{ toast('Браузер заблокировал воспроизведение'); return; } }
  sBtn.setAttribute('aria-pressed', String(!on));
  sBtn.setAttribute('aria-label', !on ? 'Атмосферный звук: включён' : 'Атмосферный звук: выключен');
  try{ localStorage.setItem('berx.sound', !on ? '1':'0'); }catch{}
});
function ramp(el, to, ms, done){ const from=el.volume, t0=performance.now();
  const s=()=>{ const k=Math.min(1,(performance.now()-t0)/ms); el.volume=from+(to-from)*k;
    k<1 ? requestAnimationFrame(s) : done?.(); }; s(); }

/* ═══ 5. HERO: parallax, scroll transition, screen rotation ═══ */
const phone = $('#phone'), heroWrap = $('#hero > .wrap');
if (matchMedia('(hover:hover) and (pointer:fine)').matches){
  let px=0, py=0, tx=0, ty=0, raf=0;
  addEventListener('pointermove', e=>{
    if (reduced()) return;
    tx = (e.clientX/innerWidth - .5)*2; ty = (e.clientY/innerHeight - .5)*2;
    if(!raf) raf = requestAnimationFrame(function s(){
      px += (tx-px)*.07; py += (ty-py)*.07;
      phone.style.setProperty('--mx', px.toFixed(3));
      phone.style.setProperty('--my', py.toFixed(3));
      raf = (Math.abs(tx-px)>.001||Math.abs(ty-py)>.001) ? requestAnimationFrame(s) : 0;
    });
  }, {passive:true});
}
/* кинематографичный scroll-переход героя */
let sRaf = 0;
addEventListener('scroll', ()=>{ if(sRaf) return; sRaf = requestAnimationFrame(()=>{
  const p = Math.min(1, scrollY / (innerHeight*.9));
  heroWrap.style.setProperty('--sp', reduced() ? 0 : p.toFixed(3));
  $('.seam').style.setProperty('--sp', p.toFixed(3));
  $('#nav').toggleAttribute('data-stuck', scrollY > 24);
  sRaf = 0; }); }, {passive:true});

/* ротация экранов телефона — продукт показывает себя сам */
const scrs = $$('.scr'), titles = {msg:'Мессенджер', places:'Места', feed:'Лента'};
/* each panel's real v9 contract — the room changes with the screen */
const scrScenes = {msg:'BERX-176', places:'BERX-201', feed:'BERX-031'};
let si = 0;
setInterval(()=>{
  if (reduced() || document.hidden) return;
  scrs[si].removeAttribute('data-on'); si = (si+1) % scrs.length;
  scrs[si].setAttribute('data-on','');
  const kind = scrs[si].dataset.screen;
  $('#phTitle').textContent = titles[kind];
  mountPhoneScene?.(scrScenes[kind]);
}, 6200);

/* ═══ 6. FEED CONTENT (генерируется, без стоковых картинок) ═══ */
const POSTS = [
  ['Мария','открыла новое место у воды'],['Ночной бег','маршрут на пятницу'],
  ['Данил','5 фото · крыша на Красном'],['Кофейня 8/12','−20% для BERX'],
  ['Сообщество Sound','плейлист недели'],['Алина','ищет компанию на выставку']
];
const feedHTML = ()=> POSTS.map(([n,t])=>`<li><div class="r"><span class="av"></span>${n} · ${t}</div>
  <div class="thumb"></div><div class="ln m"></div><div class="ln s"></div></li>`).join('');
$('#demoFeed').innerHTML = feedHTML()+feedHTML();     // дубль для бесшовной прокрутки
$('#phFeed').innerHTML  = feedHTML()+feedHTML();

/* ═══ 7. LIVE DEMOS: анимации только во вьюпорте ══════════════ */
const io = new IntersectionObserver(es=>es.forEach(e=>{
  e.target.toggleAttribute('data-live', e.isIntersecting);
  if (e.isIntersecting) $$('[data-count]', e.target).forEach(countUp);
}), {rootMargin:'120px', threshold:.18});
$$('.demo').forEach(d=>io.observe(d));

function countUp(el){
  if (el.dataset.done) return; el.dataset.done='1';
  const end = +el.dataset.count, sfx = el.dataset.suffix||'';
  if (reduced()){ el.textContent = end.toLocaleString('ru-RU')+sfx; return; }
  const t0=performance.now(), dur=1500;
  const s=()=>{ const k=Math.min(1,(performance.now()-t0)/dur), e=1-Math.pow(1-k,3);
    el.textContent = Math.round(end*e).toLocaleString('ru-RU')+sfx; if(k<1) requestAnimationFrame(s); };
  requestAnimationFrame(s);
}
/* обратный отсчёт — 1 таймер на страницу, только когда видно */
const cds = $$('[data-cd]');
let cdSec = 2*3600 + 11*60 + 40;
setInterval(()=>{ if(document.hidden) return;
  cdSec = cdSec>0 ? cdSec-1 : 7940;
  const h=String(Math.floor(cdSec/3600)).padStart(2,'0'),
        m=String(Math.floor(cdSec%3600/60)).padStart(2,'0'),
        s=String(cdSec%60).padStart(2,'0');
  cds.forEach(el=> el.textContent = el.dataset.cd.length>5 ? `${h}:${m}:${s}` : `${m}:${s}`);
}, 1000);

/* ═══ 8. UI: sheet, modal (трейлер), toast ════════════════════ */
const sheet=$('#sheet'), burger=$('#burger');
sheet.hidden=false;
const setSheet=o=>{ sheet.toggleAttribute('data-open',o); burger.setAttribute('aria-expanded',String(o));
  document.body.style.overflow = o?'hidden':''; if(o) $('#sheet nav a').focus(); };
burger.addEventListener('click',()=>setSheet(!sheet.hasAttribute('data-open')));
$$('[data-close-sheet],#sheet nav a').forEach(b=>b.addEventListener('click',()=>setSheet(false)));

const modal=$('#modal'); modal.hidden=false; let lastFocus=null;
function openTrailer(){
  lastFocus = document.activeElement;
  const t = MEDIA.trailer;
  const posterReady = t.posterStatus === 'final' && t.poster;
  $('#mBody').innerHTML = t.status === 'final'
    ? `<video controls playsinline preload="metadata" poster="${t.poster}" style="width:100%;border-radius:14px">
         <source src="${t.webm}" type="video/webm"><source src="${t.src}" type="video/mp4">
         <track kind="captions" src="${t.captions}" srclang="ru" label="Русские субтитры" default>
       </video>`
    : `${posterReady ? `<img src="${t.poster}" alt="BERX — кадр трейлера" style="width:100%;border-radius:14px;display:block;margin-bottom:14px">` : ''}
       <p><strong>Трейлер BERX ещё не поставлен в сборку.</strong><br>
        Интеграционная точка готова: плеер, poster, WebM/MP4 и русские субтитры подключатся автоматически,
        как только ассет получит статус <code>final</code> в <code>media.manifest.json</code>.</p>
       <p class="assetnote">⚠ Временный dev-плейсхолдер. Стоковое видео сознательно не используется —
        ассет ожидается: <code>${t.src}</code></p>`;
  modal.setAttribute('data-open',''); document.body.style.overflow='hidden';
  $('[data-close-modal]').focus();
}
function closeModal(){ modal.removeAttribute('data-open'); document.body.style.overflow='';
  $('#mBody').innerHTML=''; lastFocus?.focus(); }
$('#playTrailer').addEventListener('click',openTrailer);
$('#playTrailer2').addEventListener('click',openTrailer);
$('[data-close-modal]').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(modal.hasAttribute('data-open')) closeModal();
  if(sheet.hasAttribute('data-open')) setSheet(false); } });

let tT; function toast(msg){ const t=$('#toast'); t.textContent=msg; t.setAttribute('data-on','');
  clearTimeout(tT); tT=setTimeout(()=>t.removeAttribute('data-on'),3200); }

/* ═══ 9. Плавный переход по анкорам с учётом reduced-motion ═══ */
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el = document.getElementById(a.getAttribute('href').slice(1)); if(!el) return;
  e.preventDefault();
  el.scrollIntoView({behavior: reduced() ? 'auto':'smooth', block:'start'});
}));
