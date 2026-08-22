/**
 * EVELYN & YIMMY - NUESTRO MATRIMONIO
 * Álbum Colaborativo de Recuerdos (IndexedDB + Galería + Lightbox)
 */

const DB_NAME = 'EveYimmyWeddingAlbum';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let db = null;
let currentPhotos = [];

document.addEventListener('DOMContentLoaded', () => {
  initIndexedDB().then(() => {
    loadPhotos('all');
  });
  initGalleryEvents();
});

function initIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const store = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB error, fallback to memory:', e);
      resolve(null);
    };
  });
}

const INITIAL_PHOTOS = [
  {
    id: 1,
    url: 'assets/images/couple_portrait.jpg',
    author: 'Evelyn & Yimmy',
    caption: '¡Comenzando esta nueva etapa juntos! 💍',
    category: 'invitados',
    likes: 48,
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 2,
    url: 'assets/images/venue_casapirque.jpg',
    author: 'Los Novios',
    caption: 'El hermoso entorno de Casa Pirque 🏔️✨',
    category: 'lugar',
    likes: 35,
    timestamp: Date.now() - 3600000 * 4
  },
  {
    id: 3,
    url: 'assets/images/picnic_lawn.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'Listos para el momento manta en el pasto 🧺🌿',
    category: 'lugar',
    likes: 52,
    timestamp: Date.now() - 3600000 * 3
  }
];

function loadPhotos(filterCategory = 'all') {
  if (!db) {
    currentPhotos = [...INITIAL_PHOTOS];
    renderGallery(filterCategory === 'all' ? currentPhotos : currentPhotos.filter(p => p.category === filterCategory));
    return;
  }

  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = (e) => {
    let photos = e.target.result || [];
    if (photos.length === 0) {
      seedInitialPhotos().then(() => loadPhotos(filterCategory));
      return;
    }

    photos.sort((a, b) => b.timestamp - a.timestamp);
    currentPhotos = photos;

    const filtered = filterCategory === 'all' ? photos : photos.filter(p => p.category === filterCategory);
    renderGallery(filtered);
  };
}

function seedInitialPhotos() {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    INITIAL_PHOTOS.forEach(p => store.add(p));
    transaction.oncomplete = () => resolve();
  });
}

function renderGallery(photos) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (photos.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem;">Aún no hay fotos en esta sección. ¡Sé el primero en subir una foto!</p>';
    return;
  }

  grid.innerHTML = photos.map(photo => `
    <div class="gallery-item" data-id="${photo.id}" data-url="${photo.url}" data-title="${photo.author}" data-desc="${photo.caption}">
      <img src="${photo.url}" alt="${photo.caption}" loading="lazy">
      <div class="gallery-meta">
        <span class="gallery-caption">${photo.caption}</span>
        <span class="gallery-likes"><i class="ri-heart-fill"></i> ${photo.likes || 0}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      openLightbox(
        item.getAttribute('data-url'),
        item.getAttribute('data-title'),
        item.getAttribute('data-desc')
      );
    });
  });
}

function initGalleryEvents() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      loadPhotos(cat);
    });
  });

  const openUploadBtn = document.getElementById('btn-open-upload');
  const fileInput = document.getElementById('photo-file-input');

  if (openUploadBtn && fileInput) {
    openUploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const photoData = {
          url: evt.target.result,
          author: 'Invitado(a) Especial',
          caption: 'Foto compartida en la boda 💕',
          category: 'invitados',
          likes: 1,
          timestamp: Date.now()
        };

        if (db) {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          store.add(photoData);
          transaction.oncomplete = () => {
            loadPhotos('all');
            alert('¡Tu foto se ha agregado al álbum con éxito!');
          };
        } else {
          INITIAL_PHOTOS.unshift({ ...photoData, id: Date.now() });
          loadPhotos('all');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const lightbox = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn && lightbox) {
    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
  }
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.remove('active');
    });
  }
}

function openLightbox(url, title, desc) {
  const lightbox = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const descEl = document.getElementById('lightbox-desc');

  if (!lightbox || !img) return;

  img.src = url;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;

  lightbox.classList.add('active');
}
