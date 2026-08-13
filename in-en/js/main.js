/* ═══════════════════════════════════════════════════════════════
   ANIKA STERILIS — Main JavaScript  v1.0
   © 2026 Anika Sterilis Private Limited
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── NAVIGATION ──────────────────────────────────────────────── */
const nav = document.querySelector('.site-nav');
const hamburger = document.querySelector('.nav-hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

/* Keep the Career destination available in both desktop and mobile navigation. */
(function addCareerNavigation() {
  const careerUrl = 'https://jobs.anikasterilis.com/jobs.php';

  document.querySelectorAll('.nav-links, .mobile-nav-links').forEach(list => {
    let careerLink = Array.from(list.querySelectorAll('a')).find(link =>
      /career/i.test(link.textContent.trim()) || link.href === careerUrl
    );

    if (careerLink) {
      careerLink.href = careerUrl;
      careerLink.textContent = 'Career';
      return;
    }

    const item = document.createElement('li');
    careerLink = document.createElement('a');
    careerLink.href = careerUrl;
    careerLink.textContent = 'Career';
    item.appendChild(careerLink);

    const contactItem = Array.from(list.children).find(child =>
      /contact/i.test(child.textContent.trim())
    );
    list.insertBefore(item, contactItem || null);
  });
})();

if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
  mobileMenu.addEventListener('click', e => {
    if (e.target.closest('a')) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800 && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* Hamburger morph */
document.head.insertAdjacentHTML('beforeend', `<style>
  .nav-hamburger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
  .nav-hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
  .nav-hamburger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
</style>`);

/* Active link highlight */
(function(){
  const links = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
  const solutionPages = new Set([
    'defense',
    'aviation',
    'border-customs',
    'healthcare',
    'industrial',
    'forensics'
  ]);

  function normalizePath(value) {
    const path = (value || '').split('#')[0].split('?')[0].replace(/\/+$/, '');
    const page = path.split('/').pop() || 'index';
    const normalizedPage = page.replace(/\.html$/, '') || 'index';
    return solutionPages.has(normalizedPage) ? 'solutions' : normalizedPage;
  }

  function setActiveLink(activeLink) {
    const activePath = activeLink
      ? normalizePath(activeLink.getAttribute('href'))
      : normalizePath(location.pathname);

    links.forEach(link => {
      link.classList.toggle('active', normalizePath(link.getAttribute('href')) === activePath);
    });
  }

  setActiveLink();
  links.forEach(link => {
    link.addEventListener('click', () => setActiveLink(link));
  });
})();

/* ── SCROLL REVEAL ───────────────────────────────────────────── */
(function(){
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* ── ACTIVE SIDE NAV ─────────────────────────────────────────── */
(function(){
  const sideLinks = document.querySelectorAll('.side-nav-link');
  if (!sideLinks.length) return;
  const sections = [];
  sideLinks.forEach(l => {
    const id = (l.getAttribute('href')||'').replace('#','');
    if (id) { const s = document.getElementById(id); if (s) sections.push(s); }
  });
  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 130) cur = s.id; });
    sideLinks.forEach(l => {
      l.classList.toggle('active', (l.getAttribute('href')||'').replace('#','') === cur);
    });
  }, { passive: true });
})();

/* ── ION DRIFT CANVAS ────────────────────────────────────────── */
function initIonCanvas(id, height) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  let W, H;
  const ctx = canvas.getContext('2d');
  const CLASSES = [
    { name: 'Explosives', color: '#1A72E8', factor: 0.72 },
    { name: 'Narcotics',  color: '#FFB800', factor: 1.0  },
    { name: 'VOC/Bio',    color: '#00C8F0', factor: 1.38 }
  ];
  let particles = [];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width || 500;
    H = height || rect.height || 480;
    canvas.width  = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    particles = [];
    initParticles();
  }

  function initParticles() {
    CLASSES.forEach((cls, ci) => {
      for (let i = 0; i < 12; i++) {
        particles.push({
          ci, x: Math.random() * W * 0.12,
          y: H * 0.28 + Math.random() * H * 0.44,
          vx: 0.9 + Math.random() * 0.5,
          vy: 0, phase: Math.random() * Math.PI * 2,
          r: 2 + Math.random() * 2,
          alpha: 0.5 + Math.random() * 0.5,
          sep: false, done: false,
          age: -Math.random() * 100
        });
      }
    });
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0A0B0F'; ctx.fillRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = 'rgba(0,200,240,0.04)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    /* Tube */
    const tx = W * 0.14, tw = W * 0.58;
    ctx.fillStyle = 'rgba(26,114,232,0.025)'; ctx.fillRect(tx, H*0.15, tw, H*0.7);
    ctx.strokeStyle = 'rgba(26,114,232,0.07)'; ctx.lineWidth = 1;
    ctx.strokeRect(tx, H*0.15, tw, H*0.7);

    const isMobile = W < 450;
    const monoFont = getComputedStyle(document.documentElement).getPropertyValue('--fm')||'monospace';
    ctx.font = `${isMobile ? 11 : 10}px ${monoFont}`;
    ctx.fillStyle = isMobile ? 'rgba(74,85,104,0.9)' : 'rgba(74,85,104,0.7)';
    ctx.fillText('SAMPLE INLET', 6, H*0.5);
    ctx.fillText('DETECTOR', W*0.77, H*0.5);
    ctx.textAlign = 'center';
    ctx.fillStyle = isMobile ? 'rgba(0,200,240,0.55)' : 'rgba(0,200,240,0.28)';
    ctx.fillText(isMobile ? 'DUAL AXIAL IMS' : 'DUAL AXIAL IMS — TRU-RAD X-AIMS', W*0.43, H*0.11);
    ctx.textAlign = 'left';

    /* Particles */
    particles.forEach(p => {
      p.age++;
      if (p.age < 0) return;
      if (p.done) {
        p.x = Math.random() * W * 0.09;
        p.y = H * 0.28 + Math.random() * H * 0.44;
        p.vx = 0.9 + Math.random() * 0.5; p.vy = 0;
        p.sep = false; p.done = false; p.age = -Math.random() * 70;
        return;
      }
      const cls = CLASSES[p.ci];
      const sepX = W * 0.36;
      if (p.x > sepX && !p.sep) {
        p.sep = true;
        const ty = H * (0.32 + p.ci * 0.18);
        p.vy = (ty - p.y) / (W * 0.35) * 1.1;
      }
      if (p.sep) p.vx = 1.0 * cls.factor;
      p.x += p.vx;
      p.y += p.vy + Math.sin(t * 2 + p.phase) * 0.15;
      if (p.x > W * 0.79) { p.done = true; return; }
      ctx.save();
      ctx.globalAlpha = p.alpha * Math.min(1, p.age / 20);
      ctx.fillStyle = cls.color;
      ctx.shadowColor = cls.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    /* Peaks */
    CLASSES.forEach((cls, i) => {
      const px = W * 0.8, py = H * (0.36 + i * 0.17);
      const ih = 28 + Math.sin(t * 0.7 + i * 2) * 5;
      ctx.save(); ctx.globalAlpha = 0.75;
      ctx.strokeStyle = cls.color; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, py + 18);
      ctx.quadraticCurveTo(px + 14, py - ih, px + 28, py + 18);
      ctx.stroke(); ctx.restore();
      if (isMobile) {
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = cls.color; ctx.globalAlpha = 1;
        ctx.shadowColor = cls.color; ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.fillText(cls.name, px + 14, py - ih - 8);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      } else {
        ctx.font = '10px monospace'; ctx.fillStyle = cls.color; ctx.globalAlpha = 0.85;
        ctx.fillText(cls.name, px + 32, py + 4); ctx.globalAlpha = 1;
      }
    });

    ctx.font = '9px monospace'; ctx.fillStyle = isMobile ? 'rgba(74,85,104,0.9)' : 'rgba(74,85,104,0.7)';
    ctx.fillText('DRIFT TIME →', W * 0.2, H - 12);
    t += 0.018;
    requestAnimationFrame(draw);
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  draw();
}

/* ── IMS SPECTRUM MINI CANVAS ────────────────────────────────── */
function initSpectrumCanvas(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = 320, H = 180;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  const peaks = [
    { x: 0.22, h: 0.52, w: 16, color: '#FFB800', label: 'TNT' },
    { x: 0.38, h: 0.76, w: 13, color: '#FFB800', label: 'RDX' },
    { x: 0.53, h: 0.44, w: 18, color: '#1A72E8', label: 'Cocaine' },
    { x: 0.66, h: 0.8,  w: 11, color: '#1A72E8', label: 'Meth' },
    { x: 0.8,  h: 0.34, w: 14, color: '#00C8F0', label: 'VOC-1' },
  ];
  let t = 0;
  function drawSpectrum() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0A0B0F'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(139,150,176,0.2)'; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(24,H-26); ctx.lineTo(W-8,H-26); ctx.stroke();
    ctx.font='8px monospace'; ctx.fillStyle='rgba(74,85,104,0.8)';
    ctx.fillText('Drift Time →', 26, H-10);
    peaks.forEach((p,i) => {
      const cx = p.x * W, bY = H-26;
      const wob = Math.sin(t*0.9+i*1.3)*1.8;
      const ph = p.h*(H-50)+wob;
      const g = ctx.createLinearGradient(cx,bY-ph,cx,bY);
      g.addColorStop(0,p.color+'CC'); g.addColorStop(1,p.color+'22');
      ctx.fillStyle=g; ctx.beginPath();
      for(let x=cx-p.w*2;x<=cx+p.w*2;x++){
        const dy=ph*Math.exp(-Math.pow(x-cx,2)/(2*p.w*p.w));
        x===cx-p.w*2?ctx.moveTo(x,bY-dy):ctx.lineTo(x,bY-dy);
      }
      ctx.lineTo(cx+p.w*2,bY); ctx.lineTo(cx-p.w*2,bY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=p.color+'AA'; ctx.lineWidth=1.4; ctx.beginPath();
      for(let x=cx-p.w*2;x<=cx+p.w*2;x++){
        const dy=ph*Math.exp(-Math.pow(x-cx,2)/(2*p.w*p.w));
        x===cx-p.w*2?ctx.moveTo(x,bY-dy):ctx.lineTo(x,bY-dy);
      }
      ctx.stroke();
      ctx.font='8px monospace'; ctx.fillStyle=p.color; ctx.textAlign='center';
      ctx.fillText(p.label,cx,bY-ph-5); ctx.textAlign='left';
    });
    t+=0.02; requestAnimationFrame(drawSpectrum);
  }
  drawSpectrum();
}

/* ── COUNTER ANIMATION ───────────────────────────────────────── */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 1600;
    const start = performance.now();
    function update(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const val = (target * eased).toFixed(decimals);
      el.textContent = prefix + val + suffix;
      if (elapsed < 1) requestAnimationFrame(update);
    }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(update);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ── FORM HANDLING ───────────────────────────────────────────── */
function initForms() {
  document.querySelectorAll('.contact-form').forEach(form => {
    const requiredFields = Array.from(form.querySelectorAll('[required]'));
    const message = form.querySelector('#message');
    const messageError = form.querySelector('#messageError');
    const consent = form.querySelector('#consent');
    const consentError = form.querySelector('#consentError');
    const submitButton = form.querySelector('[type=submit]');
    const submitLabel = submitButton ? submitButton.innerHTML : '';

    function showFormAlert(options) {
      if (!window.Swal) return Promise.resolve();
      return Swal.fire({
        background: '#0A0B0F',
        color: '#EAECF5',
        buttonsStyling: false,
        confirmButtonText: 'Return to page',
        customClass: {
          popup: 'anika-swal',
          title: 'anika-swal-title',
          htmlContainer: 'anika-swal-text',
          actions: 'anika-swal-actions',
          confirmButton: 'anika-swal-confirm',
          cancelButton: 'anika-swal-cancel'
        },
        ...options
      });
    }

    function updateSubmitState() {
      if (!submitButton) return;
      const isReady = requiredFields.every(field => {
        if (field.type === 'checkbox') return field.checked;
        if (field === message) return field.value.trim().length >= 20;
        return field.checkValidity();
      });
      submitButton.disabled = !isReady;
    }

    function validateRequiredFields(showError = false) {
      let firstInvalid = null;
      requiredFields.forEach(field => {
        if (field.type === 'checkbox' || field === message) return;
        const isValid = field.checkValidity();
        field.classList.toggle('invalid', showError && !isValid);
        if (!isValid && !firstInvalid) firstInvalid = field;
      });
      updateSubmitState();
      return firstInvalid;
    }

    function validateMessage(showError = false) {
      if (!message || !messageError) return true;
      const isValid = message.value.trim().length >= 20;
      message.classList.toggle('invalid', showError && !isValid);
      messageError.classList.toggle('show', showError && !isValid);
      updateSubmitState();
      return isValid;
    }

    function validateConsent(showError = false) {
      if (!consent) return true;
      const isValid = consent.checked;
      consent.classList.toggle('invalid', showError && !isValid);
      if (consentError) consentError.classList.toggle('show', showError && !isValid);
      updateSubmitState();
      return isValid;
    }

    requiredFields.forEach(field => {
      if (field === message || field === consent) return;
      field.addEventListener('input', () => validateRequiredFields());
      field.addEventListener('change', () => validateRequiredFields());
    });

    if (message) {
      message.addEventListener('input', () => validateMessage());
    }

    if (consent) {
      consent.addEventListener('change', () => validateConsent());
      validateConsent();
    }

    updateSubmitState();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const firstInvalidField = validateRequiredFields(true);
      if (firstInvalidField) {
        firstInvalidField.focus();
        showFormAlert({
          icon: 'warning',
          title: 'Review form',
          text: 'Please fill all required fields before submitting the form.',
          confirmButtonText: 'Review form'
        });
        return;
      }
      if (!validateMessage(true)) {
        message.focus();
        showFormAlert({
          icon: 'warning',
          title: 'Review form',
          text: 'Message must be at least 20 characters.',
          confirmButtonText: 'Review form'
        });
        return;
      }
      if (!validateConsent(true)) {
        consent.focus();
        showFormAlert({
          icon: 'warning',
          title: 'Acknowledgement required',
          text: 'Please click the acknowledgement checkbox before submitting the form.',
          confirmButtonText: 'Review form'
        });
        return;
      }

      const btn = submitButton;
      const endpoint = form.dataset.endpoint || form.getAttribute('action');
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to submit the form. Please try again.');
        }

        if (window.Swal) {
          await showFormAlert({
            icon: 'success',
            title: 'Message received',
            text: 'Our team will respond within 24 hours.'
          });
        }

        const success = form.parentElement.querySelector('.form-success');
        if (success) {
          form.style.display = 'none';
          success.style.display = 'block';
        } else {
          form.reset();
          updateSubmitState();
        }
      } catch (error) {
        showFormAlert({
          icon: 'error',
          title: 'Message not sent',
          text: error.message || 'Please try again or email info@anikasterilis.com directly.',
          confirmButtonText: 'Try again'
        });
      } finally {
        if (submitLabel) btn.innerHTML = submitLabel;
        updateSubmitState();
        if (window.lucide) lucide.createIcons();
      }
    });
  });
}

/* ── SMOOTH ANCHOR SCROLL ────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 130;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});

/* ── TICKER SETUP ────────────────────────────────────────────── */
function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const items = ['DEFENSE','AVIATION SECURITY','NARCOTICS DETECTION','EXPLOSIVES','BORDER CONTROL',
    'HEALTHCARE DIAGNOSTICS','CBRNE','INDUSTRIAL SAFETY','TB SCREENING','FORENSICS',
    'CARGO INSPECTION','ENVIRONMENTAL MONITORING','ORDNANCE SAFETY','BREATH ANALYSIS',
    'PANDEMIC PREPAREDNESS','SMART CITY SECURITY','CRITICAL INFRASTRUCTURE'];
  const html = items.map(d =>
    `<span class="ticker-item">${d}</span><span class="ticker-dot"></span>`
  ).join('');
  track.innerHTML = html + html;
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initTicker();
  initIonCanvas('ionCanvas', 500);
  initSpectrumCanvas('spectrumCanvas');
  animateCounters();
  initForms();
});
