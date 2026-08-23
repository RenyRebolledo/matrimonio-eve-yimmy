/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Módulo de Confirmación de Asistencia (RSVP)
 * - Bloqueo de confirmaciones duplicadas (los confirmados no pueden volver a confirmar)
 * - Soporte para Invitaciones Personalizadas con bloques individuales por invitado
 * - Pase de Entrada Digital Oficial
 */

(function() {
  const RSVP_GH_OWNER = 'RenyRebolledo';
  const RSVP_GH_REPO = 'matrimonio-eve-yimmy';
  const RSVP_GH_PATH = 'data/rsvp_feed.json';
  const RSVP_GH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

  let invitationData = null;
  let existingConfirmation = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRsvpModule);
  } else {
    initRsvpModule();
  }

  async function initRsvpModule() {
    const form = document.getElementById('rsvp-form');
    const passModal = document.getElementById('guest-pass-modal');
    const closePassBtn = document.getElementById('btn-close-pass-modal');
    const printPassBtn = document.getElementById('btn-print-pass');
    const copyCodeBtn = document.getElementById('btn-copy-pass-code');
    const attendanceDetails1 = document.getElementById('attendance-details-group');
    const attendanceDetails2 = document.getElementById('attendance-details-group-2');

    // 1. Check for URL parameters (?p=2&n1=...&n2=...&code=...)
    checkUrlInvitationParams();

    // 2. Check if already confirmed in cloud or local storage
    await checkAlreadyConfirmedStatus();

    if (!form) return;

    // Toggle details for Guest 1 when Yes/No
    const radios1 = form.querySelectorAll('input[name="attendance"]');
    radios1.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (attendanceDetails1) {
          attendanceDetails1.style.display = e.target.value === 'no' ? 'none' : 'grid';
        }
      });
    });

    // Toggle details for Guest 2 when Yes/No
    const radios2 = form.querySelectorAll('input[name="attendance_2"]');
    radios2.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (attendanceDetails2) {
          attendanceDetails2.style.display = e.target.value === 'no' ? 'none' : 'grid';
        }
      });
    });

    // Close pass modal
    if (closePassBtn && passModal) {
      closePassBtn.addEventListener('click', () => {
        passModal.classList.remove('active');
        passModal.style.display = 'none';
        document.body.style.overflow = '';
      });
    }

    if (passModal) {
      passModal.addEventListener('click', (e) => {
        if (e.target === passModal) {
          passModal.classList.remove('active');
          passModal.style.display = 'none';
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

    // Form submit listener
    form.addEventListener('submit', handleRsvpSubmit);
  }

  function checkUrlInvitationParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const pases = parseInt(urlParams.get('p') || '1', 10);
    const name1 = urlParams.get('n1');
    const name2 = urlParams.get('n2');
    const code = urlParams.get('code');

    if (!name1) return; // Standard generic visit

    invitationData = {
      pases: pases,
      name1: name1,
      name2: name2 || '',
      code: code || ''
    };

    // Show Personalized Badge
    const badge = document.getElementById('personalized-invitation-badge');
    const badgeNames = document.getElementById('badge-guest-names');
    const badgeInfo = document.getElementById('badge-passes-info');

    if (badge && badgeNames) {
      badgeNames.textContent = name2 ? `${name1} & ${name2}` : name1;
      if (badgeInfo) {
        badgeInfo.textContent = pases === 2 ? '✨ Pase especial reservado para 2 Personas' : '✨ Pase individual reservado para 1 Persona';
      }
      badge.style.display = 'flex';
    }

    // Pre-fill Name 1
    const nameInput1 = document.getElementById('rsvp-name');
    const heading1 = document.getElementById('heading-guest-1');
    const lblName1 = document.getElementById('lbl-rsvp-name');
    const lblAtt1 = document.getElementById('lbl-attendance-1');
    const lblSong1 = document.getElementById('lbl-rsvp-song');

    if (nameInput1) nameInput1.value = name1;
    if (heading1) heading1.textContent = `Primer Invitado: ${name1}`;
    if (lblName1) lblName1.textContent = `Nombre y Apellido (Invitado 1: ${name1}) *`;
    if (lblAtt1) lblAtt1.textContent = `¿Tú (${name1}) nos acompañarás? *`;
    if (lblSong1) lblSong1.textContent = `Canción que sugiere ${name1}`;

    // If 2 passes, show and pre-fill Guest 2 container
    if (pases === 2) {
      const g2Container = document.getElementById('guest-2-container');
      const nameInput2 = document.getElementById('rsvp-name-2');
      const heading2 = document.getElementById('heading-guest-2');
      const lblName2 = document.getElementById('lbl-rsvp-name-2');
      const lblAtt2 = document.getElementById('lbl-attendance-2');
      const lblSong2 = document.querySelector('label[for="rsvp-song-2"]');
      const lblMessage = document.getElementById('lbl-rsvp-message');

      if (g2Container) g2Container.style.display = 'block';
      if (nameInput2 && name2) nameInput2.value = name2;
      if (heading2) heading2.textContent = name2 ? `Segundo Invitado: ${name2}` : 'Segundo Invitado (Acompañante)';
      if (lblName2) lblName2.textContent = name2 ? `Nombre y Apellido (Invitado 2: ${name2}) *` : 'Nombre y Apellido del Acompañante *';
      if (lblAtt2) lblAtt2.textContent = name2 ? `¿Tú (${name2}) nos acompañarás?` : '¿Tu acompañante asistirá?';
      if (lblSong2) lblSong2.textContent = name2 ? `Canción que sugiere ${name2}` : 'Canción que sugiere tu acompañante';
      if (lblMessage) lblMessage.textContent = name2 ? `Un mensaje o dedicatoria para nosotros (de parte de ${name1} y ${name2})` : 'Un mensaje o dedicatoria para nosotros (de parte de ustedes)';
    }
  }

  async function checkAlreadyConfirmedStatus() {
    let rsvps = [];
    try {
      const stored = localStorage.getItem('wedding_rsvps_cloud_v1');
      if (stored) rsvps = JSON.parse(stored);
    } catch (e) {}

    // Fetch cloud rsvps
    try {
      const getRes = await fetch(`https://api.github.com/repos/${RSVP_GH_OWNER}/${RSVP_GH_REPO}/contents/${RSVP_GH_PATH}?ref=main&t=${Date.now()}`, {
        headers: {
          'Authorization': `token ${RSVP_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const currentData = await getRes.json();
        if (currentData.content) {
          const rawText = decodeURIComponent(escape(atob(currentData.content.replace(/\s/g, ''))));
          const parsed = JSON.parse(rawText);
          if (parsed && Array.isArray(parsed.rsvps)) {
            rsvps = parsed.rsvps;
            try {
              localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(rsvps));
            } catch (err) {}
          }
        }
      }
    } catch (e) {}

    if (rsvps.length === 0) return;

    // Search for match
    let match = null;

    if (invitationData) {
      match = rsvps.find(r => {
        if (invitationData.code && r.invCode === invitationData.code) return true;
        return false;
      });
    } else {
      // Check local cache for generic visit (unlinked)
      const localCode = localStorage.getItem('wedding_confirmed_generic_code');
      if (localCode) {
        match = rsvps.find(r => r.code === localCode);
      }
    }

    if (match) {
      existingConfirmation = match;
      renderAlreadyConfirmedUI(match);
    }
  }

  function renderAlreadyConfirmedUI(conf) {
    const form = document.getElementById('rsvp-form');
    if (!form) return;

    const displayName = conf.name2 ? `${conf.name} & ${conf.name2}` : conf.name;
    const isYes = conf.attendance === 'si';
    const pasesCount = conf.pasesCount || (conf.name2 ? 2 : 1);

    form.innerHTML = `
      <div class="rsvp-already-confirmed-box" style="text-align: center; padding: 2rem 1.4rem; background: rgba(82, 122, 80, 0.08); border: 2px solid var(--gold-primary); border-radius: var(--border-radius-card);">
        <div style="font-size: 3.2rem; color: #27ae60; line-height: 1; margin-bottom: 0.8rem;">
          <i class="ri-checkbox-circle-fill"></i>
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--text-main); margin-bottom: 0.4rem;">
          ¡Tu Asistencia ya está Confirmada!
        </h3>
        <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 1.4rem; line-height: 1.5;">
          ${isYes ? 'Ya tenemos registrada tu confirmación oficial para celebrar juntos en Casa Pirque.' : 'Tenemos registrado que no podrás acompañarnos. ¡Te mandamos un abrazo gigante!'}
        </p>

        <div style="background: var(--bg-surface); border: 1px dashed var(--border-gold); padding: 1.1rem 1.2rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left; font-size: 0.84rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between;"><strong style="color: var(--text-muted);">Invitado(s):</strong> <span style="font-weight: 700; color: var(--text-main);">${escapeHtml(displayName)}</span></div>
          <div style="display: flex; justify-content: space-between;"><strong style="color: var(--text-muted);">Estado:</strong> <span style="color: ${isYes ? '#27ae60' : '#e74c3c'}; font-weight: 700;">${isYes ? '✓ Confirmado (Asiste)' : '✗ No Asiste'}</span></div>
          ${isYes ? `<div style="display: flex; justify-content: space-between;"><strong style="color: var(--text-muted);">Pase(s):</strong> <span style="font-weight: 700;">${pasesCount} Persona${pasesCount > 1 ? 's' : ''}</span></div>` : ''}
          ${isYes ? `<div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(28,27,26,0.15); padding-top: 0.4rem;"><strong style="color: var(--gold-dark);">Código de Sorteo:</strong> <span class="code-mono" style="font-weight: 800; font-size: 1.05rem; color: var(--gold-dark);">${escapeHtml(conf.code || 'EY-2026')}</span></div>` : ''}
        </div>

        ${isYes ? `
          <button type="button" class="btn-vogue-gold" id="btn-reopen-confirmed-pass" style="width: 100%;">
            <i class="ri-ticket-2-line"></i>
            <span>Ver / Guardar Mi Pase Digital</span>
          </button>
        ` : ''}
      </div>
    `;

    const reopenBtn = document.getElementById('btn-reopen-confirmed-pass');
    if (reopenBtn) {
      reopenBtn.addEventListener('click', () => {
        openDigitalPass(conf);
      });
    }
  }

  function openDigitalPass(conf) {
    const passModal = document.getElementById('guest-pass-modal');
    const guestNameEl = document.getElementById('pass-guest-name');
    const passCountEl = document.getElementById('pass-pases-count');
    const passCodeEl = document.getElementById('pass-code');
    const passDietaryRow = document.getElementById('pass-dietary-row');
    const passDietaryVal = document.getElementById('pass-dietary-val');
    const passSongRow = document.getElementById('pass-song-row');
    const passSongVal = document.getElementById('pass-song-val');

    const displayName = conf.name2 ? `${conf.name} & ${conf.name2}` : conf.name;
    const pasesCount = conf.pasesCount || (conf.name2 ? 2 : 1);

    if (guestNameEl) guestNameEl.textContent = displayName;
    if (passCountEl) passCountEl.textContent = `${pasesCount} Persona${pasesCount > 1 ? 's' : ''}`;
    if (passCodeEl) passCodeEl.textContent = conf.code || 'EY-2026';

    // Dieta display
    let dietarySummary = [];
    if (conf.dietary && conf.dietary !== 'ninguna') dietarySummary.push(`${conf.name}: ${conf.dietary}`);
    if (conf.name2 && conf.dietary2 && conf.dietary2 !== 'ninguna') dietarySummary.push(`${conf.name2}: ${conf.dietary2}`);

    if (dietarySummary.length > 0 && passDietaryRow && passDietaryVal) {
      passDietaryRow.style.display = 'flex';
      passDietaryVal.textContent = dietarySummary.join(' | ');
    } else if (passDietaryRow) {
      passDietaryRow.style.display = 'none';
    }

    // Songs display
    let songsSummary = [];
    if (conf.song) songsSummary.push(conf.name2 && conf.song2 ? `${conf.name}: "${conf.song}"` : `"${conf.song}"`);
    if (conf.name2 && conf.song2) songsSummary.push(`${conf.name2}: "${conf.song2}"`);

    if (songsSummary.length > 0 && passSongRow && passSongVal) {
      passSongRow.style.display = 'flex';
      passSongVal.textContent = songsSummary.join(' • ');
    } else if (passSongRow) {
      passSongRow.style.display = 'none';
    }

    if (passModal) {
      passModal.classList.add('active');
      passModal.style.display = 'flex';
      passModal.style.opacity = '1';
      passModal.style.pointerEvents = 'auto';
      document.body.style.overflow = 'hidden';
    }
  }

  // Global submit handler
  window.handleRsvpSubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (existingConfirmation) {
      alert('Tu asistencia ya se encuentra confirmada. Puedes ver tu pase de entrada directamente.');
      openDigitalPass(existingConfirmation);
      return false;
    }

    const form = document.getElementById('rsvp-form');
    if (!form) return false;

    // Guest 1 data
    const nameInput = document.getElementById('rsvp-name');
    const name1 = (nameInput ? nameInput.value : '').trim();
    const attendanceRadio1 = form.querySelector('input[name="attendance"]:checked');
    const attendance1 = attendanceRadio1 ? attendanceRadio1.value : 'si';
    const dietarySelect1 = document.getElementById('rsvp-dietary');
    const dietary1 = dietarySelect1 ? dietarySelect1.value : 'ninguna';
    const songInput1 = document.getElementById('rsvp-song');
    const song1 = (songInput1 ? songInput1.value : '').trim();

    // Guest 2 data (if 2 passes)
    const isTwoPasses = invitationData && invitationData.pases === 2;
    const nameInput2 = document.getElementById('rsvp-name-2');
    const name2 = isTwoPasses && nameInput2 ? (nameInput2.value || '').trim() : '';
    const attendanceRadio2 = form.querySelector('input[name="attendance_2"]:checked');
    const attendance2 = isTwoPasses && attendanceRadio2 ? attendanceRadio2.value : 'no';
    const dietarySelect2 = document.getElementById('rsvp-dietary-2');
    const dietary2 = isTwoPasses && dietarySelect2 ? dietarySelect2.value : 'ninguna';
    const songInput2 = document.getElementById('rsvp-song-2');
    const song2 = isTwoPasses && songInput2 ? (songInput2.value || '').trim() : '';

    // Shared message
    const messageInput = document.getElementById('rsvp-message');
    const message = (messageInput ? messageInput.value : '').trim();

    if (!name1) {
      alert('Por favor ingresa tu nombre y apellido para confirmar.');
      if (nameInput) nameInput.focus();
      return false;
    }

    if (isTwoPasses && !name2) {
      alert('Por favor ingresa el nombre de tu acompañante.');
      if (nameInput2) nameInput2.focus();
      return false;
    }

    // Determine total confirmed attendees
    let confirmedCount = 0;
    if (attendance1 === 'si') confirmedCount++;
    if (isTwoPasses && attendance2 === 'si') confirmedCount++;

    const isAnyAttending = (attendance1 === 'si') || (isTwoPasses && attendance2 === 'si');

    // Generate unique lucky raffle code
    const reservationCode = 'EY-' + Math.floor(1000 + Math.random() * 9000);
    const displayName = (isTwoPasses && name2) ? `${name1} & ${name2}` : name1;

    const newRsvp = {
      id: 'rsvp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name1,
      name2: isTwoPasses ? name2 : '',
      pasesCount: confirmedCount,
      attendance: isAnyAttending ? 'si' : 'no',
      attendance1: attendance1,
      attendance2: attendance2,
      dietary: dietary1,
      dietary2: isTwoPasses ? dietary2 : '',
      song: song1,
      song2: isTwoPasses ? song2 : '',
      message: message,
      code: reservationCode,
      invCode: invitationData ? invitationData.code : '',
      timestamp: Date.now()
    };

    existingConfirmation = newRsvp;

    // 1. Save locally
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_rsvps_cloud_v1') || '[]');
      stored.unshift(newRsvp);
      localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(stored));
      localStorage.setItem('wedding_guest_name', displayName);
    } catch (err) {}

    // 2. Open confirmation pass modal IMMEDIATELY if at least one is attending
    if (isAnyAttending) {
      openDigitalPass(newRsvp);
      // Switch form to confirmed state
      renderAlreadyConfirmedUI(newRsvp);
    } else {
      alert(`¡Muchas gracias, ${displayName}! Hemos registrado tu respuesta. Te mandamos un abrazo gigante.`);
      renderAlreadyConfirmedUI(newRsvp);
    }

    // 3. Background Cloud Sync to data/rsvp_feed.json
    pushRsvpToCloud(newRsvp).catch(err => {
      console.warn('Background RSVP cloud sync notice:', err);
    });

    return false;
  };

  async function pushRsvpToCloud(newRsvp) {
    try {
      let rsvps = [];
      let invitations = [];
      let fileSha = null;

      const getRes = await fetch(`https://api.github.com/repos/${RSVP_GH_OWNER}/${RSVP_GH_REPO}/contents/${RSVP_GH_PATH}?ref=main&t=${Date.now()}`, {
        headers: {
          'Authorization': `token ${RSVP_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const currentData = await getRes.json();
        fileSha = currentData.sha;
        if (currentData.content) {
          const rawText = decodeURIComponent(escape(atob(currentData.content.replace(/\s/g, ''))));
          const parsed = JSON.parse(rawText);
          if (parsed) {
            if (Array.isArray(parsed.rsvps)) rsvps = parsed.rsvps;
            if (Array.isArray(parsed.invitations)) invitations = parsed.invitations;
          }
        }
      }

      rsvps.unshift(newRsvp);

      const jsonPayload = JSON.stringify({
        invitations: invitations,
        rsvps: rsvps
      }, null, 2);

      const base64Content = btoa(unescape(encodeURIComponent(jsonPayload)));

      const putBody = {
        message: `[RSVP Confirmación] ${newRsvp.name} ${newRsvp.name2 ? '+ ' + newRsvp.name2 : ''} (${newRsvp.attendance === 'si' ? 'Sí asiste' : 'No asiste'} - ${newRsvp.code})`,
        content: base64Content,
        branch: 'main'
      };

      if (fileSha) putBody.sha = fileSha;

      await fetch(`https://api.github.com/repos/${RSVP_GH_OWNER}/${RSVP_GH_REPO}/contents/${RSVP_GH_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${RSVP_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

    } catch (error) {
      console.warn('Cloud RSVP push error:', error);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
