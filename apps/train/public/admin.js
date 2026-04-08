import { getSystemStatusApi, listProcessJobsApi, startFileProcessApi, uploadFileApi } from './admin-api.js';
import { showStatus } from './admin-feedback.js';
import {
  closeCreateModal,
  closeEditModal,
  createProfile,
  filterProfiles,
  goToPage,
  loadProfiles,
  openCreateModal,
  openEditModalById,
  saveProfile,
  toggleEditProfile,
} from './admin-profiles.js';

function switchTab(tab, tabElement) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));

  const currentTabElement = tabElement || document.querySelector(`.tab[onclick*="'${tab}'"]`);
  if (currentTabElement) currentTabElement.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

function updateFileInputText() {
  const fileInput = document.getElementById('fileInput');
  const fileInputText = document.getElementById('fileInputText');
  if (fileInput.files && fileInput.files.length > 0) {
    const count = fileInput.files.length;
    fileInputText.textContent = count === 1 ? fileInput.files[0].name : `${count} archivos seleccionados`;
    fileInputText.style.color = '#ececf7';
  } else {
    fileInputText.textContent = 'Ningun archivo seleccionado';
    fileInputText.style.color = '#8e8ea9';
  }
}

async function processFile(file, profileId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profileId', profileId);

  const uploadData = await uploadFileApi(formData);

  if (!uploadData.success) {
    throw new Error(uploadData.error || 'Error al subir');
  }

  const processData = await startFileProcessApi({
    fileId: uploadData.file.id,
    profileId: profileId,
  });

  if (!processData.success) {
    throw new Error(processData.error);
  }
}

async function uploadFiles() {
  const fileInput = document.getElementById('fileInput');
  const profileSelect = document.getElementById('profileSelect');

  if (!fileInput.files || fileInput.files.length === 0) {
    showStatus('Selecciona al menos un archivo', 'error', 'trainStatus');
    return;
  }
  if (!profileSelect.value) {
    showStatus('Selecciona un perfil', 'error', 'trainStatus');
    return;
  }

  const files = Array.from(fileInput.files);
  document.getElementById('profilesCard').style.display = 'none';
  showStatus('Procesando ' + files.length + ' archivo(s)...', 'info', 'trainStatus');

  for (let i = 0; i < files.length; i++) {
    try {
      await processFile(files[i], profileSelect.value);
    } catch (error) {
      showStatus('Error con ' + files[i].name + ': ' + error.message, 'error', 'trainStatus');
      document.getElementById('profilesCard').style.display = '';
      return;
    }
  }

  showStatus(files.length + ' archivo(s) enviados a procesamiento', 'success', 'trainStatus');
  loadJobs();
  document.getElementById('profilesCard').style.display = '';
}

async function uploadText() {
  const text = document.getElementById('textInput').value.trim();
  const profileSelect = document.getElementById('profileSelect');

  if (!text) {
    showStatus('Ingresa texto para procesar', 'error', 'trainStatus');
    return;
  }
  if (!profileSelect.value) {
    showStatus('Selecciona un perfil', 'error', 'trainStatus');
    return;
  }

  showStatus('Enviando texto a procesamiento...', 'info', 'trainStatus');

  try {
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'texto-' + Date.now() + '.txt', { type: 'text/plain' });

    await processFile(file, profileSelect.value);

    showStatus('Texto enviado a procesamiento exitosamente', 'success', 'trainStatus');
    document.getElementById('textInput').value = '';
    loadJobs();
  } catch (error) {
    showStatus('Error: ' + error.message, 'error', 'trainStatus');
  }
}

async function loadJobs() {
  try {
    const data = await listProcessJobsApi();

    const container = document.getElementById('jobsList');
    if (data.jobs && data.jobs.length > 0) {
      container.innerHTML = data.jobs
        .map(
          (job) =>
            '<div class="job-item"><div><strong>' +
            job.id.slice(0, 20) +
            '...</strong><br><small style="color: #8e8ea9;">Perfil: ' +
            job.profileId +
            '</small></div><span class="job-status ' +
            job.status +
            '">' +
            job.status +
            '</span></div>',
        )
        .join('');
    } else {
      container.innerHTML = '<p style="color: #8e8ea9; text-align: center;">No hay jobs activos</p>';
    }
  } catch {
    document.getElementById('jobsList').innerHTML = '<p style="color: #ff4c6b; text-align: center;">Error cargando jobs</p>';
  }
}

async function loadSystemStatus() {
  try {
    const data = await getSystemStatusApi();

    document.getElementById('systemStatus').innerHTML =
      '<p><strong>Estado:</strong> ' +
      data.status +
      '</p>' +
      '<p><strong>n8n Webhook:</strong> ' +
      data.n8nWebhook +
      '</p>' +
      '<p><strong>Upload Path:</strong> ' +
      data.uploadPath +
      '</p>';
  } catch {
    document.getElementById('systemStatus').innerHTML =
      '<p style="color: #ff4c6b;">Error: ?Esta corriendo el training backend? (npm run train)</p>';
  }
}

window.onclick = function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
};

loadProfiles();
loadSystemStatus();
loadJobs();
setInterval(loadJobs, 5000);

(function setupGlobalDropZone() {
  const overlay = document.createElement('div');
  overlay.className = 'drop-zone-overlay';
  overlay.id = 'globalDropZone';
  overlay.innerHTML = `
    <div class="drop-zone-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <h3>Suelta los archivos aqui</h3>
      <p>Se procesaran automaticamente</p>
    </div>
  `;
  document.body.appendChild(overlay);

  let dragCounter = 0;

  document.addEventListener('dragenter', function (e) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer.types.includes('Files')) {
      overlay.classList.add('active');
    }
  });

  document.addEventListener('dragleave', function (e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      overlay.classList.remove('active');
    }
  });

  document.addEventListener('dragover', function (e) {
    e.preventDefault();
  });

  document.addEventListener('drop', function (e) {
    e.preventDefault();
    dragCounter = 0;
    overlay.classList.remove('active');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (!document.getElementById('tab-file').classList.contains('active')) {
        switchTab('file');
      }

      const fileInput = document.getElementById('fileInput');
      const dt = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        dt.items.add(files[i]);
      }
      fileInput.files = dt.files;

      updateFileInputText();

      showStatus(files.length + ' archivo(s) listo(s) para subir. Haz clic en "Subir y Procesar Archivos"', 'info', 'trainStatus');
    }
  });
})();

Object.assign(window, {
  openCreateModal,
  closeCreateModal,
  openEditModalById,
  closeEditModal,
  toggleEditProfile,
  switchTab,
  createProfile,
  saveProfile,
  filterProfiles,
  goToPage,
  updateFileInputText,
  uploadFiles,
  uploadText,
  loadJobs,
});
