/**
 * EVELYN & YIMMY - THE WEDDING ISSUE
 * RSVP Submission & Digital VIP Pass Generator
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

  if (!form) return;

  // Toggle details depending on attendance radio
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
    printPassBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Handle Form Submit
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

    const rsvpData = {
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
    };

    // Save to LocalStorage
    try {
      const stored = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
      stored.push(rsvpData);
      localStorage.setItem('wedding_rsvps', JSON.stringify(stored));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    if (attendance === 'si') {
      // Update Digital Pass Modal
      document.getElementById('pass-guest-name').textContent = name;
      document.getElementById('pass-pases-count').textContent = `${guests} ${guests === '1' ? 'Pase' : 'Pases'}`;
      document.getElementById('pass-code').textContent = reservationCode;

      // WhatsApp Button link
      if (whatsappBtn) {
        let msg = `💍 *CONFIRMACIÓN DE ASISTENCIA MATRIMONIO EVELYN & YIMMY*\n\n`;
        msg += `✨ *Invitado:* ${name}\n`;
        msg += `🎟️ *Pases:* ${guests}\n`;
        if (guestNames) msg += `👥 *Acompañante(s):* ${guestNames}\n`;
        if (dietary !== 'ninguna') msg += `🥗 *Menú/Dieta:* ${dietary}\n`;
        if (song) msg += `🎵 *Canción sugerida:* ${song}\n`;
        if (message) msg += `💌 *Dedicatoria:* "${message}"\n`;
        msg += `\n🔖 *Código de Reserva:* ${reservationCode}\n¡Nos vemos el 21 de Noviembre en Casa Pirque!`;

        const encoded = encodeURIComponent(msg);
        whatsappBtn.onclick = () => {
          window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        };
      }

      if (passModal) passModal.classList.add('active');
    } else {
      alert(`Muchas gracias, ${name}, por notificarnos. Te tendremos en nuestros corazones en este día tan especial.`);
      form.reset();
    }
  });
}
