/**
 * EVELYN & YIMMY - WEDDING INVITATION
 * Main Application Logic (Countdown, Calendar, Ambient Music, Navigation)
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initCalendarAction();
  initAudioPlayer();
  initNavigation();
  initScrollAnimations();
});

/* ==========================================================================
   1. COUNTDOWN TIMER
   Wedding Date: November 21, 2026 at 11:00 AM (America/Santiago)
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
   2. CALENDAR INTEGRATION (Google Calendar & iCal / Outlook .ics)
   ========================================================================== */
function initCalendarAction() {
  const googleBtn = document.getElementById('btn-google-calendar');
  const icsBtn = document.getElementById('btn-download-ics');

  const title = encodeURIComponent("Matrimonio Evelyn López & Yimmy Salgado 💍✨");
  const details = encodeURIComponent("¡Acompáñanos a celebrar nuestro matrimonio! Recuerda que habrá una instancia para estar en el pasto, ¡trae tu manta favorita! 🧺🌿 Lista de novios: https://milistadenovios.cl/lista/40226");
  const location = encodeURIComponent("Casa Pirque, Pirque, Región Metropolitana, Chile");
  
  // Format dates: 20261121T140000Z to 20261122T000000Z (11:00 to 21:00 CLST is UTC-3 => 14:00 to 00:00 UTC)
  const startIso = "20261121T140000Z";
  const endIso = "20261122T000000Z";

  if (googleBtn) {
    googleBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    googleBtn.target = "_blank";
  }

  if (icsBtn) {
    icsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateIcsFile();
    });
  }
}

function generateIcsFile() {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Evelyn & Yimmy//Boda 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:boda-evelyn-yimmy-20261121@casapirque.cl",
    "DTSTAMP:20260101T000000Z",
    "DTSTART:20261121T140000Z",
    "DTEND:20261122T000000Z",
    "SUMMARY:Matrimonio Evelyn López & Yimmy Salgado",
    "DESCRIPTION:¡Celebración de Matrimonio de Evelyn y Yimmy en Casa Pirque! Recuerda llevar tu manta para el momento especial en el pasto. Lista de novios: https://milistadenovios.cl/lista/40226",
    "LOCATION:Casa Pirque, Pirque, Región Metropolitana, Chile",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Matrimonio_Evelyn_y_Yimmy.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================================
   3. ROMANTIC BACKGROUND AMBIENT SOUND (Web Audio API Romantic Melodies)
   Generates a soft, romantic harp/piano arpeggio chord progression
   ========================================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let melodyInterval = null;

function initAudioPlayer() {
  const musicBtn = document.getElementById('btn-music-toggle');
  if (!musicBtn) return;

  musicBtn.addEventListener('click', () => {
    toggleMusic(musicBtn);
  });
}

function toggleMusic(btn) {
  if (!isAudioPlaying) {
    startRomanticMusic();
    btn.classList.add('playing');
    btn.innerHTML = `<i class="ri-volume-vibrate-line" style="font-size: 1.4rem;"></i>`;
    btn.setAttribute('title', 'Pausar música');
    isAudioPlaying = true;
  } else {
    stopRomanticMusic();
    btn.classList.remove('playing');
    btn.innerHTML = `<i class="ri-music-2-line" style="font-size: 1.4rem;"></i>`;
    btn.setAttribute('title', 'Reproducir música');
    isAudioPlaying = false;
  }
}

function startRomanticMusic() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Romantic arpeggio chords in D Major / B Minor
  const chords = [
    [293.66, 369.99, 440.00, 587.33], // D Major (D4, F#4, A4, D5)
    [220.00, 277.18, 329.63, 440.00], // A Major (A3, C#4, E4, A4)
    [246.94, 293.66, 369.99, 493.88], // B Minor (B3, D4, F#4, B4)
    [196.00, 246.94, 293.66, 392.00]  // G Major (G3, B3, D4, G4)
  ];

  let chordIndex = 0;
  let noteInChord = 0;

  function playNote(freq, duration = 1.6) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Soft sine with slight triangle richness
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Gentle envelope (soft attack, slow decay)
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  melodyInterval = setInterval(() => {
    const currentChord = chords[chordIndex];
    playNote(currentChord[noteInChord]);

    noteInChord++;
    if (noteInChord >= currentChord.length) {
      noteInChord = 0;
      chordIndex = (chordIndex + 1) % chords.length;
    }
  }, 480);
}

function stopRomanticMusic() {
  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }
}

/* ==========================================================================
   4. NAVIGATION & MOBILE MENU DRAWER
   ========================================================================== */
function initNavigation() {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const drawer = document.getElementById('mobile-menu-drawer');
  const links = document.querySelectorAll('.nav-link, .mobile-link');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        if (drawer.classList.contains('open')) {
          icon.className = 'ri-close-line';
        } else {
          icon.className = 'ri-menu-line';
        }
      }
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        const icon = toggleBtn.querySelector('i');
        if (icon) icon.className = 'ri-menu-line';
      });
    });
  }
}

/* ==========================================================================
   5. SCROLL OBSERVER / MICRO-ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, observerOptions);

  document.querySelectorAll('section, .boarding-pass-card, .dresscode-card, .calendar-card').forEach(el => {
    observer.observe(el);
  });
}
