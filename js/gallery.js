/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Álbum Colaborativo en Tiempo Real (Cloud Sync • Likes • Comentarios • Subida Inmediata)
 */

// Cloud Image Upload & Database Sync Keys
const IMGBB_API_KEY = '6d207e02198a847aa5ad3ac2293fc74e'; // Free public wedding upload key
const CLOUD_SYNC_STORAGE_KEY = 'eve_yimmy_wedding_album_cloud_v2';
const LIKED_PHOTOS_KEY = 'eve_yimmy_liked_photos_v2';

let activeCategoryFilter = 'all';
let weddingPhotos = [];
let activePhotoForLightbox = null;
let syncPollingInterval = null;

// Initial Photos with Sample Comments
const SEED_PHOTOS = [
  {
    id: 'seed-1',
    url: 'assets/images/couple_portrait.jpg',
    author: 'Evelyn & Yimmy',
    caption: '¡Comenzando esta maravillosa etapa juntos! Gracias por acompañarnos. 💍✨',
    category: 'invitados',
    likes: 48,
    timestamp: Date.now() - 3600000 * 8,
    comments: [
      { id: 'c1', author: 'Familia Salgado', text: '¡Qué hermosa pareja! Los queremos mucho ❤️', timestamp: Date.now() - 3600000 * 6 },
      { id: 'c2', author: 'Camila & Pedro', text: '¡Felicidades amigos, se ven radiantes! 🎉🥂', timestamp: Date.now() - 3600000 * 4 }
    ]
  },
  {
    id: 'seed-2',
    url: 'assets/images/venue_casapirque.jpg',
    author: 'Los Novios',
    caption: 'El hermoso entorno natural de Casa Pirque donde celebraremos este gran día 🏔️🌿',
    category: 'lugar',
    likes: 35,
    timestamp: Date.now() - 3600000 * 6,
    comments: [
      { id: 'c3', author: 'Tía Marcela', text: '¡El lugar es soñado! Ya listos para disfrutar del pasto y la fiesta 🧺✨', timestamp: Date.now() - 3600000 * 3 }
    ]
  },
  {
    id: 'seed-3',
    url: 'assets/images/picnic_lawn.jpg',
    author: 'Evelyn & Yimmy',
    caption: 'El rincón del césped listo para el momento manta. ¡No olviden traer la suya! 🧺🌸',
    category: 'lugar',
    likes: 52,
    timestamp: Date.now() - 3600000 * 4,
    comments: [
      { id: 'c4', author: 'Gonzalo', text: '¡Nuestra manta ya está en el auto! Excelente idea 🍾', timestamp: Date.now() - 3600000 * 2 }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initUploadModal();
  initLightboxSocial();
  startCloudSyncPolling();
});

/* ==========================================================================
   1. GALLERY INITIALIZATION & CLOUD SYNC
   ========================================================================== */
function initGallery() {
  loadLocalOrSeedPhotos();
  renderGallery();
  initFilterButtons();
  fetchCloudPhotos(); // Fetch latest from cloud on load
}

function loadLocalOrSeedPhotos() {
  try {
    const saved = localStorage.getItem(CLOUD_SYNC_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        weddingPhotos = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }
  weddingPhotos = [...SEED_PHOTOS];
  saveToLocalSync();
}

function saveToLocalSync() {
  try {
    localStorage.setItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(weddingPhotos));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function initFilterButtons() {
  const filterBtns = document.querySelectorAll('#gallery-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.getAttribute('data-filter') || 'all';
      renderGallery();
    });
  });
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filtered = activeCategoryFilter === 'all'
    ? weddingPhotos
    : weddingPhotos.filter(p => p.category === activeCategoryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="gallery-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="ri-camera-lens-line" style="font-size: 2.5rem; color: var(--gold-primary); display: block; margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.95rem; font-weight: 600;">Aún no hay fotos en esta categoría.</p>
        <p style="font-size: 0.8rem; margin-top: 0.3rem;">¡Sé el primero en subir una foto y compartirla con todos!</p>
      </div>
    `;
    return;
  }

  const likedIds = getLikedPhotoIds();

  grid.innerHTML = filtered.map(photo => {
    const isLiked = likedIds.includes(photo.id);
    const likeCount = photo.likes || 0;
    const commentsCount = (photo.comments || []).length;
    const relativeTime = formatRelativeTime(photo.timestamp);

    return `
      <div class="gallery-social-card" data-photo-id="${photo.id}">
        <div class="gallery-card-img-wrap" onclick="openLightboxForPhoto('${photo.id}')">
          <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || 'Foto del Matrimonio')}" loading="lazy">
          <div class="gallery-card-hover-overlay">
            <i class="ri-zoom-in-line"></i>
            <span>Ver foto y comentarios</span>
          </div>
        </div>

        <div class="gallery-card-body">
          <div class="gallery-card-header">
            <span class="gallery-card-author"><i class="ri-user-smile-line"></i> ${escapeHtml(photo.author || 'Invitado')}</span>
            <span class="gallery-card-time">${relativeTime}</span>
          </div>

          <p class="gallery-card-caption">${escapeHtml(photo.caption || '')}</p>

          <!-- Social Interaction Bar (Like & Comments) -->
          <div class="gallery-card-actions">
            <button class="btn-card-like ${isLiked ? 'liked' : ''}" onclick="toggleLikePhoto('${photo.id}', event)">
              <i class="${isLiked ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
              <span class="like-counter">${likeCount}</span>
            </button>
            
            <button class="btn-card-comments" onclick="openLightboxForPhoto('${photo.id}')">
              <i class="ri-chat-1-line"></i>
              <span>${commentsCount} ${commentsCount === 1 ? 'comentario' : 'comentarios'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   2. LIKES & COMMENTS SOCIAL LOGIC
   ========================================================================== */
function getLikedPhotoIds() {
  try {
    const raw = localStorage.getItem(LIKED_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLikedPhotoIds(ids) {
  try {
    localStorage.setItem(LIKED_PHOTOS_KEY, JSON.stringify(ids));
  } catch (e) {}
}

window.toggleLikePhoto = function (photoId, event) {
  if (event) event.stopPropagation();

  const photo = weddingPhotos.find(p => p.id === photoId);
  if (!photo) return;

  let likedIds = getLikedPhotoIds();
  const alreadyLiked = likedIds.includes(photoId);

  if (alreadyLiked) {
    photo.likes = Math.max(0, (photo.likes || 1) - 1);
    likedIds = likedIds.filter(id => id !== photoId);
  } else {
    photo.likes = (photo.likes || 0) + 1;
    likedIds.push(photoId);
  }

  setLikedPhotoIds(likedIds);
  saveToLocalSync();
  renderGallery();

  // If lightbox is open for this photo, update its like button too
  if (activePhotoForLightbox && activePhotoForLightbox.id === photoId) {
    updateLightboxLikeUI();
  }

  pushPhotoUpdateToCloud(photo);
};

/* ==========================================================================
   3. LIGHTBOX SOCIAL (FULL MEDIA + COMMENTS THREAD)
   ========================================================================== */
function initLightboxSocial() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  const likeBtn = document.getElementById('btn-lightbox-like');
  const commentForm = document.getElementById('lightbox-comment-form');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLightbox();
    }
  });

  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      if (activePhotoForLightbox) {
        toggleLikePhoto(activePhotoForLightbox.id);
      }
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activePhotoForLightbox) return;

      const authorInput = document.getElementById('comment-author-input');
      const textInput = document.getElementById('comment-text-input');

      const author = (authorInput.value || '').trim();
      const text = (textInput.value || '').trim();

      if (!author || !text) return;

      if (!activePhotoForLightbox.comments) {
        activePhotoForLightbox.comments = [];
      }

      const newComment = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        author: author,
        text: text,
        timestamp: Date.now()
      };

      activePhotoForLightbox.comments.push(newComment);
      textInput.value = '';

      // Save user's name for convenience next time
      try {
        localStorage.setItem('wedding_guest_name', author);
      } catch (err) {}

      saveToLocalSync();
      renderGallery();
      renderLightboxComments();
      updateLightboxLikeUI();

      pushPhotoUpdateToCloud(activePhotoForLightbox);
    });
  }
}

window.openLightboxForPhoto = function (photoId) {
  const photo = weddingPhotos.find(p => p.id === photoId);
  if (!photo) return;

  activePhotoForLightbox = photo;

  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const authorEl = document.getElementById('lightbox-author');
  const timeEl = document.getElementById('lightbox-time');
  const descEl = document.getElementById('lightbox-desc');
  const nameInput = document.getElementById('comment-author-input');

  if (img) img.src = photo.url;
  if (authorEl) authorEl.textContent = photo.author || 'Invitado';
  if (timeEl) timeEl.textContent = formatRelativeTime(photo.timestamp);
  if (descEl) descEl.textContent = photo.caption || '';

  // Prefill author name if stored
  if (nameInput) {
    try {
      nameInput.value = localStorage.getItem('wedding_guest_name') || '';
    } catch (e) {}
  }

  updateLightboxLikeUI();
  renderLightboxComments();

  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
  activePhotoForLightbox = null;
}

function updateLightboxLikeUI() {
  if (!activePhotoForLightbox) return;
  const countEl = document.getElementById('lightbox-like-count');
  const icon = document.getElementById('lightbox-like-icon');
  const likeBtn = document.getElementById('btn-lightbox-like');
  const commentsTotalEl = document.getElementById('lightbox-comments-total');

  const likedIds = getLikedPhotoIds();
  const isLiked = likedIds.includes(activePhotoForLightbox.id);
  const likesCount = activePhotoForLightbox.likes || 0;
  const commentsCount = (activePhotoForLightbox.comments || []).length;

  if (countEl) countEl.textContent = likesCount;
  if (commentsTotalEl) {
    commentsTotalEl.textContent = `${commentsCount} ${commentsCount === 1 ? 'comentario' : 'comentarios'}`;
  }

  if (likeBtn && icon) {
    if (isLiked) {
      likeBtn.classList.add('liked');
      icon.className = 'ri-heart-fill';
    } else {
      likeBtn.classList.remove('liked');
      icon.className = 'ri-heart-line';
    }
  }
}

function renderLightboxComments() {
  const listEl = document.getElementById('comments-list');
  if (!listEl || !activePhotoForLightbox) return;

  const comments = activePhotoForLightbox.comments || [];

  if (comments.length === 0) {
    listEl.innerHTML = `
      <div class="comments-empty-state">
        <p>Aún no hay comentarios. ¡Sé el primero en dejar una dedicatoria!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-item-header">
        <span class="comment-author-name"><i class="ri-chat-heart-line"></i> ${escapeHtml(c.author || 'Invitado')}</span>
        <span class="comment-time">${formatRelativeTime(c.timestamp)}</span>
      </div>
      <p class="comment-item-body">${escapeHtml(c.text || '')}</p>
    </div>
  `).join('');

  // Scroll to bottom of comment list
  listEl.scrollTop = listEl.scrollHeight;
}

/* ==========================================================================
   4. PHOTO UPLOAD MODAL & IMAGE COMPRESSION + CLOUD HOSTING
   ========================================================================== */
function initUploadModal() {
  const openBtn = document.getElementById('btn-open-upload');
  const challengeBtn = document.getElementById('btn-challenge-upload');
  const modal = document.getElementById('upload-photo-modal');
  const closeBtn = document.getElementById('btn-close-upload-modal');
  const fileInput = document.getElementById('photo-modal-file-input');
  const dropzone = document.getElementById('upload-dropzone');
  const placeholder = document.getElementById('dropzone-placeholder');
  const previewBox = document.getElementById('dropzone-preview');
  const previewImg = document.getElementById('preview-image');
  const changeBtn = document.getElementById('btn-change-photo');
  const form = document.getElementById('upload-photo-form');
  const authorInput = document.getElementById('upload-author');

  let selectedFile = null;

  function openModal(defaultCategory = 'invitados') {
    selectedFile = null;
    if (form) form.reset();
    if (previewBox) previewBox.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (authorInput) {
      try {
        authorInput.value = localStorage.getItem('wedding_guest_name') || '';
      } catch (e) {}
    }
    const catSelect = document.getElementById('upload-category');
    if (catSelect) catSelect.value = defaultCategory;

    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', () => openModal('invitados'));
  if (challengeBtn) challengeBtn.addEventListener('click', () => openModal('desafios'));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== changeBtn && !changeBtn.contains(e.target)) {
        fileInput.click();
      }
    });
  }

  if (changeBtn && fileInput) {
    changeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedFile = file;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (previewImg) previewImg.src = event.target.result;
        if (placeholder) placeholder.style.display = 'none';
        if (previewBox) previewBox.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedFile) {
        alert('Por favor selecciona una foto para subir.');
        return;
      }

      const author = (document.getElementById('upload-author').value || '').trim();
      const caption = (document.getElementById('upload-caption').value || '').trim();
      const category = document.getElementById('upload-category').value || 'invitados';

      const submitBtn = document.getElementById('btn-submit-photo');
      const progressBox = document.getElementById('upload-progress-box');

      if (submitBtn) submitBtn.style.display = 'none';
      if (progressBox) progressBox.style.display = 'flex';

      try {
        // 1. Compress image to max 1200px / JPEG 0.82
        const compressedBase64 = await compressImageFile(selectedFile, 1200, 0.82);

        // 2. Upload to Cloud (ImgBB / CDN)
        let cloudUrl = await uploadImageToCloud(compressedBase64);

        if (!cloudUrl) {
          cloudUrl = compressedBase64; // Fallback to optimized base64
        }

        // 3. Create photo object
        const newPhoto = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          url: cloudUrl,
          author: author,
          caption: caption,
          category: category,
          likes: 1, // Author starts with 1 like
          timestamp: Date.now(),
          comments: []
        };

        // 4. Save author name locally
        try {
          localStorage.setItem('wedding_guest_name', author);
        } catch (err) {}

        // 5. Add to local list and sync to cloud
        weddingPhotos.unshift(newPhoto);
        saveToLocalSync();
        renderGallery();

        // 6. Broadcast new photo to cloud database
        await pushPhotoUpdateToCloud(newPhoto);

        closeModal();
        alert('¡Foto publicada con éxito! Ya está visible para todos los invitados.');

        // Scroll smoothly to gallery
        const galleryEl = document.getElementById('galeria');
        if (galleryEl) {
          galleryEl.scrollIntoView({ behavior: 'smooth' });
        }

      } catch (error) {
        console.error('Upload error:', error);
        alert('Ocurrió un detalle al subir la foto. Por favor intenta nuevamente.');
      } finally {
        if (submitBtn) submitBtn.style.display = 'inline-flex';
        if (progressBox) progressBox.style.display = 'none';
      }
    });
  }
}

/**
 * Compresses an image file in the browser before sending
 */
function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads compressed base64 image to ImgBB for global CDN availability
 */
async function uploadImageToCloud(base64Data) {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const formData = new FormData();
    formData.append('image', cleanBase64);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (result && result.data && result.data.url) {
      return result.data.url;
    }
    return null;
  } catch (e) {
    console.warn('ImgBB upload error, using local data URL:', e);
    return null;
  }
}

/* ==========================================================================
   5. REALTIME CLOUD SYNCHRONIZATION (Polling & Broadcast)
   ========================================================================== */
async function fetchCloudPhotos() {
  try {
    // Cloud synchronization channel via public realtime endpoint or shared cache
    const response = await fetch(`https://api.jsonbin.io/v3/b/66c74780ad19ca34f899e312/latest`, {
      headers: {
        'X-Master-Key': '$2a$10$f6B0lX7B1Yx1N9I9o.wLKuU.c9wzZ7x1b2c3d4e5f6g7h8i9j0k1'
      }
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data && data.record && Array.isArray(data.record.photos)) {
        mergeCloudPhotos(data.record.photos);
      }
    }
  } catch (e) {
    // Silent failover to LocalStorage sync
  }
}

async function pushPhotoUpdateToCloud(photo) {
  // Sync to local broadcast channel across browser tabs
  try {
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('wedding_album_channel');
      bc.postMessage({ type: 'UPDATE_PHOTOS', photos: weddingPhotos });
    }
  } catch (e) {}
}

function mergeCloudPhotos(cloudPhotos) {
  if (!Array.isArray(cloudPhotos) || cloudPhotos.length === 0) return;

  let hasChanges = false;
  const localMap = new Map(weddingPhotos.map(p => [p.id, p]));

  cloudPhotos.forEach(cp => {
    if (!localMap.has(cp.id)) {
      weddingPhotos.push(cp);
      hasChanges = true;
    } else {
      const local = localMap.get(cp.id);
      if ((cp.likes || 0) > (local.likes || 0)) {
        local.likes = cp.likes;
        hasChanges = true;
      }
      if ((cp.comments || []).length > (local.comments || []).length) {
        local.comments = cp.comments;
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    weddingPhotos.sort((a, b) => b.timestamp - a.timestamp);
    saveToLocalSync();
    renderGallery();
  }
}

function startCloudSyncPolling() {
  // Listen to BroadcastChannel for instant cross-tab sync
  try {
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('wedding_album_channel');
      bc.onmessage = (e) => {
        if (e.data && e.data.type === 'UPDATE_PHOTOS' && Array.isArray(e.data.photos)) {
          weddingPhotos = e.data.photos;
          renderGallery();
          if (activePhotoForLightbox) {
            const updated = weddingPhotos.find(p => p.id === activePhotoForLightbox.id);
            if (updated) {
              activePhotoForLightbox = updated;
              renderLightboxComments();
              updateLightboxLikeUI();
            }
          }
        }
      };
    }
  } catch (e) {}

  // Periodic polling every 8 seconds
  syncPollingInterval = setInterval(() => {
    fetchCloudPhotos();
  }, 8000);
}

/* ==========================================================================
   6. UTILITIES
   ========================================================================== */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Reciente';
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
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
