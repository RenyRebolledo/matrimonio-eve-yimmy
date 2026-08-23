/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Módulo de Confirmación de Asistencia (RSVP)
 * Soporte para Invitaciones Personalizadas con bloques individuales por invitado, 
 * canciones individuales, dedicatoria compartida y pase de entrada oficial.
 */

(function() {
  const RSVP_GH_OWNER = 'RenyRebolledo';
  const RSVP_GH_REPO = 'matrimonio-eve-yimmy';
  const RSVP_GH_PATH = 'data/rsvp_feed.json';
  const RSVP_GH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

  let invitationData = null;

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
    const attendanceDetails1 = document.getElementById('attendance-details-group');
    const attendanceDetails2 = document.getElementById('attendance-details-group-2');

    // 1. Check for URL parameters (?p=2&n1=...&n2=...&code=...)
    checkUrlInvitationParams();

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

  // Global submit handler
  window.handleRsvpSubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const form = document.getElementById('rsvp-form');
    const passModal = document.getElementById('guest-pass-modal');
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

    // 1. Save locally
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_rsvps_cloud_v1') || '[]');
      stored.unshift(newRsvp);
      localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(stored));
      localStorage.setItem('wedding_guest_name', displayName);
    } catch (err) {}

    // 2. Open confirmation pass modal IMMEDIATELY if at least one is attending
    if (isAnyAttending) {
      const guestNameEl = document.getElementById('pass-guest-name');
      const passCountEl = document.getElementById('pass-pases-count');
      const passCodeEl = document.getElementById('pass-code');
      const passDietaryRow = document.getElementById('pass-dietary-row');
      const passDietaryVal = document.getElementById('pass-dietary-val');
      const passSongRow = document.getElementById('pass-song-row');
      const passSongVal = document.getElementById('pass-song-val');

      if (guestNameEl) {
        if (isTwoPasses && attendance1 === 'si' && attendance2 === 'si') {
          guestNameEl.textContent = `${name1} & ${name2}`;
        } else if (isTwoPasses && attendance1 === 'si') {
          guestNameEl.textContent = `${name1} (1 Persona)`;
        } else if (isTwoPasses && attendance2 === 'si') {
          guestNameEl.textContent = `${name2} (1 Persona)`;
        } else {
          guestNameEl.textContent = name1;
        }
      }

      if (passCountEl) {
        passCountEl.textContent = `${confirmedCount} Persona${confirmedCount > 1 ? 's' : ''}`;
      }

      if (passCodeEl) passCodeEl.textContent = reservationCode;

      // Dieta display
      let dietarySummary = [];
      if (attendance1 === 'si' && dietary1 && dietary1 !== 'ninguna') {
        const dText1 = dietarySelect1 ? dietarySelect1.options[dietarySelect1.selectedIndex].text : dietary1;
        dietarySummary.push(`${name1}: ${dText1}`);
      }
      if (isTwoPasses && attendance2 === 'si' && dietary2 && dietary2 !== 'ninguna') {
        const dText2 = dietarySelect2 ? dietarySelect2.options[dietarySelect2.selectedIndex].text : dietary2;
        dietarySummary.push(`${name2}: ${dText2}`);
      }

      if (dietarySummary.length > 0 && passDietaryRow && passDietaryVal) {
        passDietaryRow.style.display = 'flex';
        passDietaryVal.textContent = dietarySummary.join(' | ');
      } else if (passDietaryRow) {
        passDietaryRow.style.display = 'none';
      }

      // Song display (both songs)
      let songsSummary = [];
      if (song1) songsSummary.push(isTwoPasses && song2 ? `${name1}: "${song1}"` : `"${song1}"`);
      if (isTwoPasses && song2) songsSummary.push(`${name2}: "${song2}"`);

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
      form.reset();
    } else {
      alert(`¡Muchas gracias, ${displayName}! Hemos registrado tu respuesta. Te mandamos un abrazo gigante.`);
      form.reset();
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
})();
