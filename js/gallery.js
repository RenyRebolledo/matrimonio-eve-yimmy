/**
 * EVELYN & YIMMY - THE WEDDING ISSUE
 * High-Fashion Editorial Photo Album (IndexedDB + Masonry Gallery + Lightbox)
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
  return new Promise((resolve, reject) => {
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
      console.warn('IndexedDB error, falling back to memory array:', e);
      resolve(null);
    };
  });
}

const INITIAL_PHOTOS = [
  {
    id: 1,
    url: 'assets/images/couple_portrait.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'Comenzando el viaje de nuestras vidas 💍',
    category: 'ceremonia',
    likes: 34,
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 2,
    url: 'assets/images/venue_casapirque.jpg',
    author: 'Los Novios',
    caption: 'El hermoso paisaje de Casa Pirque 🏔️✨',
    category: 'lugar',
    likes: 27,
    timestamp: Date.now() - 3600000 * 4
  },
  {
    id: 3,
    url: 'assets/images/picnic_lawn.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'Listos para el momento picnic y manta en el pasto 🧺🌿',
    category: 'lugar',
    likes: 42,
    timestamp: Date.now() - 3600000 * 3
  },
  {
    id: 4,
    url: 'assets/images/dresscode_women.jpg',
    author: 'Inspiración',
    caption: 'Lookbook damas: elegancia primaveral 🌸',
    category: 'invitados',
    likes: 21,
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 5,
    url: 'assets/images/dresscode_men.jpg',
    author: 'Inspiración',
    caption: 'Lookbook varones: tonos lino & contemporáneos 👔',
    category: 'invitados',
    likes: 25,
    timestamp: Date.now() - 3600000
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
  const grid = document.getElementById('gallery-grid') || document.getElementById('polaroid-grid');
  if (!grid) return;

  if (photos.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 2rem;">Aún no hay fotos en esta categoría. ¡Sé el primero en subir una!</p>';
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

  // Attach Lightbox click
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
  // Filters
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      loadPhotos(cat);
    });
  });

  // Photo Upload
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
          author: 'Invitado Especial',
          caption: 'Foto compartida con amor 💕',
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

  // Lightbox close
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
