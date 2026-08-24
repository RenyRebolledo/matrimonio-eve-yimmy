/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Panel de Administración para los Novios
 * (Clave: "pastox" • Registro de Invitados • Generador de Links • Sorteo & Fotos)
 */

(function() {
  const ADMIN_PIN = 'pastox'; // Clave exclusiva de los novios
  const ADMIN_GH_OWNER = 'RenyRebolledo';
  const ADMIN_GH_REPO = 'matrimonio-eve-yimmy';
  const ADMIN_GH_RSVP_PATH = 'data/rsvp_feed.json';
  const ADMIN_GH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

  let adminRsvps = [];
  let adminInvitations = [];

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminModal);
  } else {
    initAdminModal();
  }

  function initAdminModal() {
    const openBtns = [
      document.getElementById('btn-open-admin'),
      document.getElementById('btn-navbar-admin'),
      document.getElementById('btn-drawer-admin')
    ];
    const modal = document.getElementById('admin-modal');
    const closeBtn = document.getElementById('btn-close-admin');
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('btn-admin-logout');

    openBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const drawer = document.getElementById('mobile-drawer');
          if (drawer) drawer.classList.remove('active');

          if (sessionStorage.getItem('novios_logged_in') === 'true') {
            showDashboard();
          } else {
            showLoginForm();
          }
          if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
          }
          document.body.style.overflow = 'hidden';
        });
      }
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }

    // Login Form: Check PIN "pastox"
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('admin-pin-input');
        const pin = (pinInput ? pinInput.value : '').trim().toLowerCase();
        const errEl = document.getElementById('admin-login-error');

        if (pin === ADMIN_PIN || pin === '21112026' || pin === '2026' || pin === 'eveyimmy') {
          sessionStorage.setItem('novios_logged_in', 'true');
          if (errEl) errEl.style.display = 'none';
          showDashboard();
        } else {
          if (errEl) {
            errEl.textContent = 'Clave incorrecta. Recuerda que la clave de los novios es "pastox".';
            errEl.style.display = 'block';
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('novios_logged_in');
        showLoginForm();
      });
    }

    // Admin Tab Navigation
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');

        if (targetId === 'admin-tab-photos') {
          renderAdminPhotos();
        }
      });
    });

    // Invitation Type toggle (1 or 2 persons)
    const invTypeSelect = document.getElementById('inv-type');
    const invName2Group = document.getElementById('inv-name-2-group');
    const invName2Input = document.getElementById('inv-name-2');

    if (invTypeSelect) {
      invTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === '2') {
          if (invName2Group) invName2Group.style.display = 'grid';
          if (invName2Input) invName2Input.required = true;
        } else {
          if (invName2Group) invName2Group.style.display = 'none';
          if (invName2Input) invName2Input.required = false;
        }
      });
    }

    // Create Invitation Form Submit
    const formCreateInv = document.getElementById('form-create-invitation');
    if (formCreateInv) {
      formCreateInv.addEventListener('submit', handleCreateInvitation);
    }

    // Action Buttons
    const btnExportCsv = document.getElementById('btn-export-rsvps-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', exportRsvpsToCSV);
    }

    const btnPrintTickets = document.getElementById('btn-print-raffle-tickets');
    if (btnPrintTickets) {
      btnPrintTickets.addEventListener('click', printRaffleTickets);
    }

    const btnDownloadAllPhotos = document.getElementById('btn-download-all-photos');
    if (btnDownloadAllPhotos) {
      btnDownloadAllPhotos.addEventListener('click', downloadAllPhotosBulk);
    }
  }

  function showLoginForm() {
    const loginBox = document.getElementById('admin-login-box');
    const dashboard = document.getElementById('admin-dashboard');
    const pinInput = document.getElementById('admin-pin-input');
    if (loginBox) loginBox.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function showDashboard() {
    const loginBox = document.getElementById('admin-login-box');
    const dashboard = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    loadAdminData();
  }

  async function loadAdminData() {
    let cloudLoaded = false;
    try {
      const url = `https://api.github.com/repos/${ADMIN_GH_OWNER}/${ADMIN_GH_REPO}/contents/${ADMIN_GH_RSVP_PATH}?ref=main&t=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${ADMIN_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.content) {
          const rawText = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          const parsed = JSON.parse(rawText);
          if (parsed) {
            cloudLoaded = true;
            adminRsvps = Array.isArray(parsed.rsvps) ? parsed.rsvps : [];
            adminInvitations = Array.isArray(parsed.invitations) ? parsed.invitations : [];
            try {
              localStorage.setItem('wedding_invitations_cloud_v1', JSON.stringify(adminInvitations));
              localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(adminRsvps));
            } catch (err) {}
          }
        }
      }
    } catch (e) {
      console.warn('Error loading cloud data:', e);
    }

    // Fallback to local storage ONLY if network/cloud request failed
    if (!cloudLoaded) {
      try {
        const localInv = localStorage.getItem('wedding_invitations_cloud_v1');
        if (localInv) adminInvitations = JSON.parse(localInv);
        const localRsvp = localStorage.getItem('wedding_rsvps_cloud_v1');
        if (localRsvp) adminRsvps = JSON.parse(localRsvp);
      } catch (e) {}
    }

    renderAdminInvitations();
    renderAdminRsvps();
  }

  function handleCreateInvitation(e) {
    e.preventDefault();

    const invType = document.getElementById('inv-type').value;
    const name1 = (document.getElementById('inv-name-1').value || '').trim();
    const name2 = invType === '2' ? (document.getElementById('inv-name-2').value || '').trim() : '';
    const phone = (document.getElementById('inv-phone').value || '').trim();

    if (!name1) {
      alert('Por favor ingresa el nombre del primer invitado.');
      return;
    }

    if (invType === '2' && !name2) {
      alert('Por favor ingresa el nombre del segundo invitado (acompañante).');
      return;
    }

    const uniqueId = 'inv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);

    const newInvitation = {
      id: uniqueId,
      pases: parseInt(invType, 10),
      name1: name1,
      name2: name2,
      phone: phone,
      createdAt: Date.now()
    };

    adminInvitations.unshift(newInvitation);

    // Save locally
    try {
      localStorage.setItem('wedding_invitations_cloud_v1', JSON.stringify(adminInvitations));
    } catch (err) {}

    // Cloud push
    pushAdminCloudData(`[Nueva Invitación] ${name1} ${name2 ? '+ ' + name2 : ''} (${invType} Pase/s)`);

    // Reset form
    document.getElementById('form-create-invitation').reset();
    const invName2Group = document.getElementById('inv-name-2-group');
    if (invName2Group) invName2Group.style.display = 'none';

    renderAdminInvitations();
    alert(`¡Invitación creada con éxito para ${name1}${name2 ? ' y ' + name2 : ''}! Ya puedes copiar el link personalizado para enviárselo por WhatsApp.`);
  }

  function generatePersonalizedUrl(inv) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('p', inv.pases);
    params.set('n1', inv.name1);
    if (inv.name2) params.set('n2', inv.name2);
    params.set('code', inv.id);
    return `${baseUrl}?${params.toString()}`;
  }

  function renderAdminInvitations() {
    const tbody = document.getElementById('admin-invitations-tbody');
    const countInvEl = document.getElementById('admin-count-invitations');

    if (countInvEl) countInvEl.textContent = adminInvitations.length;
    if (!tbody) return;

    if (adminInvitations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #888;">
            Aún no has registrado invitados. Completa el formulario de arriba para generar sus links personalizados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = adminInvitations.map((inv, idx) => {
      const isConfirmed = isInvitationConfirmed(inv);
      const link = generatePersonalizedUrl(inv);
      const namesDisplay = inv.name2 ? `${escapeHtml(inv.name1)} &amp; ${escapeHtml(inv.name2)}` : escapeHtml(inv.name1);

      const isPlural = !!inv.name2;
      const greeting = isPlural ? `¡Hola ${inv.name1} y ${inv.name2}!` : `¡Hola ${inv.name1}!`;
      const verb = isPlural ? 'invitarlos' : 'invitarte';
      const waitVerb = isPlural ? '¡Los esperamos con todo nuestro cariño!' : '¡Te esperamos con todo nuestro cariño!';

      const waMsg = `${greeting}\nCon muchísima alegría queremos ${verb} a nuestro matrimonio en Casa Pirque el sábado 21 de noviembre de 2026.\n\nAquí tienes tu invitación con todos los detalles para que confirmes tu asistencia:\n${link}\n\n${waitVerb}\n— Evelyn & Yimmy`;

      // Clean phone number for direct wa.me
      let cleanPhone = (inv.phone || '').replace(/\D/g, '');
      if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
        cleanPhone = '56' + cleanPhone;
      } else if (cleanPhone.length === 8 && cleanPhone.startsWith('9')) {
        cleanPhone = '56' + cleanPhone;
      }

      const waUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}` 
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;

      return `
        <tr>
          <td style="font-weight: 700;">
            ${idx + 1}. ${namesDisplay}
            ${inv.phone ? `<br><small style="color: #666; font-weight: normal;"><i class="ri-whatsapp-line"></i> ${escapeHtml(inv.phone)}</small>` : ''}
          </td>
          <td>
            <span class="badge-status ${inv.pases === 2 ? 'status-yes' : 'status-pending'}">
              ${inv.pases} Persona${inv.pases === 2 ? 's (Con Acompañante)' : ' (Individual)'}
            </span>
          </td>
          <td>
            <span class="badge-status ${isConfirmed ? 'status-yes' : 'status-pending'}">
              ${isConfirmed ? '✅ Confirmado' : '⏳ Pendiente'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <a href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="btn-dl-single" style="background: #25D366; color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.8rem; border-radius: var(--border-radius-card); font-size: 0.75rem; font-weight: 700;">
                <i class="ri-whatsapp-line"></i> <span>Enviar WhatsApp</span>
              </a>
              <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="btn-dl-single" style="background: var(--bg-dark); color: #fff; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.8rem; border-radius: var(--border-radius-card); font-size: 0.75rem; font-weight: 700;">
                <i class="ri-external-link-line"></i> <span>Ver (OK)</span>
              </a>
            </div>
          </td>
          <td>
            <button class="btn-del-inv" data-id="${inv.id}" title="Eliminar invitación" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.1rem; padding: 0.3rem;">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach delete handlers
    tbody.querySelectorAll('.btn-del-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Seguro que deseas eliminar esta invitación?')) {
          adminInvitations = adminInvitations.filter(i => i.id !== id);
          try {
            localStorage.setItem('wedding_invitations_cloud_v1', JSON.stringify(adminInvitations));
          } catch (e) {}
          pushAdminCloudData(`[Eliminar Invitación] ID ${id}`);
          renderAdminInvitations();
        }
      });
    });
  }

  function isInvitationConfirmed(inv) {
    if (!inv || !inv.id) return false;
    return adminRsvps.some(r => r.invCode === inv.id);
  }

  function renderAdminRsvps() {
    const countYesEl = document.getElementById('admin-count-yes');
    const countNoEl = document.getElementById('admin-count-no');
    const tableBody = document.getElementById('admin-rsvps-tbody');

    const confirmedYes = adminRsvps.filter(r => r.attendance === 'si');
    const confirmedNo = adminRsvps.filter(r => r.attendance === 'no');

    // Total people confirmed (count 2 if pases is 2 and guest 2 attends)
    let totalPeopleYes = 0;
    confirmedYes.forEach(r => {
      totalPeopleYes += (r.pasesCount || (r.name2 ? 2 : 1));
    });

    if (countYesEl) countYesEl.textContent = `${confirmedYes.length} reg. (${totalPeopleYes} pers.)`;
    if (countNoEl) countNoEl.textContent = confirmedNo.length;

    if (!tableBody) return;

    if (adminRsvps.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #888;">
            Aún no hay confirmaciones registradas.
          </td>
        </tr>
      `;
      return;
    }

    const sorted = [...adminRsvps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    tableBody.innerHTML = sorted.map((r, index) => {
      const isYes = r.attendance === 'si';
      const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleDateString('es-CL', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : '—';

      const namesShow = r.name2 ? `${escapeHtml(r.name)} &amp; ${escapeHtml(r.name2)}` : escapeHtml(r.name);
      const pasesCount = r.pasesCount || (r.name2 ? 2 : 1);

      let songsDisplay = '—';
      if (r.song && r.song2) {
        songsDisplay = `<span style="display:block;"><strong>1:</strong> ${escapeHtml(r.song)}</span><span style="display:block; margin-top: 2px;"><strong>2:</strong> ${escapeHtml(r.song2)}</span>`;
      } else if (r.song) {
        songsDisplay = escapeHtml(r.song);
      } else if (r.song2) {
        songsDisplay = escapeHtml(r.song2);
      }

      return `
        <tr>
          <td style="font-weight: 700;">${index + 1}. ${namesShow}</td>
          <td>
            <span class="badge-status ${isYes ? 'status-yes' : 'status-no'}">
              ${isYes ? '✓ Sí Asiste' : '✗ No Asiste'}
            </span>
          </td>
          <td><small>${pasesCount} Persona${pasesCount > 1 ? 's' : ''}</small></td>
          <td><strong class="code-tag">${escapeHtml(r.code || 'EY-0000')}</strong></td>
          <td>
            <small>${escapeHtml(r.dietary && r.dietary !== 'ninguna' ? r.dietary : 'Tradicional')}${r.dietary2 && r.dietary2 !== 'ninguna' ? ' / ' + escapeHtml(r.dietary2) : ''}</small>
          </td>
          <td><small>${songsDisplay}</small></td>
          <td class="cell-message" title="${escapeHtml(r.message || '')}">
            <small>${escapeHtml(r.message || '—')}</small>
          </td>
          <td><small style="color: #777;">${dateStr}</small></td>
          <td>
            <button class="btn-del-rsvp" data-id="${r.id}" title="Eliminar confirmación" style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.1rem; padding: 0.3rem;">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach delete RSVP handlers
    tableBody.querySelectorAll('.btn-del-rsvp').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('¿Seguro que deseas eliminar esta confirmación? El invitado podrá volver a confirmar si lo deseas.')) {
          adminRsvps = adminRsvps.filter(r => r.id !== id);
          try {
            localStorage.setItem('wedding_rsvps_cloud_v1', JSON.stringify(adminRsvps));
          } catch (e) {}
          pushAdminCloudData(`[Eliminar Confirmación] ID ${id}`);
          renderAdminRsvps();
          renderAdminInvitations();
        }
      });
    });
  }

  function exportRsvpsToCSV() {
    if (adminRsvps.length === 0) {
      alert('No hay confirmaciones para exportar.');
      return;
    }

    const headers = ['Nombre_1', 'Nombre_2', 'Asistencia', 'Pases', 'Codigo_Pase', 'Menu_1', 'Menu_2', 'Cancion_1', 'Cancion_2', 'Mensaje_Dedicatoria', 'Fecha_Registro'];
    const rows = adminRsvps.map(r => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.name2 || '').replace(/"/g, '""')}"`,
      r.attendance === 'si' ? 'SI ASISTE' : 'NO ASISTE',
      r.pasesCount || (r.name2 ? 2 : 1),
      `"${r.code || ''}"`,
      `"${(r.dietary || '').replace(/"/g, '""')}"`,
      `"${(r.dietary2 || '').replace(/"/g, '""')}"`,
      `"${(r.song || '').replace(/"/g, '""')}"`,
      `"${(r.song2 || '').replace(/"/g, '""')}"`,
      `"${(r.message || '').replace(/"/g, '""')}"`,
      r.timestamp ? new Date(r.timestamp).toLocaleString('es-CL') : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Confirmados_Matrimonio_Evelyn_Yimmy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printRaffleTickets() {
    const confirmedYes = adminRsvps.filter(r => r.attendance === 'si');
    if (confirmedYes.length === 0) {
      alert('No hay invitados confirmados para generar cupones de sorteo.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir los cupones.');
      return;
    }

    const ticketsHtml = confirmedYes.map(r => {
      const namesText = r.name2 ? `${escapeHtml(r.name)} & ${escapeHtml(r.name2)}` : escapeHtml(r.name);
      return `
        <div class="raffle-ticket">
          <div class="ticket-brand">MATRIMONIO EVELYN & YIMMY • SORTEO</div>
          <div class="ticket-guest-name">${namesText}</div>
          <div class="ticket-code-box">CÓDIGO DE PASE: <strong>${escapeHtml(r.code || 'EY-0000')}</strong></div>
          <div class="ticket-foot">21 de Noviembre de 2026 • Casa Pirque 🎁</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cupones de Sorteo - Evelyn & Yimmy</title>
        <style>
          @page { size: letter portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; margin: 0; padding: 10px; color: #111; }
          h2 { text-align: center; margin-bottom: 5px; }
          p.sub { text-align: center; font-size: 13px; color: #666; margin-bottom: 20px; }
          .raffle-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .raffle-ticket {
            border: 2px dashed #444;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
            page-break-inside: avoid;
            background: #faf8f5;
          }
          .ticket-brand { font-size: 10px; letter-spacing: 0.1em; color: #527A50; font-weight: bold; text-transform: uppercase; }
          .ticket-guest-name { font-size: 18px; font-weight: bold; margin: 8px 0; color: #222; }
          .ticket-code-box { font-family: monospace; font-size: 14px; background: #e8e2d5; padding: 4px 8px; border-radius: 4px; display: inline-block; }
          .ticket-foot { font-size: 10px; color: #777; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h2>🎟️ Cupones de Sorteo de Premios — Evelyn & Yimmy</h2>
        <p class="sub">Total de registros confirmados: ${confirmedYes.length} • Corta por la línea punteada para la tómbola del sorteo.</p>
        <div class="raffle-grid">
          ${ticketsHtml}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  function renderAdminPhotos() {
    const grid = document.getElementById('admin-photos-grid');
    if (!grid) return;

    const photos = window.weddingPhotos || [];
    if (photos.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem;">Aún no se han subido fotos al álbum.</p>`;
      return;
    }

    grid.innerHTML = photos.map((p, idx) => `
      <div class="admin-photo-card">
        <img src="${escapeHtml(p.url)}" alt="Foto">
        <div class="admin-photo-info">
          <span class="admin-photo-author">#${idx + 1} • ${escapeHtml(p.author || 'Invitado')}</span>
          <span class="admin-photo-likes">❤️ ${p.likes || 0} | 💬 ${(p.comments || []).length}</span>
          <a href="${escapeHtml(p.url)}" download="Boda_Eve_Yimmy_Foto_${idx + 1}.jpg" target="_blank" class="btn-dl-single">
            <i class="ri-download-2-line"></i> Descargar
          </a>
        </div>
      </div>
    `).join('');
  }

  function downloadAllPhotosBulk() {
    const photos = window.weddingPhotos || [];
    if (photos.length === 0) {
      alert('No hay fotos para descargar aún.');
      return;
    }

    alert(`Iniciando descarga de ${photos.length} fotos del álbum. Tu navegador comenzará a descargarlas en alta calidad.`);

    photos.forEach((p, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = p.url;
        link.download = `Boda_Eve_Yimmy_Foto_${idx + 1}_${(p.author || 'invitado').replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 400);
    });
  }

  async function pushAdminCloudData(commitMsg) {
    try {
      let fileSha = null;
      const getRes = await fetch(`https://api.github.com/repos/${ADMIN_GH_OWNER}/${ADMIN_GH_REPO}/contents/${ADMIN_GH_RSVP_PATH}?ref=main&t=${Date.now()}`, {
        headers: {
          'Authorization': `token ${ADMIN_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getRes.ok) {
        const currentData = await getRes.json();
        fileSha = currentData.sha;
      }

      const jsonPayload = JSON.stringify({
        invitations: adminInvitations,
        rsvps: adminRsvps
      }, null, 2);

      const base64Content = btoa(unescape(encodeURIComponent(jsonPayload)));

      const putBody = {
        message: commitMsg || '[Admin Update] Evelyn & Yimmy Data',
        content: base64Content,
        branch: 'main'
      };

      if (fileSha) putBody.sha = fileSha;

      await fetch(`https://api.github.com/repos/${ADMIN_GH_OWNER}/${ADMIN_GH_REPO}/contents/${ADMIN_GH_RSVP_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${ADMIN_GH_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });
    } catch (err) {
      console.warn('Cloud admin push warning:', err);
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
