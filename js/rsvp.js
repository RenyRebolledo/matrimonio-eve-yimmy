/**
 * EVELYN & YIMMY - NUESTRO MATRIMONIO
 * RSVP Form & WhatsApp Direct Sender (+56 9 9787 4977)
 */

document.addEventListener('DOMContentLoaded', () => {
  initRsvpModule();
});

function initRsvpModule() {
  const form = document.getElementById('rsvp-form');
  const passModal = document.getElementById('guest-pass-modal');
  const closePassBtn = document.getElementById('btn-close-pass-modal');
  const printPassBtn = document.getElementById('btn-print-pass');
  const whatsappBtn = document.getElementById('btn-send-rsvp-whatsapp');
  const attendanceGroup = document.getElementById('attendance-details-group');

  const NOVIOS_PHONE = "56997874977"; // +56 9 9787 4977

  if (!form) return;

  // Toggle details depending on attendance
  const radios = form.querySelectorAll('input[name="attendance"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'no') {
        if (attendanceGroup) attendanceGroup.style.display = 'none';
      } else {
        if (attendanceGroup) attendanceGroup.style.display = 'grid';
      }
    });
  });

  // Handle Close Modal
  if (closePassBtn && passModal) {
    closePassBtn.addEventListener('click', () => passModal.classList.remove('active'));
  }
  if (passModal) {
    passModal.addEventListener('click', (e) => {
      if (e.target === passModal) passModal.classList.remove('active');
    });
  }

  // Print Pass
  if (printPassBtn) {
    printPassBtn.addEventListener('click', () => window.print());
  }

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('rsvp-name').value.trim();
    const phone = document.getElementById('rsvp-phone').value.trim();
    const attendance = form.querySelector('input[name="attendance"]:checked').value;
    const guests = document.getElementById('rsvp-guests').value;
    const guestNames = document.getElementById('rsvp-guest-names').value.trim();
    const dietary = document.getElementById('rsvp-dietary').value;
    const song = document.getElementById('rsvp-song').value.trim();
    const message = document.getElementById('rsvp-message').value.trim();

    if (!name) {
      alert('Por favor, ingresa tu nombre y apellido.');
      return;
    }

    const reservationCode = 'EY-' + Math.floor(1000 + Math.random() * 9000);

    // Prepare WhatsApp Message
    let whatsappText = "";
    if (attendance === 'si') {
      whatsappText = `💍 *¡Hola Evelyn & Yimmy!* ✨\n\n` +
        `¡Qué alegría! Quiero confirmar mi asistencia a su matrimonio el sábado 21 de noviembre de 2026 en Casa Pirque:\n\n` +
        `👤 *Invitado(a):* ${name}\n` +
        `🎟️ *Pases confirmados:* ${guests} ${guests === '1' ? 'Persona' : 'Personas'}\n`;
      
      if (guestNames) {
        whatsappText += `👥 *Acompañante(s):* ${guestNames}\n`;
      }
      if (dietary && dietary !== 'ninguna') {
        whatsappText += `🥗 *Menú/Dieta:* ${dietary}\n`;
      }
      if (song) {
        whatsappText += `🎵 *Canción sugerida:* ${song}\n`;
      }
      if (message) {
        whatsappText += `💌 *Mensaje para los novios:* "${message}"\n`;
      }
      whatsappText += `\n🧺 *¡Nos vemos con nuestra manta lista para celebrar!* 🥂🎉`;
    } else {
      whatsappText = `💍 *¡Hola Evelyn & Yimmy!* ✨\n\n` +
        `Les escribe ${name}. Lamentablemente no podré acompañarlos físicamente en su matrimonio el 21 de noviembre, pero les deseo de todo corazón que tengan un día inolvidable y maravilloso lleno de bendiciones y amor. ¡Los quiero mucho! ❤️`;
      if (message) {
        whatsappText += `\n\n💌 *Mensaje:* "${message}"`;
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${NOVIOS_PHONE}&text=${encodeURIComponent(whatsappText)}`;

    // Save to LocalStorage
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
      stored.push({
        code: reservationCode,
        date: new Date().toISOString(),
        name,
        phone,
        attendance,
        guests: attendance === 'si' ? guests : '0',
        guestNames,
        dietary,
        song,
        message
      });
      localStorage.setItem('wedding_rsvps', JSON.stringify(stored));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    if (attendance === 'si') {
      // Update Digital Pass Modal
      document.getElementById('pass-guest-name').textContent = name;
      document.getElementById('pass-pases-count').textContent = `${guests} ${guests === '1' ? 'Persona' : 'Personas'}`;
      document.getElementById('pass-code').textContent = reservationCode;

      if (whatsappBtn) {
        whatsappBtn.onclick = () => window.open(whatsappUrl, '_blank');
      }

      if (passModal) passModal.classList.add('active');

      // Automatically open WhatsApp in new tab for immediate delivery
      window.open(whatsappUrl, '_blank');
    } else {
      window.open(whatsappUrl, '_blank');
      form.reset();
    }
  });
}
