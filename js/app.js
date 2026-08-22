/**
 * EVELYN & YIMMY - NUESTRO MATRIMONIO
 * Core Application Logic (Countdown, Google Calendar, Audio Synthesizer, Navigation, Bank Modal)
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initAtmosphereParticles();
  initCountdown();
  initCalendarActions();
  initAudioPlayer();
  initNavigation();
  initBankModal();
  initScrollReveals();
  initChallengeUpload();
});

/* ==========================================================================
   0. THEME SWITCHER (🖤 Vogue • 🌿 Campestre • ✨ Clásico • 🌸 Florido)
   ========================================================================== */
let activeAtmosphereTheme = 'theme-vogue';

function initThemeSwitcher() {
  const themeBtns = document.querySelectorAll('.style-btn');
  const validThemes = ['theme-vogue', 'theme-campestre', 'theme-tradicional', 'theme-florido'];

  function applyTheme(themeName) {
    if (!validThemes.includes(themeName)) themeName = 'theme-vogue';

    validThemes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(themeName);
    activeAtmosphereTheme = themeName;

    themeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (window.resetAtmosphereParticles) {
      window.resetAtmosphereParticles(themeName);
    }

    try {
      localStorage.setItem('wedding_style_theme_v2', themeName);
    } catch (e) {
      console.warn('LocalStorage theme error:', e);
    }
  }

  // Load saved theme or default to theme-vogue
  let savedTheme = 'theme-vogue';
  try {
    savedTheme = localStorage.getItem('wedding_style_theme_v2') || 'theme-vogue';
  } catch (e) {}

  applyTheme(savedTheme);

  // Attach click events
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-theme');
      applyTheme(selected);
    });
  });
}

/* ==========================================================================
   0.1 ATMOSPHERIC PARTICLES ENGINE (Petals, Leaves, Gold Sparkles, Bokeh)
   ========================================================================== */
function initAtmosphereParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = window.innerWidth < 600 ? 18 : 32;
  let particles = [];

  class Particle {
    constructor(theme) {
      this.reset(theme, true);
    }

    reset(theme, initial = false) {
      this.theme = theme || activeAtmosphereTheme;
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 6;
      this.speedY = Math.random() * 1.2 + 0.6;
      this.speedX = Math.sin(Math.random() * Math.PI) * 0.8 - 0.4;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.03;
      this.opacity = Math.random() * 0.5 + 0.35;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = Math.random() * 0.03 + 0.01;

      // Type-specific tweaks
      if (this.theme === 'theme-tradicional') {
        this.y = initial ? Math.random() * height : height + 10;
        this.speedY = -(Math.random() * 0.8 + 0.4); // Sparkles rise up
        this.size = Math.random() * 3 + 2;
      } else if (this.theme === 'theme-vogue') {
        this.y = initial ? Math.random() * height : height + 20;
        this.speedY = -(Math.random() * 0.5 + 0.3); // Bokeh rises
        this.size = Math.random() * 12 + 6;
        this.opacity = Math.random() * 0.15 + 0.05;
      }
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.flip) * 0.5;
      this.rotation += this.rotSpeed;
      this.flip += this.flipSpeed;

      // Wrap-around bounds
      if (this.theme === 'theme-tradicional' || this.theme === 'theme-vogue') {
        if (this.y < -30) this.reset(this.theme, false);
      } else {
        if (this.y > height + 30) this.reset(this.theme, false);
      }

      if (this.x < -30) this.x = width + 20;
      if (this.x > width + 30) this.x = -20;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(Math.cos(this.flip), 1);
      ctx.globalAlpha = this.opacity;

      if (this.theme === 'theme-florido') {
        // Soft pink rose petal
        ctx.fillStyle = '#F7BAC4';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-this.size, -this.size * 0.6, -this.size * 0.6, -this.size * 1.5, 0, -this.size * 1.8);
        ctx.bezierCurveTo(this.size * 0.6, -this.size * 1.5, this.size, -this.size * 0.6, 0, 0);
        ctx.fill();
        ctx.fillStyle = '#D47B8B';
        ctx.globalAlpha = this.opacity * 0.4;
        ctx.fill();
      } else if (this.theme === 'theme-campestre') {
        // Green Eucalyptus/Olive leaf
        ctx.fillStyle = '#8BAE88';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.45, this.size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#527A50';
        ctx.globalAlpha = this.opacity * 0.6;
        ctx.fill();
      } else if (this.theme === 'theme-tradicional') {
        // Golden royal star sparkle
        ctx.fillStyle = '#D4AF37';
        ctx.shadowColor = '#F5E6B3';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Vogue luxury bokeh
        ctx.fillStyle = '#C5A059';
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function setupParticles(theme) {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(theme));
    }
  }

  window.resetAtmosphereParticles = function (theme) {
    setupParticles(theme);
  };

  setupParticles(activeAtmosphereTheme);

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  }

  loop();
}

/* ==========================================================================
   1. COUNTDOWN TIMER (November 21, 2026 at 11:00 AM Santiago)
   ========================================================================== */
function initCountdown() {
  const weddingDate = new Date('2026-11-21T11:00:00-03:00').getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (!daysEl) return;

  function update() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance < 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   2. GOOGLE CALENDAR INTEGRATION
   ========================================================================== */
function initCalendarActions() {
  const googleBtns = [
    document.getElementById('btn-google-cal'),
    document.getElementById('btn-google-cal-hero')
  ];

  const title = encodeURIComponent("Matrimonio Evelyn López & Yimmy Salgado 💍");
  const details = encodeURIComponent("¡Celebración del matrimonio de Evelyn y Yimmy en Casa Pirque! Dress Code: Campestre Elegante. Recuerda traer tu manta para instalarte en el césped 🧺🌿.");
  const location = encodeURIComponent("Casa Pirque, Pirque, Región Metropolitana, Chile");
  const startIso = "20261121T140000Z";
  const endIso = "20261122T040000Z";

  googleBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
        window.open(url, '_blank');
      });
    }
  });
}

/* ==========================================================================
   3. ROMANTIC AMBIENT AUDIO SYNTHESIZER
   ========================================================================== */
function initAudioPlayer() {
  const musicToggle = document.getElementById('btn-music-toggle');
  if (!musicToggle) return;

  let audioCtx = null;
  let isPlaying = false;
  let synthInterval = null;

  const notes = [
    261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63,
    293.66, 369.99, 440.00, 587.33, 440.00, 369.99, 329.63
  ];
  let noteIndex = 0;

  function playAmbientNote() {
    if (!audioCtx || !isPlaying) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[noteIndex % notes.length], audioCtx.currentTime);
      noteIndex++;

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 2.6);
    } catch (err) {
      console.warn('Audio note error:', err);
    }
  }

  musicToggle.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      isPlaying = false;
      musicToggle.classList.remove('playing');
      clearInterval(synthInterval);
    } else {
      isPlaying = true;
      musicToggle.classList.add('playing');
      playAmbientNote();
      synthInterval = setInterval(playAmbientNote, 2200);
    }
  });
}

/* ==========================================================================
   4. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const toggleBtn = document.getElementById('btn-mobile-toggle');
  const closeBtn = document.getElementById('btn-mobile-close');
  const drawer = document.getElementById('mobile-drawer');
  const drawerLinks = document.querySelectorAll('.drawer-link, .drawer-cta');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => drawer.classList.add('active'));
  }
  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => drawer.classList.remove('active'));
  }
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => drawer && drawer.classList.remove('active'));
  });
}

/* ==========================================================================
   5. BANK MODAL & COPY DATA
   ========================================================================== */
function initBankModal() {
  const showBtn = document.getElementById('btn-show-bank');
  const modal = document.getElementById('bank-modal');
  const closeBtn = document.getElementById('btn-close-bank');
  const copyBtn = document.getElementById('btn-copy-bank-data');

  if (showBtn && modal) {
    showBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const textToCopy = `DATOS DE TRANSFERENCIA MATRIMONIO EVELYN & YIMMY\nTitulares: Evelyn López & Yimmy Salgado\nRUT: 12.345.678-9\nBanco: Banco de Chile\nTipo de Cuenta: Cuenta Corriente\nN°: 00-123-45678-90\nEmail: boda.evelyn.yimmy@gmail.com`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.innerHTML = '<i class="ri-check-line"></i> ¡Datos Copiados!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="ri-file-copy-line"></i> Copiar Datos';
        }, 3000);
      });
    });
  }
}

/* ==========================================================================
   6. PHOTO CHALLENGE UPLOAD BUTTON
   ========================================================================== */
function initChallengeUpload() {
  const btn = document.getElementById('btn-challenge-upload');
  const fileInput = document.getElementById('photo-file-input');
  if (btn && fileInput) {
    btn.addEventListener('click', () => fileInput.click());
  }
}

/* ==========================================================================
   7. SCROLL REVEAL (IntersectionObserver)
   ========================================================================== */
function initScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));
}
