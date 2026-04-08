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
import {
  loadJobs,
  loadSystemStatus,
  setupGlobalDropZone,
  updateFileInputText,
  uploadFiles,
  uploadText,
} from './admin-training.js';

function switchTab(tab, tabElement) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));

  const currentTabElement = tabElement || document.querySelector(`.tab[onclick*="'${tab}'"]`);
  if (currentTabElement) currentTabElement.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
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
setupGlobalDropZone(switchTab);

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
  uploadFiles: () => uploadFiles(loadJobs),
  uploadText: () => uploadText(loadJobs),
  loadJobs,
});
