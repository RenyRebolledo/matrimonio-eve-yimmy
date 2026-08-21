/**
 * EVELYN & YIMMY - WEDDING INVITATION
 * Collaborative Live Photo Album (IndexedDB + Polaroid Cards + Lightbox)
 */

const DB_NAME = 'EveYimmyWeddingAlbum';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

let db = null;
let currentPhotos = [];
let currentLightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  initIndexedDB().then(() => {
    loadPhotos();
  });
  initGalleryEvents();
});

/* ==========================================================================
   1. INDEXEDDB SETUP
   ========================================================================== */
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
      console.error('IndexedDB error:', e);
      reject(e);
    };
  });
}

/* ==========================================================================
   2. SEED INITIAL SAMPLE PHOTOS & LOAD
   ========================================================================== */
const INITIAL_PHOTOS = [
  {
    id: 1,
    url: 'assets/images/couple_portrait.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'Comenzando el viaje de nuestras vidas ✈️💍',
    category: 'ceremonia',
    likes: 24,
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 2,
    url: 'assets/images/venue_casapirque.jpg',
    author: 'Los Novios',
    caption: 'El hermoso paisaje de Casa Pirque 🏔️✨',
    category: 'ceremonia',
    likes: 19,
    timestamp: Date.now() - 3600000 * 4
  },
  {
    id: 3,
    url: 'assets/images/picnic_lawn.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'Listos para el momento picnic y manta en el pasto 🧺🌿',
    category: 'picnic',
    likes: 31,
    timestamp: Date.now() - 3600000 * 3
  },
  {
    id: 4,
    url: 'assets/images/dresscode_women.jpg',
    author: 'Inspiración',
    caption: 'Lookbook invitadas: elegancia campestre 🌸',
    category: 'amigos',
    likes: 15,
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 5,
    url: 'assets/images/dresscode_men.jpg',
    author: 'Inspiración',
    caption: 'Lookbook invitados: tonos lino & navy 👔',
    category: 'amigos',
    likes: 18,
    timestamp: Date.now() - 3600000
  }
];

function loadPhotos(filterCategory = 'todos') {
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const getAllRequest = store.getAll();

  getAllRequest.onsuccess = (e) => {
    let photos = e.target.result || [];
    
    // If database is empty on first load, seed with initial photos
    if (photos.length === 0) {
      seedInitialPhotos().then(() => {
        loadPhotos(filterCategory);
      });
      return;
    }

    // Sort newest first
    photos.sort((a, b) => b.timestamp - a.timestamp);
    currentPhotos = photos;

    // Filter
    let filtered = photos;
    if (filterCategory !== 'todos') {
      filtered = photos.filter(p => p.category === filterCategory);
    }

    renderPolaroidGrid(filtered);
  };
}

function seedInitialPhotos() {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    INITIAL_PHOTOS.forEach(photo => store.add(photo));
    transaction.oncomplete = () => resolve();
  });
}

/* ==========================================================================
   3. RENDER POLAROID GRID
   ========================================================================== */
function renderPolaroidGrid(photos) {
  const grid = document.getElementById('polaroid-grid');
  const emptyState = document.getElementById('album-empty-state');

  if (!grid) return;

  if (photos.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = photos.map((photo, index) => {
    const rot = ((index % 5) - 2) * 1.5; // subtle tilt between -3deg and +3deg
    return `
      <div class="polaroid-card" style="--random-rotate: ${rot / 4 + 0.5}" data-id="${photo.id}" data-index="${index}">
        <div class="polaroid-img-wrap" onclick="openLightbox(${photo.id})">
          <img src="${photo.url}" alt="${escapeHtml(photo.caption)}" loading="lazy">
        </div>
        <div class="polaroid-caption">
          <div class="polaroid-text">${escapeHtml(photo.caption || 'Recuerdos de Amor')}</div>
          <div class="polaroid-meta">
            <span>Por: <strong>${escapeHtml(photo.author || 'Invitado')}</strong></span>
            <button class="polaroid-like-btn" onclick="toggleLike(event, ${photo.id})">
              <i class="ri-heart-fill"></i> <span>${photo.likes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   4. UPLOAD PHOTOS MODAL & HANDLER
   ========================================================================== */
function initGalleryEvents() {
  const uploadModal = document.getElementById('upload-photo-modal');
  const openModalBtn = document.getElementById('btn-open-upload-modal');
  const closeModalBtn = document.getElementById('btn-close-upload-modal');
  const uploadForm = document.getElementById('photo-upload-form');
  const fileInput = document.getElementById('photo-file-input');
  const previewContainer = document.getElementById('photo-preview-box');

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

  if (openModalBtn && uploadModal) {
    openModalBtn.addEventListener('click', () => {
      uploadModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeModalBtn && uploadModal) {
    closeModalBtn.addEventListener('click', () => {
      uploadModal.classList.remove('open');
      document.body.style.overflow = '';
      if (uploadForm) uploadForm.reset();
      if (previewContainer) previewContainer.innerHTML = '';
    });
  }

  // Image preview on file selection
  if (fileInput && previewContainer) {
    fileInput.addEventListener('change', () => {
      previewContainer.innerHTML = '';
      const files = Array.from(fileInput.files);
      if (files.length === 0) return;

      files.slice(0, 4).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '70px';
          img.style.height = '70px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '4px';
          img.style.border = '1px solid #d4c5a9';
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Submit Upload Form
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const author = document.getElementById('photo-author-input').value.trim() || 'Invitado Especial';
      const caption = document.getElementById('photo-caption-input').value.trim() || '¡Vivan los novios!';
      const category = document.getElementById('photo-category-select').value || 'fiesta';
      const files = fileInput.files;

      if (!files || files.length === 0) {
        alert('Por favor selecciona al menos una foto para subir.');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64Url = await readFileAsBase64(file);

        const newPhoto = {
          url: base64Url,
          author,
          caption,
          category,
          likes: 0,
          timestamp: Date.now() + i
        };

        await savePhotoToDb(newPhoto);
      }

      uploadModal.classList.remove('open');
      document.body.style.overflow = '';
      uploadForm.reset();
      if (previewContainer) previewContainer.innerHTML = '';
      
      loadPhotos();
      alert('¡Tu foto se ha publicado con éxito en el Muro de Recuerdos! 📸🎉');
    });
  }

  // Lightbox Close
  const lightbox = document.getElementById('photo-lightbox-modal');
  const closeLightboxBtn = document.getElementById('btn-close-lightbox');
  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function savePhotoToDb(photo) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('No DB');
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(photo);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e);
  });
}

/* ==========================================================================
   5. LIKE COUNTER & LIGHTBOX
   ========================================================================== */
window.toggleLike = function(event, photoId) {
  event.stopPropagation();
  if (!db) return;

  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const getRequest = store.get(photoId);

  getRequest.onsuccess = (e) => {
    const photo = e.target.result;
    if (photo) {
      photo.likes = (photo.likes || 0) + 1;
      store.put(photo);
      loadPhotos();
    }
  };
};

window.openLightbox = function(photoId) {
  const photo = currentPhotos.find(p => p.id === photoId);
  if (!photo) return;

  const lightbox = document.getElementById('photo-lightbox-modal');
  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const authorEl = document.getElementById('lightbox-author');
  const downloadLink = document.getElementById('lightbox-download-btn');

  if (imgEl) imgEl.src = photo.url;
  if (captionEl) captionEl.textContent = photo.caption;
  if (authorEl) authorEl.textContent = `Subida por: ${photo.author}`;
  if (downloadLink) {
    downloadLink.href = photo.url;
    downloadLink.download = `Recuerdo_Boda_Evelyn_Yimmy_${photo.id}.jpg`;
  }

  if (lightbox) {
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
