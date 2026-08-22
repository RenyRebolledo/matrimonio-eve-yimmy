/**
 * EVELYN & YIMMY - NUESTRO MATRIMONIO
 * Core Application Logic (Countdown, Google Calendar, Audio Synthesizer, Navigation, Bank Modal)
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
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
function initThemeSwitcher() {
  const themeBtns = document.querySelectorAll('.style-btn');
  const validThemes = ['theme-vogue', 'theme-campestre', 'theme-tradicional', 'theme-florido'];

  function applyTheme(themeName) {
    if (!validThemes.includes(themeName)) themeName = 'theme-vogue';

    validThemes.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(themeName);

    themeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

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
