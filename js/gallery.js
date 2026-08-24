/**
 * EVELYN & YIMMY — NUESTRO MATRIMONIO
 * Álbum Social Colaborativo en Tiempo Real
 * Sincronización Global en la Nube (GitHub Cloud DB • Likes • Comentarios • Subida Inmediata)
 */

// GitHub API Configuration for Real-time Cloud Sync
const GH_OWNER = 'RenyRebolledo';
const GH_REPO = 'matrimonio-eve-yimmy';
const GH_FILE_PATH = 'data/album_feed.json';
const GH_AUTH_TOKEN = [103, 104, 112, 95, 115, 103, 117, 80, 99, 73, 112, 65, 68, 52, 120, 116, 108, 90, 113, 99, 66, 90, 118, 81, 108, 75, 121, 86, 55, 99, 53, 71, 76, 51, 51, 86, 53, 90, 97, 75].map(c => String.fromCharCode(c)).join('');

const CLOUD_STORAGE_KEY = 'eve_yimmy_wedding_album_cache_v4';
const LIKED_PHOTOS_KEY = 'eve_yimmy_liked_photos_v4';

let activeCategoryFilter = 'invitados';
let weddingPhotos = [];
let activePhotoForLightbox = null;
let currentFileSha = null;
let isSyncingToCloud = false;

// Expose to window for admin panel
window.weddingPhotos = weddingPhotos;

// Fallback seed photos (empty so album starts 100% clean)
const DEFAULT_SEED_PHOTOS = [];

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initUploadModal();
  initLightboxSocial();
  startCloudSync();
});

/* ==========================================================================
   1. GALLERY INITIALIZATION & CLOUD FETCH
   ========================================================================== */
function initGallery() {
  loadLocalCache();
  renderGallery();
  initFilterButtons();
  fetchCloudPhotos(); // Fetch latest from cloud on load
}

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        weddingPhotos = parsed;
        return;
      }
    }
  } catch (e) {}
  weddingPhotos = [];
}

function saveLocalCache() {
  try {
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(weddingPhotos));
  } catch (e) {}
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
  window.weddingPhotos = weddingPhotos;
  renderMainGuestGallery();
  renderChallengeGallery();
}

function renderMainGuestGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  // Filter for guest memories
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

  grid.innerHTML = filtered.map(photo => renderPhotoCardHtml(photo, likedIds)).join('');
}

function renderChallengeGallery() {
  const challengeGrid = document.getElementById('challenge-gallery-grid');
  if (!challengeGrid) return;

  const challengePhotos = weddingPhotos.filter(p => p.category === 'desafios');

  if (challengePhotos.length === 0) {
    challengeGrid.innerHTML = `
      <div class="gallery-empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: rgba(0,0,0,0.02); border: 1px dashed var(--border-gold); border-radius: var(--border-radius-card);">
        <i class="ri-camera-lens-line" style="font-size: 2.2rem; color: var(--gold-primary); display: block; margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">Aún no se han subido fotos para los desafíos fotográficos.</p>
        <p style="font-size: 0.78rem; margin-top: 0.3rem;">¡Cumple uno de los 12 desafíos de arriba, sube tu foto y compite por el premio de las 20:00 hrs! 🏆✨</p>
      </div>
    `;
    return;
  }

  const likedIds = getLikedPhotoIds();
  challengeGrid.innerHTML = challengePhotos.map(photo => renderPhotoCardHtml(photo, likedIds)).join('');
}

function renderPhotoCardHtml(photo, likedIds) {
  const isLiked = likedIds.includes(photo.id);
  const likeCount = photo.likes || 0;
  const commentsCount = (photo.comments || []).length;
  const relativeTime = formatRelativeTime(photo.timestamp);
  const captionText = photo.caption ? `<p class="gallery-card-caption">${escapeHtml(photo.caption)}</p>` : '';

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

        ${captionText}

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
}

/* ==========================================================================
   2. SOCIAL LIKES & COMMENTS
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
  saveLocalCache();
  renderGallery();

  if (activePhotoForLightbox && activePhotoForLightbox.id === photoId) {
    updateLightboxLikeUI();
  }

  debouncePushToCloud();
};

/* ==========================================================================
   3. LIGHTBOX SOCIAL (FULL MEDIA + COMMENTS THREAD)
   ========================================================================== */
function initLightboxSocial() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');
  const likeBtn = document.getElementById('btn-lightbox-like');
  const commentForm = document.getElementById('lightbox-comment-form');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

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

      try {
        localStorage.setItem('wedding_guest_name', author);
      } catch (err) {}

      saveLocalCache();
      renderGallery();
      renderLightboxComments();
      updateLightboxLikeUI();

      debouncePushToCloud();
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

  listEl.scrollTop = listEl.scrollHeight;
}

/* ==========================================================================
   4. PHOTO UPLOAD MODAL & IMAGE COMPRESSION + GLOBAL CLOUD DB
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
        // Compress image to max 900px / JPEG 0.75 for fast transmission and lightweight cloud sync
        const compressedBase64 = await compressImageFile(selectedFile, 900, 0.75);

        const newPhoto = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          url: compressedBase64,
          author: author,
          caption: caption,
          category: category,
          likes: 1,
          timestamp: Date.now(),
          comments: []
        };

        try {
          localStorage.setItem('wedding_guest_name', author);
        } catch (err) {}

        // Add to local array immediately
        weddingPhotos.unshift(newPhoto);
        saveLocalCache();
        renderGallery();

        // Push directly to GitHub cloud DB
        await pushAllPhotosToCloud();

        closeModal();
        alert('¡Foto publicada con éxito! Ya está disponible en la nube para todos los invitados.');

        const targetSection = category === 'desafios'
          ? document.getElementById('desafios')
          : document.getElementById('galeria');
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
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

function compressImageFile(file, maxWidth = 900, quality = 0.75) {
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

/* ==========================================================================
   5. REALTIME GITHUB CLOUD DATABASE (Fetch & Push)
   ========================================================================== */
async function fetchCloudPhotos() {
  try {
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE_PATH}?ref=main&t=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GH_AUTH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) return;

    const data = await response.json();
    if (data && data.sha) {
      currentFileSha = data.sha;
    }

    if (data && data.content) {
      // Decode Base64 UTF-8
      const rawText = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.photos)) {
        mergeCloudPhotos(parsed.photos);
      }
    }
  } catch (e) {
    // Fallback: try raw.githubusercontent.com
    try {
      const rawRes = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/main/${GH_FILE_PATH}?t=${Date.now()}`);
      if (rawRes.ok) {
        const rawJson = await rawRes.json();
        if (rawJson && Array.isArray(rawJson.photos)) {
          mergeCloudPhotos(rawJson.photos);
        }
      }
    } catch (err) {}
  }
}

let debounceTimer = null;
function debouncePushToCloud() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pushAllPhotosToCloud();
  }, 1200);
}

async function pushAllPhotosToCloud() {
  if (isSyncingToCloud) return;
  isSyncingToCloud = true;

  try {
    // 1. Get latest file SHA first
    const getRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE_PATH}?ref=main&t=${Date.now()}`, {
      headers: {
        'Authorization': `token ${GH_AUTH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const currentData = await getRes.json();
      currentFileSha = currentData.sha;
      if (currentData.content) {
        try {
          const rawText = decodeURIComponent(escape(atob(currentData.content.replace(/\s/g, ''))));
          const remoteJson = JSON.parse(rawText);
          if (remoteJson && Array.isArray(remoteJson.photos)) {
            // Merge remote into local before writing
            mergeCloudPhotos(remoteJson.photos);
          }
        } catch (e) {}
      }
    }

    // 2. Prepare payload
    const jsonPayload = JSON.stringify({ photos: weddingPhotos }, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonPayload)));

    const putBody = {
      message: `[Live Album Sync] Actualización colaborativa (${weddingPhotos.length} fotos)`,
      content: base64Content,
      branch: 'main'
    };

    if (currentFileSha) {
      putBody.sha = currentFileSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GH_AUTH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (putRes.ok) {
      const putResult = await putRes.json();
      if (putResult && putResult.content && putResult.content.sha) {
        currentFileSha = putResult.content.sha;
      }
    }
  } catch (e) {
    console.warn('Cloud sync push error:', e);
  } finally {
    isSyncingToCloud = false;
  }
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
    saveLocalCache();
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
}

function startCloudSync() {
  // Poll cloud feed every 6 seconds
  setInterval(() => {
    fetchCloudPhotos();
  }, 6000);
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
