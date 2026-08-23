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
   0. ESTILO VISUAL: CAMPESTRE RÚSTICO & BOTÁNICO (Estilo Oficial Elegido)
   ========================================================================== */
let activeAtmosphereTheme = 'theme-campestre';

function initThemeSwitcher() {
  document.body.classList.remove('theme-vogue', 'theme-tradicional', 'theme-florido');
  document.body.classList.add('theme-campestre');
  activeAtmosphereTheme = 'theme-campestre';
  if (window.resetAtmosphereParticles) {
    window.resetAtmosphereParticles('theme-campestre');
  }
}

/* ==========================================================================
   0.1 ATMOSPHERIC PARTICLES ENGINE (Eucalyptus Leaves & Nature)
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

  class AtmosphereParticle {
    constructor(theme) {
      this.reset(theme, true);
    }

    reset(theme, initial = false) {
      this.theme = theme;
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 6;
      this.speedY = Math.random() * 0.8 + 0.5;
      this.speedX = Math.sin(Math.random() * Math.PI * 2) * 0.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.03;
      this.opacity = Math.random() * 0.45 + 0.35;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = Math.random() * 0.02 + 0.01;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.015) * 0.4;
      this.rotation += this.rotSpeed;
      this.flip += this.flipSpeed;

      if (this.y > height + 30) this.reset(this.theme, false);
      if (this.x < -30) this.x = width + 20;
      if (this.x > width + 30) this.x = -20;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(Math.cos(this.flip), 1);
      ctx.globalAlpha = this.opacity;

      // Green Eucalyptus/Olive leaf for Campestre theme
      ctx.fillStyle = '#8BAE88';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.45, this.size * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#527A50';
      ctx.globalAlpha = this.opacity * 0.6;
      ctx.fill();

      ctx.restore();
    }
  }

  function setupParticles(theme) {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new AtmosphereParticle(theme));
    }
  }

  window.resetAtmosphereParticles = function (theme) {
    setupParticles(theme);
  };

  setupParticles('theme-campestre');

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
   1. COUNTDOWN TIMER (November 21, 2026 at 11:30 AM Santiago)
   ========================================================================== */
function initCountdown() {
  const weddingDate = new Date('2026-11-21T11:30:00-03:00').getTime();

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
   2. CALENDAR INTEGRATIONS (Google Calendar & iPhone / Apple Calendar .ics)
   ========================================================================== */
function initCalendarActions() {
  const googleBtns = [
    document.getElementById('btn-google-cal'),
    document.getElementById('btn-google-cal-hero')
  ];

  const appleBtns = [
    document.getElementById('btn-apple-cal'),
    document.getElementById('btn-apple-cal-hero')
  ];

  const title = encodeURIComponent("Matrimonio Evelyn López & Yimmy Salgado 💍");
  const details = encodeURIComponent("¡Celebración del matrimonio de Evelyn y Yimmy en Casa Pirque! Dress Code: Campestre Elegante. Recuerda traer tu manta para instalarte en el césped 🧺🌿.");
  const location = encodeURIComponent("Casa Pirque, Pirque, Región Metropolitana, Chile");
  const startIso = "20261121T143000Z";
  const endIso = "20261122T040000Z";

  // Google Calendar
  googleBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
        window.open(url, '_blank');
      });
    }
  });

  // Apple Calendar (.ics) for iPhone, iPad, Mac
  appleBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        downloadAppleIcsCalendar();
      });
    }
  });
}

function downloadAppleIcsCalendar() {
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Evelyn & Yimmy//Matrimonio 2026//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:boda-evelyn-yimmy-20261121@casapirque',
    'SUMMARY:💍 Matrimonio Evelyn López & Yimmy Salgado',
    'DESCRIPTION:¡Celebración de nuestro matrimonio en Casa Pirque! Dress Code: Campestre Elegante. Recuerda traer tu manta para el momento pasto 🧺🌿.',
    'LOCATION:Casa Pirque, Pirque, Región Metropolitana, Chile',
    'DTSTART:20261121T143000Z',
    'DTEND:20261122T040000Z',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Matrimonio_Evelyn_y_Yimmy.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      const textToCopy = `DATOS DE TRANSFERENCIA DIRECTA MATRIMONIO EVELYN & YIMMY\nBanco: BancoEstado\nTipo de Cuenta: Cuenta Vista\nN° de Cuenta: 15789104\nRUT: 15.789.104-9\nTitular: Yimmy Salgado\nEmail: Yimsalgado@gmail.com`;
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
