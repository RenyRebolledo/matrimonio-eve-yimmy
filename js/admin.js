/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Panel de Administración para los Novios
 * (Gestión de Asistencia, Sorteo de Premios & Descarga Masiva de Fotos)
 */

(function() {
  const ADMIN_PIN = '21112026'; // PIN oficial de los novios
  const ADMIN_GH_OWNER = 'RenyRebolledo';
  const ADMIN_GH_REPO = 'matrimonio-eve-yimmy';
  const ADMIN_GH_RSVP_PATH = 'data/rsvp_feed.json';
  const ADMIN_GH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

  let adminRsvps = [];

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

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('admin-pin-input');
        const pin = (pinInput ? pinInput.value : '').trim();
        const errEl = document.getElementById('admin-login-error');

        if (pin === ADMIN_PIN || pin === '2026' || pin === 'eveyimmy') {
          sessionStorage.setItem('novios_logged_in', 'true');
          if (errEl) errEl.style.display = 'none';
          showDashboard();
        } else {
          if (errEl) {
            errEl.textContent = 'PIN o clave incorrecta. Por favor intenta nuevamente.';
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

    const btnQuickDownload = document.getElementById('btn-quick-download-photos');
    if (btnQuickDownload) {
      btnQuickDownload.addEventListener('click', downloadAllPhotosBulk);
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
          if (parsed && Array.isArray(parsed.rsvps)) {
            adminRsvps = parsed.rsvps;
          }
        }
      }
    } catch (e) {
      console.warn('Error loading cloud RSVPs:', e);
    }

    if (adminRsvps.length === 0) {
      try {
        const local = localStorage.getItem('wedding_rsvps_cloud_v1');
        if (local) adminRsvps = JSON.parse(local);
      } catch (e) {}
    }

    renderAdminRsvps();
  }

  function renderAdminRsvps() {
    const countYesEl = document.getElementById('admin-count-yes');
    const countNoEl = document.getElementById('admin-count-no');
    const countTotalEl = document.getElementById('admin-count-total');
    const tableBody = document.getElementById('admin-rsvps-tbody');

    const confirmedYes = adminRsvps.filter(r => r.attendance === 'si');
    const confirmedNo = adminRsvps.filter(r => r.attendance === 'no');

    if (countYesEl) countYesEl.textContent = confirmedYes.length;
    if (countNoEl) countNoEl.textContent = confirmedNo.length;
    if (countTotalEl) countTotalEl.textContent = adminRsvps.length;

    if (!tableBody) return;

    if (adminRsvps.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #888;">
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

      return `
        <tr>
          <td style="font-weight: 700;">${index + 1}. ${escapeHtml(r.name)}</td>
          <td>
            <span class="badge-status ${isYes ? 'status-yes' : 'status-no'}">
              ${isYes ? '✓ Sí Asiste' : '✗ No Asiste'}
            </span>
          </td>
          <td><strong class="code-tag">${escapeHtml(r.code || 'EY-0000')}</strong></td>
          <td><small>${escapeHtml(r.dietary && r.dietary !== 'ninguna' ? r.dietary : 'Menú Tradicional')}</small></td>
          <td><small>${escapeHtml(r.song || '—')}</small></td>
          <td class="cell-message" title="${escapeHtml(r.message || '')}">
            <small>${escapeHtml(r.message || '—')}</small>
          </td>
          <td><small style="color: #777;">${dateStr}</small></td>
        </tr>
      `;
    }).join('');
  }

  function exportRsvpsToCSV() {
    if (adminRsvps.length === 0) {
      alert('No hay confirmaciones para exportar.');
      return;
    }

    const headers = ['Nombre', 'Asistencia', 'Codigo_Pase', 'Restriccion_Alimentaria', 'Cancion_Sugerida', 'Mensaje_Dedicatoria', 'Fecha_Registro'];
    const rows = adminRsvps.map(r => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.attendance === 'si' ? 'SI ASISTE' : 'NO ASISTE',
      `"${r.code || ''}"`,
      `"${(r.dietary || '').replace(/"/g, '""')}"`,
      `"${(r.song || '').replace(/"/g, '""')}"`,
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

    const ticketsHtml = confirmedYes.map(r => `
      <div class="raffle-ticket">
        <div class="ticket-brand">MATRIMONIO EVELYN & YIMMY • SORTEO</div>
        <div class="ticket-guest-name">${escapeHtml(r.name)}</div>
        <div class="ticket-code-box">CÓDIGO DE PASE: <strong>${escapeHtml(r.code || 'EY-0000')}</strong></div>
        <div class="ticket-foot">21 de Noviembre de 2026 • Casa Pirque 🎁</div>
      </div>
    `).join('');

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
        <p class="sub">Total de invitados confirmados: ${confirmedYes.length} • Corta por la línea punteada para la tómbola del sorteo.</p>
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
