export function isActiveValue(value) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'TRUE';
}

export function openCreateModal() {
  document.getElementById('createModal').classList.add('active');
  document.getElementById('createStatus').style.display = 'none';
  document.getElementById('newProfileName').value = '';
  document.getElementById('newProfileDesc').value = '';
}

export function closeCreateModal() {
  document.getElementById('createModal').classList.remove('active');
}

export function openEditModal(profile) {
  const isActive = isActiveValue(profile.active);
  document.getElementById('editProfileId').value = profile.id_profile;
  document.getElementById('editProfileName').value = profile.name;
  document.getElementById('editProfileDesc').value = profile.description || '';
  document.getElementById('editProfileActive').value = isActive ? 'true' : 'false';
  updateEditStatusUI(isActive);
  document.getElementById('editStatus').style.display = 'none';
  document.getElementById('editModal').classList.add('active');
}

export function updateEditStatusUI(active) {
  const badge = document.getElementById('editStatusBadge');
  const btn = document.getElementById('editToggleBtn');
  if (active) {
    badge.textContent = 'Activo';
    badge.className = 'status-badge active';
    btn.textContent = 'Desactivar';
  } else {
    badge.textContent = 'Inactivo';
    badge.className = 'status-badge inactive';
    btn.textContent = 'Activar';
  }
}

export function toggleEditProfile() {
  const current = document.getElementById('editProfileActive').value === 'true';
  document.getElementById('editProfileActive').value = (!current).toString();
  updateEditStatusUI(!current);
}

export function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}
