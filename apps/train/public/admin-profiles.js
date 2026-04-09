import { createProfileApi, listProfilesApi, updateProfileApi } from './admin-api.js';
import { showStatus } from './admin-feedback.js';
import { closeCreateModal, closeEditModal, isActiveValue, openEditModal } from './admin-modals.js';
import { adminState } from './admin-state.js';

export { closeCreateModal, closeEditModal, openEditModal } from './admin-modals.js';

export async function loadProfiles() {
  const select = document.getElementById('profileSelect');
  const list = document.getElementById('profilesList');

  select.innerHTML = '<option value="">Cargando...</option>';
  list.innerHTML = '<p style="color: #8e8ea9; text-align: center;">Cargando perfiles...</p>';

  try {
    const data = await listProfilesApi();

    if (data.success && data.profiles) {
      adminState.allProfiles = data.profiles.map((p) => ({ ...p, active: isActiveValue(p.active) }));
      adminState.filteredProfiles = adminState.allProfiles;

      document.getElementById('searchContainer').style.display = adminState.allProfiles.length > 20 ? 'block' : 'none';

      if (adminState.allProfiles.length === 0) {
        select.innerHTML = '<option value="">No hay perfiles</option>';
      } else {
        select.innerHTML = adminState.allProfiles
          .map((p) => `<option value="${p.id_profile}">${p.name}${p.active ? '' : ' (Inactivo)'}</option>`)
          .join('');
      }

      renderProfiles();
    } else {
      select.innerHTML = '<option value="">Error: ' + (data.error || 'Respuesta invalida') + '</option>';
      list.innerHTML = '<p style="color: #ff4c6b; text-align: center;">Error cargando perfiles</p>';
    }
  } catch (error) {
    console.error('Error cargando perfiles:', error);
    select.innerHTML = '<option value="">Error: ' + error.message + '</option>';
    list.innerHTML = '<p style="color: #ff4c6b; text-align: center;">Error: ' + error.message + '</p>';
  }
}

export function filterProfiles() {
  const query = document.getElementById('profileSearch').value.toLowerCase().trim();
  if (query === '') {
    adminState.filteredProfiles = adminState.allProfiles;
  } else {
    adminState.filteredProfiles = adminState.allProfiles.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)),
    );
  }
  adminState.currentPage = 1;
  renderProfiles();
}

export function renderProfiles() {
  const list = document.getElementById('profilesList');
  const totalPages = Math.ceil(adminState.filteredProfiles.length / adminState.profilesPerPage);

  const start = (adminState.currentPage - 1) * adminState.profilesPerPage;
  const end = start + adminState.profilesPerPage;
  const pageProfiles = adminState.filteredProfiles.slice(start, end);

  if (pageProfiles.length === 0) {
    list.innerHTML = '<p style="color: #8e8ea9; text-align: center;">No se encontraron perfiles</p>';
  } else {
    list.innerHTML = pageProfiles.map((p) => renderProfileItem(p)).join('');
  }

  if (adminState.filteredProfiles.length > adminState.profilesPerPage) {
    renderPagination(totalPages);
    document.getElementById('pagination').style.display = 'flex';
  } else {
    document.getElementById('pagination').style.display = 'none';
  }
}

export function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  let html = '';

  html += '<button ' + (adminState.currentPage === 1 ? 'disabled' : '') + ' onclick="goToPage(1)"><<</button>';
  html +=
    '<button ' +
    (adminState.currentPage === 1 ? 'disabled' : '') +
    ' onclick="goToPage(' +
    (adminState.currentPage - 1) +
    ')"><</button>';

  const maxButtons = 5;
  let startPage = Math.max(1, adminState.currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    html += '<button onclick="goToPage(1)">1</button>';
    if (startPage > 2) html += '<span class="ellipsis">...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += '<button class="' + (i === adminState.currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<span class="ellipsis">...</span>';
    html += '<button onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
  }

  html +=
    '<button ' +
    (adminState.currentPage === totalPages ? 'disabled' : '') +
    ' onclick="goToPage(' +
    (adminState.currentPage + 1) +
    ')">></button>';
  html +=
    '<button ' +
    (adminState.currentPage === totalPages ? 'disabled' : '') +
    ' onclick="goToPage(' +
    totalPages +
    ')">>></button>';

  container.innerHTML = html;
}

export function goToPage(page) {
  adminState.currentPage = page;
  renderProfiles();
}

function renderProfileItem(p) {
  const isActive = isActiveValue(p.active);
  const activeClass = isActive ? 'active-profile' : '';
  return (
    '<div class="profile-item ' +
    activeClass +
    '" id="profile-' +
    p.id_profile +
    '">' +
    '<div class="profile-info">' +
    '<div class="profile-name">' +
    p.name +
    (p.doc_count > 0 ? ' (' + p.doc_count + ' docs)' : '') +
    '</div>' +
    '<div class="profile-desc">' +
    (p.description || 'Sin descripcion') +
    '</div>' +
    '</div>' +
    '<div class="profile-actions">' +
    '<button class="btn-small secondary" onclick="openEditModalById(' +
    p.id_profile +
    ')">Editar</button>' +
    '</div>' +
    '</div>'
  );
}

export function openEditModalById(id) {
  const profile = adminState.allProfiles.find((p) => p.id_profile === id);
  if (profile) openEditModal(profile);
}

export async function createProfile() {
  const name = document.getElementById('newProfileName').value.trim();
  const desc = document.getElementById('newProfileDesc').value.trim();

  if (!name) {
    showStatus('Ingresa un nombre para el perfil', 'error', 'createStatus');
    return;
  }

  showStatus('Creando perfil...', 'info', 'createStatus');

  try {
    const data = await createProfileApi({ name: name, description: desc });

    if (data.success) {
      showStatus('Perfil "' + data.profile.name + '" creado exitosamente', 'success', 'createStatus');
      setTimeout(() => {
        closeCreateModal();
        loadProfiles();
      }, 1000);
    } else {
      showStatus('Error: ' + (data.error || 'Error desconocido'), 'error', 'createStatus');
    }
  } catch (error) {
    console.error('Error creando perfil:', error);
    showStatus('Error: ' + error.message, 'error', 'createStatus');
  }
}

export async function saveProfile() {
  const id = Number.parseInt(document.getElementById('editProfileId').value, 10);
  const name = document.getElementById('editProfileName').value.trim();
  const desc = document.getElementById('editProfileDesc').value.trim();
  const active = document.getElementById('editProfileActive').value === 'true';

  if (!name) {
    showStatus('El nombre es requerido', 'error', 'editStatus');
    return;
  }

  showStatus('Guardando cambios...', 'info', 'editStatus');

  try {
    const data = await updateProfileApi(id, { name: name, description: desc, active: active });

    if (data.success) {
      showStatus('Perfil actualizado exitosamente', 'success', 'editStatus');
      setTimeout(() => {
        closeEditModal();
        loadProfiles();
      }, 1000);
    } else {
      showStatus('Error: ' + (data.error || 'Error desconocido'), 'error', 'editStatus');
    }
  } catch (error) {
    console.error('Error guardando perfil:', error);
    showStatus('Error: ' + error.message, 'error', 'editStatus');
  }
}
