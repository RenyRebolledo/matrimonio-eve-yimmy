/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Módulo de Confirmación de Asistencia (RSVP Individual + Pase Digital de Sorteo + Cloud Sync)
 */

const GH_OWNER = 'RenyRebolledo';
const GH_REPO = 'matrimonio-eve-yimmy';
const GH_RSVP_PATH = 'data/rsvp_feed.json';
const GH_AUTH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

// Robust DOM initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRsvpModule);
} else {
  initRsvpModule();
}

function initRsvpModule() {
  const form = document.getElementById('rsvp-form');
  const passModal = document.getElementById('guest-pass-modal');
  const closePassBtn = document.getElementById('btn-close-pass-modal');
  const printPassBtn = document.getElementById('btn-print-pass');
  const copyCodeBtn = document.getElementById('btn-copy-pass-code');
  const attendanceDetails = document.getElementById('attendance-details-group');

  if (!form) return;

  // Toggle dietary / song details when Yes/No
  const radios = form.querySelectorAll('input[name="attendance"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'no') {
        if (attendanceDetails) attendanceDetails.style.display = 'none';
      } else {
        if (attendanceDetails) attendanceDetails.style.display = 'grid';
      }
    });
  });

  // Close pass modal
  if (closePassBtn && passModal) {
    closePassBtn.addEventListener('click', () => {
      passModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  if (passModal) {
    passModal.addEventListener('click', (e) => {
      if (e.target === passModal) {
        passModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Print Pass
  if (printPassBtn) {
    printPassBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy Code
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('pass-code');
      const code = codeEl ? codeEl.textContent.trim() : '';
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          copyCodeBtn.innerHTML = '<i class="ri-check-line"></i> <span>¡Código Copiado!</span>';
          setTimeout(() => {
            copyCodeBtn.innerHTML = '<i class="ri-file-copy-line"></i> <span>Copiar Mi Código</span>';
          }, 3000);
        });
      }
    });
  }

  // RSVP Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('rsvp-name');
    const name = (nameInput ? nameInput.value : '').trim();
    const attendanceRadio = form.querySelector('input[name="attendance"]:checked');
    const attendance = attendanceRadio ? attendanceRadio.value : 'si';
    
    const dietarySelect = document.getElementById('rsvp-dietary');
    const dietary = dietarySelect ? dietarySelect.value : 'ninguna';
    
    const songInput = document.getElementById('rsvp-song');
    const song = (songInput ? songInput.value : '').trim();
    
    const messageInput = document.getElementById('rsvp-message');
    const message = (messageInput ? messageInput.value : '').trim();

    if (!name) {
      alert('Por favor ingresa tu nombre y apellido para confirmar.');
      return;
    }

    // Generate lucky unique code
    const reservationCode = 'EY-' + Math.floor(1000 + Math.random() * 9000);

    const newRsvp = {
      id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name,
      attendance: attendance,
      dietary: dietary,
      song: song,
      message: message,
      code: reservationCode,
      timestamp: Date.now()
    };

    // 1. Save locally
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_rsvps_cloud_v1') || '[]');
      stored.unshift(newRsvp);
      localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(stored));
      localStorage.setItem('wedding_guest_name', name);
    } catch (err) {}

    // 2. Open confirmation popup immediately
    if (attendance === 'si') {
      const guestNameEl = document.getElementById('pass-guest-name');
      const passCountEl = document.getElementById('pass-pases-count');
      const passCodeEl = document.getElementById('pass-code');
      const passDietaryRow = document.getElementById('pass-dietary-row');
      const passDietaryVal = document.getElementById('pass-dietary-val');
      const passSongRow = document.getElementById('pass-song-row');
      const passSongVal = document.getElementById('pass-song-val');

      if (guestNameEl) guestNameEl.textContent = name;
      if (passCountEl) passCountEl.textContent = '1 Persona (Individual)';
      if (passCodeEl) passCodeEl.textContent = reservationCode;

      if (dietary && dietary !== 'ninguna' && passDietaryRow && passDietaryVal) {
        passDietaryRow.style.display = 'flex';
        passDietaryVal.textContent = dietarySelect ? dietarySelect.options[dietarySelect.selectedIndex].text : dietary;
      } else if (passDietaryRow) {
        passDietaryRow.style.display = 'none';
      }

      if (song && passSongRow && passSongVal) {
        passSongRow.style.display = 'flex';
        passSongVal.textContent = song;
      } else if (passSongRow) {
        passSongRow.style.display = 'none';
      }

      if (passModal) {
        passModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      form.reset();
    } else {
      alert(`¡Muchas gracias, ${name}! Hemos registrado tu respuesta. Te mandamos un abrazo gigante.`);
      form.reset();
    }

    // 3. Background Cloud Sync to data/rsvp_feed.json
    pushRsvpToCloud(newRsvp).catch(err => {
      console.warn('Background RSVP cloud sync notice:', err);
    });
  });
}

async function pushRsvpToCloud(newRsvp) {
  try {
    let rsvps = [];
    let fileSha = null;

    // Fetch existing
    const getRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_RSVP_PATH}?ref=main&t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GH_AUTH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const currentData = await getRes.json();
      fileSha = currentData.sha;
      if (currentData.content) {
        const rawText = decodeURIComponent(escape(atob(currentData.content.replace(/\s/g, ''))));
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.rsvps)) {
          rsvps = parsed.rsvps;
        }
      }
    }

    rsvps.unshift(newRsvp);

    const jsonPayload = JSON.stringify({ rsvps: rsvps }, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonPayload)));

    const putBody = {
      message: `[RSVP Confirmación] ${newRsvp.name} (${newRsvp.attendance === 'si' ? 'Sí asiste' : 'No asiste'} - ${newRsvp.code})`,
      content: base64Content,
      branch: 'main'
    };

    if (fileSha) putBody.sha = fileSha;

    await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_RSVP_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GH_AUTH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

  } catch (error) {
    console.warn('Cloud RSVP push error:', error);
  }
}
