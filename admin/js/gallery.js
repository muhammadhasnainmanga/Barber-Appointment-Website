// ============================================
// SZCUTZ Admin — Gallery (frontend-only for now)
// Progress bar is simulated (setInterval) since there's no real
// upload yet — once Cloudinary is wired up, this becomes actual
// upload-progress from the request, same UI stays.
// ============================================
import {protectedFetch} from "./auth.ClientApi.js";

let galleryItems = [];
let editingGalleryId = null;
let deletingGalleryId = null;
let selectedFileDataUrl = null;   // holds the FileReader result until submit

const galleryForm = document.getElementById('galleryForm');
const galleryImageInput = document.getElementById('galleryImageInput');
const galleryFileName = document.getElementById('galleryFileName');
const galleryLabelInput = document.getElementById('galleryLabelInput');
const galleryGrid = document.getElementById('galleryGrid');
const galleryAddBtn = document.getElementById('galleryAddBtn');
const formMessageGallery = document.getElementById('formMessage-gallery');
const formMessageEditLabel = document.getElementById('formMessage-editlabel');

const uploadProgress = document.getElementById('uploadProgress');
const uploadProgressFill = document.getElementById('uploadProgressFill');
const uploadProgressLabel = document.getElementById('uploadProgressLabel');

const editGalleryModal = document.getElementById('editGalleryModal');
const editGalleryForm = document.getElementById('editGalleryForm');
const cancelEditGalleryBtn = document.getElementById('cancelEditGalleryBtn');

const deleteGalleryModal = document.getElementById('deleteGalleryModal');
const confirmDeleteGalleryBtn = document.getElementById('confirmDeleteGalleryBtn');
const cancelDeleteGalleryBtn = document.getElementById('cancelDeleteGalleryBtn');

function showFormMessage(el, message, type = 'error') {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('form-message-success', 'form-message-error');
  el.classList.add(type === 'success' ? 'form-message-success' : 'form-message-error');
  el.hidden = false;
}

function clearFormMessage(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('form-message-success', 'form-message-error');
  el.hidden = true;
}

function playReveal(container) {
  if (!container) return;
  const els = container.querySelectorAll('[data-reveal]');
  els.forEach((el) => el.classList.remove('is-visible'));
  void container.offsetHeight; // forces the reset above to commit before we re-add the class
  els.forEach((el) => {
    const delay = Number(el.dataset.delay ?? 0);
    setTimeout(() => el.classList.add('is-visible'), delay);
  });
}

// ---------- File select → thumbnail + filename inside the dropzone itself ----------
galleryImageInput.addEventListener('change', () => {
  const file = galleryImageInput.files[0];

  if (!file) {
    galleryFileName.textContent = 'Choose a Photo';
    document
      .getElementById('fileDropzone')
      .classList.remove('has-file');
    selectedFileDataUrl = null;

    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedFileDataUrl = e.target.result;
    galleryFileName.textContent = file.name;

    document
      .getElementById('fileDropzone')
      .classList.add('has-file');
  };

  reader.readAsDataURL(file);
});


// ---------- Render ----------
function renderGallery() {
  if (galleryItems.length === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-empty-state" data-reveal data-delay="180">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>No gallery photos available yet.</p>
      </div>`;
    playReveal(galleryGrid);
    return;
  }

  galleryGrid.innerHTML = galleryItems
    .map(
      (item) => `
      <div class="gallery-card" data-reveal data-delay="${(galleryItems.indexOf(item) + 1) * 180}">
        <img class="gallery-card-image" src="${item.image_url}" alt="${item.label}" />
        <div class="gallery-card-body">
          <span class="gallery-card-label">${item.label}</span>
          <div class="gallery-card-actions">
            <button class="btn btn-outline btn-sm" onclick="openEditGalleryModal(${item.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteGalleryModal(${item.id})">Delete</button>
          </div>
        </div>
      </div>`
    )
    .join('');

  playReveal(galleryGrid);
}

//upload hone ke bad form reset
function resetGalleryForm() {
  galleryForm.reset();

  galleryFileName.textContent = 'Choose a Photo';
  document
    .getElementById('fileDropzone')
    .classList.remove('has-file');

  selectedFileDataUrl = null;
}

// ---------- Add ----------
async function uploadWithProgress(formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:4000/api/v1/gallery/add', true);
    xhr.withCredentials = true;   // cookies bhejne ke liye (auth token)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        uploadProgressFill.style.width = `${percent}%`;
        uploadProgressLabel.textContent = `Uploading… ${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText)?.message || 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

galleryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormMessage(formMessageGallery);

  const file = galleryImageInput.files[0];
  const label = galleryLabelInput.value.trim();

  if (!selectedFileDataUrl || !file) {
    showFormMessage(formMessageGallery, 'Please upload an image.', 'error');
    return;
  }

  if (!label) {
    showFormMessage(formMessageGallery, 'Please add a caption.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);       // 🔧 yeh naam ('image') Multer + route mein bhi match hona chahiye
  formData.append('caption', label);

  uploadProgress.hidden = false;
  galleryAddBtn.disabled = true;

  try {
    await uploadWithProgress(formData);
    galleryItems = await getGalleryFromServer();   // server hi source-of-truth — refetch karo
    renderGallery();
    resetGalleryForm();
  } catch (error) {
    showFormMessage(formMessageGallery, error.message, 'error');
  } finally {
    uploadProgress.hidden = true;
    uploadProgressFill.style.width = '0%';
    galleryAddBtn.disabled = false;
  }
});

async function getGalleryFromServer() {
  try {
    const response = await protectedFetch('http://localhost:4000/api/v1/gallery/get-all', { method: 'GET' });
    const result = await response.json();
    if (!response.ok) return [];
    return result;
  } catch (error) {
    console.log(error.message);
    return [];
  }
}

// ---------- Edit flow ----------
function openEditGalleryModal(id) {
  const item = galleryItems.find((g) => g.id === id);
  if (!item) return;

  editingGalleryId = id;
  document.getElementById('editGalleryLabel').value = item.label;
  editGalleryModal.classList.add('is-open');
  playReveal(editGalleryModal);
}

function closeEditGalleryModal() {
  editGalleryModal.classList.remove('is-open');
  editingGalleryId = null;
}

editGalleryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newLabel = document.getElementById('editGalleryLabel').value.trim();
  if (!newLabel) return;

  try {
    const response = await protectedFetch(`http://localhost:4000/api/v1/gallery/edit-label/${editingGalleryId}`,{
        method: 'PATCH',
        body: {
          newLabel: newLabel
        }
    });

    if(response.ok){
        galleryItems = await getGalleryFromServer();
        renderGallery();
        closeEditGalleryModal();
    }else{
        showFormMessage(formMessageEditLabel, "Failed to edit - Try again", 'error');
        setInterval(() => {
            clearFormMessage(formMessageEditLabel);
        },3000);
        console.log("Failed to edit file label", response);
    }
  } catch (error) {
    console.log(error.message || "Failed to edit file label");
  }
});

cancelEditGalleryBtn.addEventListener('click', closeEditGalleryModal);

// ---------- Delete flow ----------
function openDeleteGalleryModal(id) {
  deletingGalleryId = id;
  deleteGalleryModal.classList.add('is-open');
  playReveal(deleteGalleryModal);
}

function closeDeleteGalleryModal() {
  deleteGalleryModal.classList.remove('is-open');
  deletingGalleryId = null;
}

confirmDeleteGalleryBtn.addEventListener('click', async  () => {
  try {
    const response = await protectedFetch(`http://localhost:4000/api/v1/gallery/delete/${deletingGalleryId}`,{
        method: 'DELETE'
    });

    if(response.ok){
        galleryItems = await getGalleryFromServer();
        renderGallery();
    }else{
        console.log("Failed to delete file", response);
    }
  } catch (error) {
    console.log(error.message || "Failed to delete file");
  }
  closeDeleteGalleryModal();
});

cancelDeleteGalleryBtn.addEventListener('click', closeDeleteGalleryModal);

// ---------- Init ----------
(async () => {
galleryItems = await getGalleryFromServer();
renderGallery();
})();

window.openEditGalleryModal = openEditGalleryModal;
window.openDeleteGalleryModal = openDeleteGalleryModal;