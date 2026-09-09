const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll reveal ---------- */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (prefersReducedMotion) return;
  document.body.classList.add('reveal-armed');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach((item) => observer.observe(item));
})();

/* ---------- Active nav link on scroll ---------- */
(function initScrollSpy() {
  const links = document.querySelectorAll('.main-nav a[href^="#"]');
  const sections = Array.from(links).map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;
  const setActive = (id) => links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); }), { threshold: 0.4 });
  sections.forEach((section) => observer.observe(section));
})();

/* ---------- Hero network canvas ---------- */
(function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, nodes;
  const NODE_COUNT = 42;
  const LINK_DISTANCE = 130;
  function resize() { const rect = canvas.parentElement.getBoundingClientRect(); width = canvas.width = rect.width; height = canvas.height = rect.height; }
  function makeNodes() { nodes = Array.from({ length: NODE_COUNT }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 })); }
  function step() {
    ctx.clearRect(0, 0, width, height);
    nodes.forEach((n) => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > width) n.vx *= -1; if (n.y < 0 || n.y > height) n.vy *= -1; });
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j]; const dx = a.x - b.x, dy = a.y - b.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < LINK_DISTANCE) { ctx.strokeStyle = `rgba(30,111,224,${1 - dist / LINK_DISTANCE})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
    nodes.forEach((n) => { ctx.fillStyle = 'rgba(18,58,115,.65)'; ctx.beginPath(); ctx.arc(n.x, n.y, 2.4, 0, Math.PI * 2); ctx.fill(); });
    if (!prefersReducedMotion) requestAnimationFrame(step);
  }
  resize(); makeNodes(); step();
  window.addEventListener('resize', () => { resize(); makeNodes(); });
})();

/* ---------- Carousel ---------- */
(function initCarousel() {
  const carousel = document.getElementById('carousel');
  const track = document.getElementById('carousel-track');
  const dotsWrap = document.getElementById('carousel-dots');
  if (!carousel || !track || !dotsWrap) return;
  const slides = Array.from(track.children); let index = 0; let autoplayTimer = null;
  slides.forEach((_, i) => { const dot = document.createElement('button'); dot.type = 'button'; dot.setAttribute('aria-label', `Aller à la diapositive ${i + 1}`); if (i === 0) dot.classList.add('is-active'); dot.addEventListener('click', () => goTo(i)); dotsWrap.appendChild(dot); });
  const dots = Array.from(dotsWrap.children);
  function render() { track.style.transform = `translateX(-${index * 100}%)`; dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index)); }
  function goTo(i) { index = (i + slides.length) % slides.length; render(); }
  function next() { goTo(index + 1); } function prev() { goTo(index - 1); }
  carousel.querySelector('.carousel-next').addEventListener('click', () => { next(); restartAutoplay(); });
  carousel.querySelector('.carousel-prev').addEventListener('click', () => { prev(); restartAutoplay(); });
  function startAutoplay() { if (prefersReducedMotion) return; autoplayTimer = setInterval(next, 5500); }
  function stopAutoplay() { if (autoplayTimer) clearInterval(autoplayTimer); }
  function restartAutoplay() { stopAutoplay(); startAutoplay(); }
  carousel.addEventListener('mouseenter', stopAutoplay); carousel.addEventListener('mouseleave', startAutoplay); carousel.addEventListener('focusin', stopAutoplay); carousel.addEventListener('focusout', startAutoplay);
  let dragStartX = null;
  track.addEventListener('pointerdown', (e) => { dragStartX = e.clientX; stopAutoplay(); });
  track.addEventListener('pointerup', (e) => { if (dragStartX === null) return; const delta = e.clientX - dragStartX; if (delta > 50) prev(); else if (delta < -50) next(); dragStartX = null; startAutoplay(); });
  render(); startAutoplay();
})();

/* ---------- Forms: real submission via Web3Forms ---------- */
function wireWeb3FormsForm(formId, statusId, successMessage) {
  const form = document.getElementById(formId); const status = document.getElementById(statusId); if (!form || !status) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); const submitBtn = form.querySelector('button[type="submit"]'); const data = new FormData(form); const organisation = data.get('organisation');
    if (String(data.get('access_key') || '').includes('REMPLACE_PAR_TA_CLE_WEB3FORMS')) { status.textContent = "Formulaire pas encore branché : ajoute ta clé Web3Forms (web3forms.com) dans le champ access_key."; status.classList.add('is-error'); return; }
    submitBtn.classList.add('is-loading'); status.textContent = ''; status.classList.remove('is-error');
    try { const response = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: data }); const result = await response.json();
      if (result.success) { status.textContent = successMessage(organisation); form.reset(); fireConfetti(submitBtn); } else { status.textContent = "L'envoi a échoué. Réessayez, ou écrivez-nous directement par e-mail ou WhatsApp."; status.classList.add('is-error'); }
    } catch (err) { status.textContent = "Connexion impossible. Réessayez, ou écrivez-nous directement par e-mail ou WhatsApp."; status.classList.add('is-error'); }
    finally { submitBtn.classList.remove('is-loading'); }
  });
}
wireWeb3FormsForm('contact-form', 'form-status', (organisation) => `Merci, ${organisation} ! Votre demande est envoyée, nous revenons vers vous rapidement.`);
wireWeb3FormsForm('notify-form', 'notify-status', (organisation) => `Merci, ${organisation} ! Nous vous préviendrons dès l'ouverture de l'espace client.`);

/* ---------- Scroll progress bar ---------- */
(function initScrollProgress() { const bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar); function update() { const scrollTop = window.scrollY; const docHeight = document.documentElement.scrollHeight - window.innerHeight; const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0; bar.style.width = pct + '%'; } window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update(); })();

/* ---------- Magnetic primary buttons ---------- */
(function initMagneticButtons() { if (prefersReducedMotion) return; const buttons = document.querySelectorAll('.btn-primary'); buttons.forEach((btn) => { btn.addEventListener('mousemove', (e) => { const rect = btn.getBoundingClientRect(); const x = e.clientX - rect.left - rect.width / 2; const y = e.clientY - rect.top - rect.height / 2; btn.style.transform = `translate(${x * 0.12}px,${y * 0.35}px)`; }); btn.addEventListener('mouseleave', () => { btn.style.transform = ''; }); }); })();

/* ---------- Confetti burst (flag colors) ---------- */
function fireConfetti(originEl) { if (prefersReducedMotion || !originEl) return; const colors = ['#009543','#FFCB05','#CE1126','#1E6FE0']; const rect = originEl.getBoundingClientRect(); const originX = rect.left + rect.width / 2; const originY = rect.top; for (let i = 0; i < 24; i++) { const piece = document.createElement('span'); piece.className = 'confetti-piece'; piece.style.left = originX + 'px'; piece.style.top = originY + 'px'; piece.style.background = colors[i % colors.length]; const angle = (Math.random() * Math.PI) - Math.PI / 2 - Math.PI / 2; const distance = 80 + Math.random() * 90; piece.style.setProperty('--dx', Math.cos(angle) * distance + 'px'); piece.style.setProperty('--dy', Math.sin(angle) * distance - 60 + 'px'); piece.style.setProperty('--rot', (Math.random() * 360) + 'deg'); document.body.appendChild(piece); setTimeout(() => piece.remove(), 900); } }

/* ---------- FAQ accordion ---------- */
(function initFaq() { const items = document.querySelectorAll('.faq-item'); if (!items.length) return; items.forEach((item) => { const question = item.querySelector('.faq-question'); const answer = item.querySelector('.faq-answer'); question.addEventListener('click', () => { const isOpen = item.classList.contains('is-open'); items.forEach((other) => { other.classList.remove('is-open'); other.querySelector('.faq-answer').style.maxHeight = null; }); if (!isOpen) { item.classList.add('is-open'); answer.style.maxHeight = answer.scrollHeight + 'px'; } }); }); })();

/* ---------- Word rotator (hero subtitles) ---------- */
(function initWordRotate() { const el = document.querySelector('.word-rotate'); if (!el) return; const words = (el.dataset.words || '').split('|').map((w) => w.trim()).filter(Boolean); if (words.length < 2) return; let i = 0; el.textContent = words[0]; if (prefersReducedMotion) return; setInterval(() => { i = (i + 1) % words.length; el.style.opacity = '0'; setTimeout(() => { el.textContent = words[i]; el.style.opacity = '1'; }, 220); }, 2600); })();

/* ---------- Devis express wizard ---------- */
(function initDevisWizard() { const wizard = document.getElementById('devis-wizard'); if (!wizard) return; const steps = Array.from(wizard.querySelectorAll('.devis-step')); const dots = Array.from(wizard.querySelectorAll('.devis-progress-dot')); const answers = {}; const responseCopy = { 'Urgent (sous 24h)': "Réponse prioritaire visée sous 24h : contactez-nous aussi par téléphone ou WhatsApp pour accélérer.", 'Cette semaine': "Réponse et premier diagnostic sous 2 à 3 jours ouvrés.", 'Pas pressé, à planifier': "On regarde ensemble le meilleur créneau, sans pression de délai." };
  function showStep(n) { steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === n)); dots.forEach((d) => { const step = Number(d.dataset.stepDot); d.classList.toggle('is-active', step === n); d.classList.toggle('is-done', step < n); }); }
  wizard.querySelectorAll('[data-step="1"] .devis-option').forEach((btn) => { btn.addEventListener('click', () => { answers.service = btn.dataset.value; showStep(2); }); });
  wizard.querySelectorAll('[data-step="2"] .devis-option').forEach((btn) => { btn.addEventListener('click', () => { answers.urgence = btn.dataset.value; const title = document.getElementById('devis-result-title'); const text = document.getElementById('devis-result-text'); const cta = document.getElementById('devis-cta'); title.textContent = `${answers.service} — ${answers.urgence}`; text.textContent = responseCopy[answers.urgence] || ''; const params = new URLSearchParams({ service: answers.service, urgence: answers.urgence }); cta.href = `index.html?${params.toString()}#contact`; showStep(3); if (typeof fireConfetti === 'function') fireConfetti(cta); }); });
  wizard.querySelectorAll('[data-back]').forEach((btn) => { btn.addEventListener('click', () => { const current = Number(btn.closest('.devis-step').dataset.step); showStep(current === 3 ? 1 : current - 1); }); });
})();

/* ---------- Prefill contact form from ?service=&urgence= ---------- */
(function prefillContactForm() { const form = document.getElementById('contact-form'); if (!form) return; const params = new URLSearchParams(window.location.search); const service = params.get('service'); const urgence = params.get('urgence'); if (!service && !urgence) return; const select = form.querySelector('select[name="service"]'); if (select && service) { const match = Array.from(select.options).find((o) => o.value === service); if (match) select.value = service; } const message = form.querySelector('textarea[name="message"]'); if (message && urgence) message.value = `Urgence indiquée via le devis express : ${urgence}.\n`; })();

/* ---------- PWA: register service worker ---------- */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }

/* ---------- Preloader ---------- */
(function initPreloader() { var pre = document.getElementById('preloader'); if (!pre) return; var html = document.documentElement; if (html.classList.contains('no-intro')) { pre.remove(); return; } var ringFill = document.getElementById('preloader-ring-fill'); var statusEl = document.getElementById('preloader-status'); var pctEl = document.getElementById('preloader-pct'); var skipBtn = document.getElementById('preloader-skip'); var R = 88; var CIRC = 2 * Math.PI * R; ringFill.style.strokeDasharray = CIRC; ringFill.style.strokeDashoffset = CIRC; var messages = [[0,'Connexion au réseau…'],[30,'Diagnostic des équipements…'],[60,'Vérification des caméras…'],[85,"Préparation de l'espace client…"]]; var pct = 0; var target = 6; var done = false; var windowLoaded = document.readyState === 'complete'; var start = performance.now(); var MIN_MS = 1500; var MAX_MS = 5000; window.addEventListener('load', function () { windowLoaded = true; }); function setMessage(p) { var msg = messages[0][1]; for (var i = 0; i < messages.length; i++) if (p >= messages[i][0]) msg = messages[i][1]; if (statusEl.textContent !== msg) statusEl.textContent = msg; } function frame(now) { if (done) return; var elapsed = now - start; var timeTarget = Math.min(92, (elapsed / MAX_MS) * 100 + 10); target = windowLoaded ? 100 : Math.max(target, timeTarget); pct += (target - pct) * 0.09; if (target - pct < 0.15) pct = target; var shown = Math.min(100, Math.round(pct)); pctEl.textContent = shown + '%'; setMessage(shown); ringFill.style.strokeDashoffset = CIRC - CIRC * (pct / 100); var reachedEnd = pct >= 99.4 && windowLoaded && elapsed >= MIN_MS; var hardTimeout = elapsed >= MAX_MS; if (reachedEnd || hardTimeout) { finish(); return; } requestAnimationFrame(frame); } function finish() { if (done) return; done = true; pctEl.textContent = '100%'; statusEl.textContent = 'Prêt.'; ringFill.style.strokeDashoffset = 0; pre.classList.add('is-complete'); setTimeout(leave, 420); } function leave() { pre.classList.add('is-leaving'); html.classList.remove('is-loading'); try { sessionStorage.setItem('tekatech_intro_seen', '1'); } catch (e) {} setTimeout(function () { pre.remove(); }, 780); } skipBtn.addEventListener('click', finish); window.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); }); requestAnimationFrame(frame); })();

/* ---------- TekaTech V2: load visual layer, add client nav, replace fragile remote images ---------- */
(function initTekaTechV2() {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'v2.css';
  document.head.appendChild(css);

  document.querySelectorAll('.main-nav').forEach((nav) => {
    if (!nav.querySelector('a[href="espace-client.html"]')) {
      const link = document.createElement('a');
      link.href = 'espace-client.html';
      link.textContent = 'Espace client';
      link.className = 'nav-client-link';
      nav.appendChild(link);
    }
  });

  const replacements = [
    ['Servers_in_a_Rack', 'assets/field-network.svg'],
    ['Network cables', 'assets/field-network.svg'],
    ['Cat6', 'assets/field-network.svg'],
    ['Optical fiber', 'assets/field-network.svg'],
    ['Video_Surveillance', 'assets/field-security.svg'],
    ['Surveillance', 'assets/field-security.svg'],
    ['CCTV', 'assets/field-security.svg'],
    ['Technician_with_laptop', 'assets/field-support.svg'],
    ['Technician', 'assets/field-support.svg'],
    ['LaserJet', 'assets/field-support.svg'],
    ['notebook', 'assets/field-support.svg'],
    ['laptop', 'assets/field-support.svg'],
    ['smartphone', 'assets/field-support.svg'],
    ['computer', 'assets/field-support.svg'],
    ['PDC_server_room', 'assets/field-network.svg']
  ];

  document.querySelectorAll('img[src*="commons.wikimedia.org"]').forEach((img) => {
    const src = img.getAttribute('src') || '';
    const match = replacements.find(([needle]) => src.toLowerCase().includes(needle.toLowerCase()));
    img.src = match ? match[1] : 'assets/field-support.svg';
    img.removeAttribute('srcset');
    img.loading = 'lazy';
    img.decoding = 'async';
  });

  document.querySelectorAll('img:not([width])').forEach((img) => {
    if (img.closest('.hero')) return;
    img.decoding = 'async';
  });
})();
