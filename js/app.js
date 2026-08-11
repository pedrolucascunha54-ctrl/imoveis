/* ==========================================================================
   LUCTOR — app.js
   Lenis + GSAP/ScrollTrigger orchestration
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

/* ---------- Lenis smooth scroll ---------- */
let lenis;
if (!REDUCED) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   HEADER — solid on scroll, progress bar, mobile nav
   ========================================================================== */
const header = document.getElementById('site-header');
const progressBar = document.getElementById('scroll-progress');
const navToggle = document.getElementById('nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

ScrollTrigger.create({
  start: 80,
  end: 99999,
  onUpdate: (self) => header.classList.toggle('solid', self.scroll() > 80 || self.progress > 0),
});

ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => { progressBar.style.width = (self.progress * 100).toFixed(2) + '%'; },
});
window.addEventListener('scroll', () => header.classList.toggle('solid', window.scrollY > 80), { passive: true });

navToggle.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ==========================================================================
   WHATSAPP — floating CTA + message routing
   ========================================================================== */
const WA_NUMBER = '55XXXXXXXXXXX'; // TODO: substituir pelo número oficial da Luctor
const WA_MESSAGES = {
  studio: 'Olá! Vi os studios da Luctor pelo site e gostaria de consultar a disponibilidade.',
  comercial: 'Olá! Vi os imóveis comerciais da Luctor pelo site e gostaria de consultar as opções disponíveis.',
  visita: () => `Olá! Gostaria de agendar uma visita para ${AGENDA.dayLabel().toLowerCase()}${AGENDA.currentTime ? `, às ${AGENDA.currentTime}` : ''}. Podemos confirmar?`,
};

function openWhatsApp(kind, location) {
  const raw = WA_MESSAGES[kind] || WA_MESSAGES.studio;
  const text = typeof raw === 'function' ? raw() : raw;
  console.log('[cta]', location, '→ whatsapp:', kind);
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

document.querySelectorAll('[data-wa]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    openWhatsApp(el.dataset.wa, el.dataset.ctaLocation || 'unknown');
  });
});

const waFloat = document.getElementById('whatsapp-float');
let waPulsed = false;
ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom center',
  onEnter: () => { waFloat.classList.add('visible'); if (!waPulsed) { waFloat.classList.add('pulse'); waPulsed = true; } },
  onLeaveBack: () => waFloat.classList.remove('visible'),
});

/* ==========================================================================
   10 · HERO — entrance stagger + parallax
   ========================================================================== */
window.addEventListener('load', () => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
  tl.fromTo('#hero-image', { scale: 1.06 }, { scale: 1, duration: 1.8, ease: 'power2.out' }, 0);
  tl.from('.hero-headline .word > span', { yPercent: 110, duration: 0.9, stagger: 0.045, ease: 'power3.out' }, 0.3);
  const items = gsap.utils.toArray('.reveal-item').sort(
    (a, b) => (+a.dataset.revealOrder || 0) - (+b.dataset.revealOrder || 0)
  );
  tl.to(items, { opacity: 1, y: 0, stagger: 0.14 }, 0.25);
});

if (!REDUCED) {
  gsap.to('#hero-image', {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero-content', {
    y: -60, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ==========================================================================
   COREOGRAFIA TIPOGRÁFICA
   Toda seção anima seu texto na ordem: label → título → corpo → CTA,
   com stagger e um tipo de entrada diferente da seção vizinha.
   ========================================================================== */

/* Quebra um heading em palavras dentro de máscaras, preservando <br> e
   spans internos (.accent), para a entrada "palavra sobe do vão". */
function splitWords(el) {
  if (el.dataset.split === 'done') return;
  const wrap = (node) => {
    const out = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        parts.forEach((p) => {
          if (!p.trim()) { out.appendChild(document.createTextNode(p)); return; }
          const mask = document.createElement('span');
          mask.className = 'word';
          const inner = document.createElement('span');
          inner.textContent = p;
          mask.appendChild(inner);
          out.appendChild(mask);
        });
      } else if (child.nodeName === 'BR') {
        out.appendChild(child.cloneNode());
      } else {
        const clone = child.cloneNode(false);
        clone.appendChild(wrap(child));
        out.appendChild(clone);
      }
    });
    return out;
  };
  const frag = wrap(el);
  el.innerHTML = '';
  el.appendChild(frag);
  el.dataset.split = 'done';
}

/* Estados iniciais de cada tipo de entrada */
const TEXT_ANIMS = {
  'fade-up':      { from: { y: 44, opacity: 0 }, to: { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' } },
  'stagger-up':   { from: { y: 62, opacity: 0 }, to: { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' } },
  'slide-in-left':  { from: { x: -70, opacity: 0 }, to: { x: 0, opacity: 1, duration: 0.95, ease: 'power3.out' } },
  'slide-in-right': { from: { x: 70, opacity: 0 },  to: { x: 0, opacity: 1, duration: 0.95, ease: 'power3.out' } },
  'scale-soft':   { from: { scale: 0.9, opacity: 0 }, to: { scale: 1, opacity: 1, duration: 1, ease: 'power2.out' } },
  'rotate-soft':  { from: { y: 40, rotation: 2.5, opacity: 0 }, to: { y: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'power3.out' } },
  'clip-wipe':    { from: { clipPath: 'inset(100% 0 0 0)', opacity: 0 }, to: { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1.05, ease: 'power4.inOut' } },
  'blur-focus':   { from: { filter: 'blur(10px)', y: 24, opacity: 0 }, to: { filter: 'blur(0px)', y: 0, opacity: 1, duration: 1, ease: 'power2.out' } },
};

const TEXT_SELECTOR = '.eyebrow, h2, h3, p, li, .btn, .section-number, .stat-label, dt, dd';

/* Anima os filhos de texto de um container, em ordem de DOM.
   opts.words: headings entram palavra a palavra (máscara), como no Hero. */
function revealText(container, type = 'fade-up', opts = {}) {
  if (!container) return;
  const anim = TEXT_ANIMS[type] || TEXT_ANIMS['fade-up'];
  const start = opts.start || 'top 78%';
  const stagger = opts.stagger ?? 0.11;

  const headings = opts.words ? Array.from(container.querySelectorAll(opts.words)) : [];
  headings.forEach(splitWords);

  // filhos de texto, menos os que estão dentro de um heading já fatiado
  const items = Array.from(container.querySelectorAll(TEXT_SELECTOR))
    .filter((el) => !headings.some((h) => h !== el && h.contains(el)))
    .filter((el) => !el.closest('.word'));

  const tl = gsap.timeline({ scrollTrigger: { trigger: container, start } });

  items.forEach((el, i) => {
    if (headings.includes(el)) {
      const words = el.querySelectorAll('.word > span');
      if (words.length) {
        tl.from(words, { yPercent: 110, duration: 0.85, stagger: 0.05, ease: 'power3.out' }, i * stagger);
        return;
      }
    }
    tl.fromTo(el, anim.from, { ...anim.to }, i * stagger);
  });
}

/* Mapa de coreografia: cada seção recebe um tipo diferente da vizinha.
   Ordem = ordem de leitura da página. */
const CHOREOGRAPHY = [
  ['.explore-heading',    'clip-wipe',      { words: 'h2' }],
  ['.manifesto-body',     'fade-up',        { words: 'h2' }],
  ['.for-whom-title',     'clip-wipe',      { words: null, self: true }],
  ['.studios-title',      'slide-in-left',  { words: 'h2', self: true }],
  ['.details > h2',       'blur-focus',     { self: true }],
  ['.location-content',   'scale-soft',     {}],
  ['.developments-title', 'rotate-soft',    { self: true }],
  ['.architecture',       'slide-in-left',  { skip: '.architecture-gallery' }],
  ['.differentials > h2', 'clip-wipe',      { self: true }],
  ['.about-text',         'fade-up',        { words: 'h2' }],
  ['.journey > h2',       'stagger-up',     { self: true }],
  ['.faq > h2',           'blur-focus',     { self: true }],
];

CHOREOGRAPHY.forEach(([selector, type, opts = {}]) => {
  document.querySelectorAll(selector).forEach((el) => {
    if (opts.self) {
      // o próprio elemento é o alvo (títulos soltos de seção)
      const anim = TEXT_ANIMS[type];
      if (opts.words) {
        splitWords(el);
        gsap.from(el.querySelectorAll('.word > span'), {
          yPercent: 110, duration: 0.85, stagger: 0.05, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%' },
        });
      } else {
        gsap.fromTo(el, anim.from, { ...anim.to, scrollTrigger: { trigger: el, start: 'top 82%' } });
      }
    } else {
      revealText(el, type, opts);
    }
  });
});

/* Blocos com mídia: o texto interno entra escalonado depois da imagem */
document.querySelectorAll('.whom-text').forEach((el) => revealText(el, 'stagger-up', { start: 'top 80%' }));
document.querySelectorAll('.studio-info').forEach((el) => revealText(el, 'fade-up', { start: 'top 80%' }));
document.querySelectorAll('.dev-info').forEach((el) => revealText(el, 'slide-in-right', { start: 'top 80%' }));
document.querySelectorAll('.accordion-item').forEach((el, i) =>
  revealText(el, 'fade-up', { start: 'top 90%', stagger: 0.04 }));

document.querySelectorAll('[data-reveal]').forEach((el) => {
  const type = el.dataset.reveal;
  const start = 'top 75%';

  if (type === 'slide-left' || type === 'slide-right') {
    const dir = type === 'slide-left' ? -60 : 60;
    const textTarget = el.querySelector('.whom-text') || el;
    const media = el.querySelector('.whom-media');
    gsap.fromTo(textTarget, { opacity: 0, x: dir }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start } });
    if (media) gsap.fromTo(media, { scale: 1.1, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: el, start } });
  }
  if (type === 'mask-reveal' || type === 'mask-reveal-invert') {
    const media = el.querySelector('.studio-media');
    const info = el.querySelector('.studio-info');
    const from = type === 'mask-reveal' ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    gsap.fromTo(media, { clipPath: from }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.15, ease: 'power4.inOut', scrollTrigger: { trigger: el, start } });
    gsap.fromTo(info, { opacity: 0, x: type === 'mask-reveal' ? 30 : -30 }, { opacity: 1, x: 0, duration: 1, delay: 0.15, ease: 'power3.out', scrollTrigger: { trigger: el, start } });
  }
  if (type.startsWith('stagger-')) {
    const delay = { 'stagger-1': 0, 'stagger-2': 0.12, 'stagger-3': 0.24 }[type] || 0;
    gsap.fromTo(el, { opacity: 0, y: 34, scale: type === 'stagger-3' ? 0.94 : 1 },
      { opacity: 1, y: 0, scale: 1, duration: 0.9, delay, ease: 'power3.out', scrollTrigger: { trigger: el, start } });
  }
  if (type === 'parallax-fade') {
    const media = el.querySelector('.dev-media');
    gsap.fromTo(media, { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start } });
    if (!REDUCED) {
      gsap.to(media.querySelector('img'), { yPercent: -8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }
  if (type === 'scale-up') {
    const media = el.querySelector('.dev-media');
    gsap.fromTo(media, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: el, start } });
  }
  if (type === 'parallax-a' && !REDUCED) {
    gsap.to(el, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el.closest('.architecture'), start: 'top bottom', end: 'bottom top', scrub: true } });
  }
});

/* ==========================================================================
   12 · MARQUEE — loop contínuo (roda sozinho, independente do scroll)
   ========================================================================== */
if (!REDUCED) {
  // #marquee-track tem o conteúdo duplicado 2x, então -50% = exatamente uma volta (loop sem costura)
  gsap.to('#marquee-track', { xPercent: -50, ease: 'none', duration: 24, repeat: -1 });
}

/* ==========================================================================
   15 · CONHEÇA OS STUDIOS — canvas em tela cheia, Studio 01 → Studio 02
   ========================================================================== */
(function initExplore() {
  const canvas = document.getElementById('explore-canvas');
  const ctx = canvas.getContext('2d');
  const BG = '#061B2C';
  const IMAGE_SCALE = 1.02; // levemente >1 para garantir cobertura total, sem faixas
  const WIPE_END = 0.05; // primeiros 5% do scroll da seção = revelação em círculo

  const ROOMS = [
    { name: 'Studio 01', index: '01', frameCount: 121, path: (i) => `frames/studio-01/frame_${String(i).padStart(4, '0')}.jpg` },
    { name: 'Studio 02', index: '02', frameCount: 193, path: (i) => `frames/studio-02/frame_${String(i).padStart(4, '0')}.jpg` },
  ];
  const TOTAL_FRAMES = ROOMS.reduce((sum, r) => sum + r.frameCount, 0);
  const frameSets = ROOMS.map((room) => new Array(room.frameCount));
  let currentKey = '';

  /* Carregamento em lotes: os primeiros frames do Studio 01 entram rápido,
     o resto (Studio 01 + Studio 02) carrega em segundo plano via requestAnimationFrame,
     sem disparar todas as requisições de uma vez. */
  const loadingEl = document.getElementById('explore-loading');
  const loadingBar = document.getElementById('explore-loading-bar');
  let loadedCount = 0;

  function updateLoadingBar() {
    if (!loadingEl) return;
    const pct = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
    loadingBar.style.width = pct + '%';
    if (pct >= 100) loadingEl.classList.add('done');
  }

  function loadFrame(roomIdx, i) {
    const set = frameSets[roomIdx];
    if (set[i]) return;
    const img = new Image();
    img.onload = img.onerror = () => {
      loadedCount++;
      updateLoadingBar();
      if (roomIdx === 0 && i === 0 && !currentKey) drawFrame(0, 0);
    };
    img.src = ROOMS[roomIdx].path(i + 1);
    set[i] = img;
  }

  const FIRST_BATCH = Math.min(16, ROOMS[0].frameCount);
  for (let i = 0; i < FIRST_BATCH; i++) loadFrame(0, i);

  function preloadRest() {
    const queue = [];
    for (let i = FIRST_BATCH; i < ROOMS[0].frameCount; i++) queue.push([0, i]);
    for (let i = 0; i < ROOMS[1].frameCount; i++) queue.push([1, i]);
    let idx = 0;
    function next() {
      if (idx >= queue.length) return;
      const batch = Math.min(idx + 24, queue.length);
      for (; idx < batch; idx++) loadFrame(queue[idx][0], queue[idx][1]);
      requestAnimationFrame(next);
    }
    next();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentKey) drawFrame(currentKey.roomIdx, currentKey.frameIdx);
  }

  function drawFrame(roomIdx, frameIdx) {
    const img = frameSets[roomIdx][frameIdx];
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cw, ch);
    if (!img || !img.complete || !img.naturalWidth) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    currentKey = { roomIdx, frameIdx };
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  updateLoadingBar();
  window.addEventListener('load', () => setTimeout(preloadRest, 300));
  // segurança: se algo travar o load, garante que a barra some mesmo assim
  setTimeout(() => loadingEl && loadingEl.classList.add('done'), 8000);

  /* Rótulo do ambiente (Studio 01 → Studio 02) */
  const roomLabel = document.getElementById('room-label');
  const roomLabelIndex = roomLabel.querySelector('.room-label-index');
  const roomLabelName = roomLabel.querySelector('.room-label-name');
  let activeRoom = -1;

  function setActiveRoom(roomIdx) {
    if (roomIdx === activeRoom) return;
    activeRoom = roomIdx;
    const room = ROOMS[roomIdx];
    gsap.fromTo(roomLabel, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    roomLabelIndex.textContent = room.index;
    roomLabelName.textContent = room.name;
  }
  setActiveRoom(0);

  /* Revelação em círculo: o canvas se abre conforme a seção fica fixa (pinned) */
  const stage = document.querySelector('.explore-stage');
  if (!REDUCED) gsap.set(stage, { clipPath: 'circle(0% at 50% 50%)' });
  let wiped = REDUCED;

  ScrollTrigger.create({
    trigger: '#explore-wrap',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      let progress = self.progress;
      if (!REDUCED) {
        if (progress < WIPE_END) {
          gsap.set(stage, { clipPath: `circle(${(progress / WIPE_END) * 130}% at 50% 50%)` });
        } else if (!wiped) {
          gsap.set(stage, { clipPath: 'none' });
          wiped = true;
        }
        progress = Math.min(1, Math.max(0, (progress - WIPE_END) / (1 - WIPE_END)));
      }
      const roomIdx = progress < 0.5 ? 0 : 1;
      const roomProgress = roomIdx === 0 ? progress / 0.5 : (progress - 0.5) / 0.5;
      const roomFrameCount = ROOMS[roomIdx].frameCount;
      const frameIdx = Math.min(roomFrameCount - 1, Math.floor(roomProgress * (roomFrameCount - 1)));
      const set = frameSets[roomIdx];
      if (set[frameIdx] && set[frameIdx].complete) drawFrame(roomIdx, frameIdx);
      setActiveRoom(roomIdx);
    },
  });
})();

/* ==========================================================================
   16 · DETALHES — carrossel com transição de "porta deslizante"
   O slide que entra é revelado por clip-path a partir de uma das bordas,
   com a imagem fazendo contra-movimento (dá profundidade, não parece flat).
   ========================================================================== */
(function initCarousel() {
  const carousel = document.getElementById('detail-carousel');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const stage = document.getElementById('carousel-stage');
  const progressWrap = document.getElementById('carousel-progress');
  const capIndex = document.getElementById('caption-index');
  const capTitle = document.getElementById('caption-title');
  const capNote = document.getElementById('caption-note');
  const caption = document.getElementById('carousel-caption');
  document.getElementById('caption-total').textContent = String(slides.length).padStart(2, '0');

  const AUTOPLAY_MS = 5200;
  const DURATION = 1.05;
  let current = 0;
  let animating = false;
  let autoTimer = null;
  let progressTween = null;

  /* Indicadores (hairlines) */
  const tracks = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'progress-track';
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Detalhe ${i + 1}`);
    btn.innerHTML = '<span></span>';
    btn.addEventListener('click', () => { stopAuto(); goTo(i, i > current ? 1 : -1); startAuto(); });
    progressWrap.appendChild(btn);
    return btn;
  });

  function setCaption(slide) {
    capIndex.textContent = String(current + 1).padStart(2, '0');
    capTitle.textContent = slide.dataset.caption;
    capNote.textContent = slide.dataset.note;
  }

  function syncMedia(active = true) {
    slides.forEach((s, i) => {
      const v = s.querySelector('video');
      if (!v) return;
      if (active && i === current) {
        if (v.readyState === 0) v.load();
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  function runProgress() {
    if (progressTween) progressTween.kill();
    tracks.forEach((t, i) => {
      t.classList.toggle('is-done', i < current);
      if (i !== current) gsap.set(t.querySelector('span'), { scaleX: i < current ? 1 : 0 });
    });
    const bar = tracks[current].querySelector('span');
    gsap.set(bar, { scaleX: 0 });
    if (REDUCED) { gsap.set(bar, { scaleX: 1 }); return; }
    progressTween = gsap.to(bar, { scaleX: 1, duration: AUTOPLAY_MS / 1000, ease: 'none' });
  }

  function goTo(index, dir = 1) {
    if (animating || index === current) return;
    const next = (index + slides.length) % slides.length;
    const incoming = slides[next];
    const outgoing = slides[current];
    animating = true;

    const fromClip = dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    const incomingImg = incoming.querySelector('.slide-inner');
    const outgoingImg = outgoing.querySelector('.slide-inner');

    incoming.classList.add('is-active', 'is-wiping');
    outgoing.classList.add('is-leaving');
    outgoing.classList.remove('is-active');
    // o slide que sai continua inteiro por baixo enquanto a "porta" desliza sobre ele
    gsap.set(outgoing, { clipPath: 'inset(0 0 0 0%)' });

    current = next;
    setCaption(incoming);
    syncMedia();
    runProgress();
    dismissHint();

    if (REDUCED) {
      gsap.set(incoming, { clipPath: 'inset(0 0 0 0%)' });
      gsap.set(outgoing, { clipPath: 'inset(0 0 0 100%)' });
      incoming.classList.remove('is-wiping');
      outgoing.classList.remove('is-leaving');
      animating = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(outgoing, { clipPath: 'inset(0 0 0 100%)' });
        gsap.set(outgoingImg, { xPercent: 0, scale: 1 });
        outgoing.classList.remove('is-leaving');
        incoming.classList.remove('is-wiping');
        animating = false;
      },
    });

    // A "porta" abre revelando o novo slide…
    tl.fromTo(incoming, { clipPath: fromClip }, { clipPath: 'inset(0 0 0 0%)', duration: DURATION, ease: 'power4.inOut' }, 0)
      // …e a imagem de dentro faz contra-movimento, como se estivesse atrás do vão
      .fromTo(incomingImg, { xPercent: dir > 0 ? 12 : -12, scale: 1.08 },
        { xPercent: 0, scale: 1, duration: DURATION + 0.2, ease: 'power3.out' }, 0)
      // slide antigo recua de leve, criando profundidade entre as camadas
      .to(outgoingImg, { xPercent: dir > 0 ? -6 : 6, scale: 1.03, duration: DURATION, ease: 'power2.inOut' }, 0)
      .fromTo(caption.children, { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, DURATION * 0.45);
  }

  const next = () => goTo(current + 1, 1);
  const prev = () => goTo(current - 1, -1);

  document.getElementById('carousel-next').addEventListener('click', () => { stopAuto(); next(); startAuto(); });
  document.getElementById('carousel-prev').addEventListener('click', () => { stopAuto(); prev(); startAuto(); });

  /* Teclado */
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stopAuto(); next(); startAuto(); }
    if (e.key === 'ArrowLeft') { stopAuto(); prev(); startAuto(); }
  });

  /* Arraste (dedo no mobile, mouse no desktop) com resposta tátil ao vivo:
     a imagem acompanha o dedo com resistência e volta se o gesto for curto. */
  const hint = document.getElementById('drag-hint');
  let hintDismissed = false;
  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    hint.classList.add('is-hidden');
  }

  const DRAG_THRESHOLD = 55;
  let dragging = false;
  let startX = 0;
  let dragDelta = 0;

  function activeInner() { return slides[current].querySelector('.slide-inner'); }

  stage.addEventListener('pointerdown', (e) => {
    if (animating || e.button > 0) return;
    dragging = true;
    startX = e.clientX;
    dragDelta = 0;
    stage.classList.add('is-grabbing');
    stage.setPointerCapture(e.pointerId);
    stopAuto();
  });

  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragDelta = e.clientX - startX;
    if (Math.abs(dragDelta) > 8) dismissHint();
    if (REDUCED) return;
    // resistência: acompanha o gesto, mas amortecido
    gsap.set(activeInner(), { xPercent: (dragDelta / stage.offsetWidth) * 14 });
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-grabbing');
    if (e.pointerId !== undefined && stage.hasPointerCapture?.(e.pointerId)) {
      stage.releasePointerCapture(e.pointerId);
    }
    const delta = dragDelta;
    dragDelta = 0;

    if (Math.abs(delta) > DRAG_THRESHOLD) {
      // o snap-back é dispensado: a transição já reposiciona a imagem
      delta < 0 ? next() : prev();
    } else if (!REDUCED) {
      gsap.to(activeInner(), { xPercent: 0, duration: 0.45, ease: 'power3.out' });
    }
    if (visible) startAuto();
  }

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // qualquer interação real dispensa o indicador
  [document.getElementById('carousel-next'), document.getElementById('carousel-prev')]
    .forEach((b) => b.addEventListener('click', dismissHint));
  tracks.forEach((t) => t.addEventListener('click', dismissHint));

  /* Autoplay: só roda com o carrossel visível, pausa no hover */
  function startAuto() {
    stopAuto();
    if (REDUCED) return;
    runProgress();
    autoTimer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (progressTween) progressTween.pause();
  }

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', () => { if (visible) startAuto(); });

  let visible = false;
  ScrollTrigger.create({
    trigger: carousel,
    start: 'top 85%',
    end: 'bottom 15%',
    onToggle: (self) => {
      visible = self.isActive;
      if (self.isActive) { syncMedia(true); startAuto(); } else { stopAuto(); syncMedia(false); }
    },
  });

  setCaption(slides[0]);
  gsap.set(tracks[0].querySelector('span'), { scaleX: 0 });
})();

/* ==========================================================================
   17 · LOCALIZAÇÃO — mask reveal + line drawing + pulse
   ========================================================================== */
(function initMap() {
  const lines = gsap.utils.toArray('.map-line');
  const points = gsap.utils.toArray('.map-point');
  lines.forEach((line) => {
    const len = line.getTotalLength();
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  });
  gsap.set(points, { scale: 0, transformOrigin: 'center' });
  gsap.set('.location-map', { opacity: 0 });

  ScrollTrigger.create({
    trigger: '.location',
    start: 'top 55%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to('.location-map', { opacity: 1, duration: 0.6 })
        .to(lines, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: 0.15 }, 0.15)
        .to(points, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.1 }, '-=0.3');
    },
  });
})();

/* ==========================================================================
   20 · NÚMEROS — counters
   ========================================================================== */
document.querySelectorAll('[data-count-to]').forEach((el) => {
  const target = +el.dataset.countTo;
  const counter = { val: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: 'top 82%',
    once: true,
    onEnter: () => {
      gsap.to(counter, {
        val: target, duration: 1.6, ease: 'power1.out',
        onUpdate: () => { el.textContent = Math.round(counter.val); },
      });
    },
  });
});

/* ==========================================================================
   21 · DIFERENCIAIS — rotate-in list + hover/click preview image
   ========================================================================== */
gsap.utils.toArray('.diff-item').forEach((item, i) => {
  gsap.fromTo(item, { opacity: 0, y: 26, rotation: 2 },
    { opacity: 1, y: 0, rotation: 0, duration: 0.85, delay: i * 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 85%' } });
});

const diffPreview = document.getElementById('diff-preview');
document.querySelectorAll('.diff-item').forEach((item) => {
  const show = () => {
    diffPreview.style.backgroundImage = `url('${item.dataset.image}')`;
    diffPreview.classList.add('active');
  };
  item.addEventListener('mouseenter', show);
  item.addEventListener('click', show);
});
document.querySelector('.diff-list').addEventListener('mouseleave', () => diffPreview.classList.remove('active'));

/* ==========================================================================
   22 · COMERCIAL — fade-up curto
   ========================================================================== */
gsap.fromTo('.commercial > *', { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out',
    scrollTrigger: { trigger: '.commercial', start: 'top 82%' } });

/* ==========================================================================
   23 · SOBRE — crossfade da imagem de detalhe
   ========================================================================== */
gsap.fromTo('.about-detail img', { opacity: 0, scale: 1.05 },
  { opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.about', start: 'top 70%' } });

/* ==========================================================================
   24 · JORNADA — linha desenhada no scroll
   ========================================================================== */
(function initJourney() {
  const line = document.getElementById('journey-stroke');
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(line, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.journey-list', start: 'top 75%', end: 'bottom 70%', scrub: true },
  });
  gsap.utils.toArray('.journey-step').forEach((step) => {
    gsap.fromTo(step, { opacity: 0.25 }, { opacity: 1, duration: 0.4, ease: 'power1.out',
      scrollTrigger: { trigger: step, start: 'top 78%' } });
  });
})();

/* ==========================================================================
   25 · FAQ — accordion
   ========================================================================== */
document.querySelectorAll('.accordion-item').forEach((item) => {
  const trigger = item.querySelector('.accordion-trigger');
  const panel = item.querySelector('.accordion-panel');
  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.accordion-item.open').forEach((openItem) => {
      openItem.classList.remove('open');
      openItem.querySelector('.accordion-panel').style.maxHeight = '';
    });
    if (!isOpen) {
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

/* ==========================================================================
   26 · CTA FINAL — scale + reveal, persiste
   ========================================================================== */
gsap.fromTo('.cta-final-media img', { scale: 1.05 }, {
  scale: 1, duration: 1.4, ease: 'power2.out',
  scrollTrigger: { trigger: '.cta-final', start: 'top 70%', toggleActions: 'play none none none' },
});
gsap.fromTo('.cta-final-content', { opacity: 0, y: 24 }, {
  opacity: 1, y: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.cta-final', start: 'top 65%', toggleActions: 'play none none none' },
});

/* ==========================================================================
   27 · FOOTER — fade simples
   ========================================================================== */
gsap.fromTo('.site-footer', { opacity: 0 }, {
  opacity: 1, duration: 0.8, ease: 'power1.out',
  scrollTrigger: { trigger: '.site-footer', start: 'top 92%' },
});

/* ==========================================================================
   Vídeos em loop — carregam só perto da viewport, play/pause conforme
   entram/saem dela (evita baixar todos os vídeos de fundo no carregamento inicial)
   ========================================================================== */
document.querySelectorAll('video.bg-video').forEach((video) => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (video.readyState === 0) video.load();
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.15, rootMargin: '600px 0px' });
  io.observe(video);
});

/* ==========================================================================
   POP-UP DE AGENDA — horários de visita para o próximo dia útil
   Não inventa pessoas nem reservas: mostra apenas a janela real de
   atendimento (08h às 18h) para o próximo dia, alternando o horário.
   Para ligar a uma agenda real, troque AGENDA.slots pelos horários livres
   vindos do sistema/planilha da Luctor.
   ========================================================================== */
const AGENDA = {
  // janela de atendimento: 08h às 18h
  slots: ['08h', '09h', '10h', '11h', '13h', '14h', '15h', '16h', '17h', '18h'],
  currentTime: null,

  // próximo dia; se cair no domingo, pula para segunda
  nextDay() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  },
  dayLabel() {
    const d = this.nextDay();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã';
    const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return `Na ${dias[d.getDay()]}`;
  },
};

(function initAgendaPop() {
  const pop = document.getElementById('agenda-pop');
  if (!pop) return;

  const dayEl = document.getElementById('agenda-day');
  const timeEl = document.getElementById('agenda-time');
  const closeBtn = document.getElementById('agenda-close');

  const SHOW_MS = 7000;              // tempo visível
  const CYCLE_MIN = 15000;           // intervalo entre aparições: 15s…
  const CYCLE_MAX = 20000;           // …a 20s
  let dismissed = false;
  let slotIndex = Math.floor(Math.random() * AGENDA.slots.length);
  let timer = null;

  dayEl.textContent = AGENDA.dayLabel();

  function nextSlot() {
    slotIndex = (slotIndex + 1) % AGENDA.slots.length;
    AGENDA.currentTime = AGENDA.slots[slotIndex];
    timeEl.textContent = AGENDA.currentTime;
  }

  function show() {
    if (dismissed) return;
    nextSlot();
    dayEl.textContent = AGENDA.dayLabel();
    pop.classList.add('is-visible');
    setTimeout(hide, SHOW_MS);
  }

  function hide() {
    pop.classList.remove('is-visible');
    if (!dismissed) schedule();
  }

  function schedule() {
    clearTimeout(timer);
    const wait = CYCLE_MIN + Math.random() * (CYCLE_MAX - CYCLE_MIN);
    timer = setTimeout(show, wait);
  }

  closeBtn.addEventListener('click', () => {
    dismissed = true;
    clearTimeout(timer);
    pop.classList.remove('is-visible');
    try { sessionStorage.setItem('luctor-agenda-dismissed', '1'); } catch (e) { /* modo privado */ }
  });

  // quem já fechou não vê de novo nesta sessão
  try {
    if (sessionStorage.getItem('luctor-agenda-dismissed')) dismissed = true;
  } catch (e) { /* modo privado */ }

  // primeira aparição só depois que a pessoa passou do Hero
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 60%',
    once: true,
    onEnter: () => { if (!dismissed) setTimeout(show, 2500); },
  });

  // some enquanto o CTA final está na tela (lá o CTA já é o protagonista)
  ScrollTrigger.create({
    trigger: '.cta-final',
    start: 'top 80%',
    onToggle: (self) => {
      if (self.isActive) { clearTimeout(timer); pop.classList.remove('is-visible'); }
      else if (!dismissed) schedule();
    },
  });
})();
