/**
 * EVELYN & YIMMY - WEDDING INVITATION
 * RSVP & Personalized Boarding Pass Generator
 */

document.addEventListener('DOMContentLoaded', () => {
  initRsvpForm();
});

function initRsvpForm() {
  const form = document.getElementById('rsvp-form');
  const modal = document.getElementById('guest-pass-modal');
  const closeModalBtn = document.getElementById('btn-close-pass-modal');
  const printPassBtn = document.getElementById('btn-print-pass');
  const whatsappShareBtn = document.getElementById('btn-send-rsvp-whatsapp');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('rsvp-name').value.trim();
    const phone = document.getElementById('rsvp-phone').value.trim();
    const attendance = form.querySelector('input[name="attendance"]:checked').value;
    const guestsCount = document.getElementById('rsvp-guests').value;
    const guestNames = document.getElementById('rsvp-guest-names').value.trim();
    const dietary = document.getElementById('rsvp-dietary').value;
    const song = document.getElementById('rsvp-song').value.trim();
    const message = document.getElementById('rsvp-message').value.trim();

    if (!name) {
      alert('Por favor, ingresa tu nombre y apellido.');
      return;
    }

    const rsvpData = {
      id: 'EY-' + Date.now().toString().slice(-5),
      date: new Date().toISOString(),
      name,
      phone,
      attendance,
      guestsCount: attendance === 'si' ? guestsCount : '0',
      guestNames,
      dietary,
      song,
      message
    };

    // Save to LocalStorage
    saveRsvpToLocal(rsvpData);

    if (attendance === 'si') {
      // Generate and display personalized Boarding Pass
      renderPersonalizedPass(rsvpData);
      openModal(modal);
    } else {
      // Show sweet non-attendance thank you message
      alert(`Muchas gracias ${name} por avisarnos. Te tendremos en nuestros corazones en este día especial.`);
      form.reset();
    }
  });

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  }

  if (printPassBtn) {
    printPassBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function saveRsvpToLocal(data) {
  try {
    const list = JSON.parse(localStorage.getItem('wedding_rsvp_guests') || '[]');
    list.push(data);
    localStorage.setItem('wedding_rsvp_guests', JSON.stringify(list));
  } catch (err) {
    console.error('Error saving RSVP to localStorage:', err);
  }
}

function renderPersonalizedPass(data) {
  const passName = document.getElementById('pass-display-name');
  const passGuests = document.getElementById('pass-display-guests');
  const passDietary = document.getElementById('pass-display-dietary');
  const passTicketId = document.getElementById('pass-display-id');
  const whatsappBtn = document.getElementById('btn-send-rsvp-whatsapp');

  if (passName) passName.textContent = data.name;
  if (passGuests) passGuests.textContent = data.guestsCount === '1' ? '1 Invitado (Individual)' : `${data.guestsCount} Invitados`;
  if (passDietary) passDietary.textContent = data.dietary;
  if (passTicketId) passTicketId.textContent = data.id;

  if (whatsappBtn) {
    const isSingle = data.guestsCount === '1';
    let textMsg = `¡Hola Evelyn y Yimmy! 💍✨\n\nConfirmé mi asistencia a su matrimonio en Casa Pirque:\n` +
      `✈️ *Pasajero(a):* ${data.name}\n` +
      `🎟️ *Pases reservados:* ${data.guestsCount} ${isSingle ? 'persona' : 'personas'}\n`;

    if (data.guestNames) {
      textMsg += `👥 *Acompañantes:* ${data.guestNames}\n`;
    }
    if (data.dietary && data.dietary !== 'Ninguna (Menú Tradicional)') {
      textMsg += `🍽️ *Preferencia Menú:* ${data.dietary}\n`;
    }
    if (data.song) {
      textMsg += `🎶 *Canción para la fiesta:* ${data.song}\n`;
    }
    if (data.message) {
      textMsg += `💌 *Mensaje:* "${data.message}"\n`;
    }
    textMsg += `\n🧺 ¡Nos vemos el Sábado 21 de Noviembre con manta en mano para el pasto! 🌿🍾`;

    const encoded = encodeURIComponent(textMsg);
    whatsappBtn.href = `https://api.whatsapp.com/send?text=${encoded}`;
    whatsappBtn.target = "_blank";
  }
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
