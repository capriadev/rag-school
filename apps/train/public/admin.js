const API_URL = 'http://localhost:3001';
    let allProfiles = [];
    let filteredProfiles = [];
    let currentPage = 1;
    const PROFILES_PER_PAGE = 10;

    function isActiveValue(value) {
      return value === true || value === 'true' || value === 1 || value === '1' || value === 'TRUE';
    }
    
    // Modal functions
    function openCreateModal() {
      document.getElementById('createModal').classList.add('active');
      document.getElementById('createStatus').style.display = 'none';
      document.getElementById('newProfileName').value = '';
      document.getElementById('newProfileDesc').value = '';
    }
    function closeCreateModal() {
      document.getElementById('createModal').classList.remove('active');
    }
    function openEditModal(profile) {
      const isActive = isActiveValue(profile.active);
      document.getElementById('editProfileId').value = profile.id_profile;
      document.getElementById('editProfileName').value = profile.name;
      document.getElementById('editProfileDesc').value = profile.description || '';
      document.getElementById('editProfileActive').value = isActive ? 'true' : 'false';
      updateEditStatusUI(isActive);
      document.getElementById('editStatus').style.display = 'none';
      document.getElementById('editModal').classList.add('active');
    }
    
    function updateEditStatusUI(active) {
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
    
    function toggleEditProfile() {
      const current = document.getElementById('editProfileActive').value === 'true';
      document.getElementById('editProfileActive').value = (!current).toString();
      updateEditStatusUI(!current);
    }
    function closeEditModal() {
      document.getElementById('editModal').classList.remove('active');
    }
    
    // Cambiar tabs
    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    }
    
    // Cargar perfiles y mostrar lista
    async function loadProfiles() {
      const select = document.getElementById('profileSelect');
      const list = document.getElementById('profilesList');
      
      select.innerHTML = '<option value="">Cargando...</option>';
      list.innerHTML = '<p style="color: #8e8ea9; text-align: center;">Cargando perfiles...</p>';
      
      try {
        const response = await fetch(API_URL + '/api/profiles');
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Respuesta no JSON:', text.substring(0, 200));
          throw new Error('El servidor no respondió con JSON. ¿Está corriendo el backend?');
        }
        
        const data = await response.json();
        
        if (data.success && data.profiles) {
          allProfiles = data.profiles.map(p => ({ ...p, active: isActiveValue(p.active) }));
          filteredProfiles = allProfiles;
          
          // Mostrar buscador si hay +20 perfiles
          document.getElementById('searchContainer').style.display = allProfiles.length > 20 ? 'block' : 'none';
          
          // Actualizar select - todos los perfiles (activos e inactivos)
          if (allProfiles.length === 0) {
            select.innerHTML = '<option value="">No hay perfiles</option>';
          } else {
            select.innerHTML = allProfiles.map(p => 
              '<option value="' + p.id_profile + '">' + p.name + (p.active ? '' : ' (Inactivo)') + '</option>'
            ).join('');
          }
          
          // Renderizar lista paginada (todos los perfiles)
          renderProfiles();
        } else {
          select.innerHTML = '<option value="">Error: ' + (data.error || 'Respuesta inválida') + '</option>';
          list.innerHTML = '<p style="color: #ff4c6b; text-align: center;">Error cargando perfiles</p>';
        }
      } catch (error) {
        console.error('Error cargando perfiles:', error);
        select.innerHTML = '<option value="">Error: ' + error.message + '</option>';
        list.innerHTML = '<p style="color: #ff4c6b; text-align: center;">Error: ' + error.message + '</p>';
      }
    }
    
    // Filtrar perfiles por búsqueda
    function filterProfiles() {
      const query = document.getElementById('profileSearch').value.toLowerCase().trim();
      if (query === '') {
        filteredProfiles = allProfiles;
      } else {
        filteredProfiles = allProfiles.filter(p => 
          p.name.toLowerCase().includes(query) || 
          (p.description && p.description.toLowerCase().includes(query))
        );
      }
      currentPage = 1;
      renderProfiles();
    }
    
    // Renderizar perfiles de la página actual
    function renderProfiles() {
      const list = document.getElementById('profilesList');
      const totalPages = Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE);
      
      const start = (currentPage - 1) * PROFILES_PER_PAGE;
      const end = start + PROFILES_PER_PAGE;
      const pageProfiles = filteredProfiles.slice(start, end);
      
      if (pageProfiles.length === 0) {
        list.innerHTML = '<p style="color: #8e8ea9; text-align: center;">No se encontraron perfiles</p>';
      } else {
        list.innerHTML = pageProfiles.map(p => renderProfileItem(p)).join('');
      }
      
      // Renderizar paginación si hay más de 10 perfiles
      if (filteredProfiles.length > PROFILES_PER_PAGE) {
        renderPagination(totalPages);
        document.getElementById('pagination').style.display = 'flex';
      } else {
        document.getElementById('pagination').style.display = 'none';
      }
    }
    
    // Renderizar controles de paginación
    function renderPagination(totalPages) {
      const container = document.getElementById('pagination');
      let html = '';
      
      // Botón << (primera página)
      html += '<button ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="goToPage(1)"><<</button>';
      
      // Botón < (anterior)
      html += '<button ' + (currentPage === 1 ? 'disabled' : '') + ' onclick="goToPage(' + (currentPage - 1) + ')"><</button>';
      
      // Números de página
      const maxButtons = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);
      
      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }
      
      if (startPage > 1) {
        html += '<button onclick="goToPage(1)">1</button>';
        if (startPage > 2) html += '<span class="ellipsis">...</span>';
      }
      
      for (let i = startPage; i <= endPage; i++) {
        html += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="goToPage(' + i + ')">' + i + '</button>';
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="ellipsis">...</span>';
        html += '<button onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
      }
      
      // Botón > (siguiente)
      html += '<button ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="goToPage(' + (currentPage + 1) + ')">></button>';
      
      // Botón >> (última página)
      html += '<button ' + (currentPage === totalPages ? 'disabled' : '') + ' onclick="goToPage(' + totalPages + ')">>></button>';
      
      container.innerHTML = html;
    }
    
    function goToPage(page) {
      currentPage = page;
      renderProfiles();
    }
    
    function renderProfileItem(p) {
      const isActive = isActiveValue(p.active);
      const activeClass = isActive ? 'active-profile' : '';
      return '<div class="profile-item ' + activeClass + '" id="profile-' + p.id_profile + '">' +
        '<div class="profile-info">' +
          '<div class="profile-name">' + p.name + (p.doc_count > 0 ? ' (' + p.doc_count + ' docs)' : '') + '</div>' +
          '<div class="profile-desc">' + (p.description || 'Sin descripción') + '</div>' +
        '</div>' +
        '<div class="profile-actions">' +
          '<button class="btn-small secondary" onclick="openEditModalById(' + p.id_profile + ')">Editar</button>' +
        '</div>' +
      '</div>';
    }
    
    function openEditModalById(id) {
      const profile = allProfiles.find(p => p.id_profile === id);
      if (profile) openEditModal(profile);
    }
    
    // Crear perfil
    async function createProfile() {
      const name = document.getElementById('newProfileName').value.trim();
      const desc = document.getElementById('newProfileDesc').value.trim();
      
      if (!name) {
        showStatus('Ingresa un nombre para el perfil', 'error', 'createStatus');
        return;
      }
      
      showStatus('Creando perfil...', 'info', 'createStatus');
      
      try {
        const response = await fetch(API_URL + '/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, description: desc })
        });
        
        const data = await response.json();
        
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
    
    // Guardar perfil editado
    async function saveProfile() {
      const id = parseInt(document.getElementById('editProfileId').value);
      const name = document.getElementById('editProfileName').value.trim();
      const desc = document.getElementById('editProfileDesc').value.trim();
      const active = document.getElementById('editProfileActive').value === 'true';
      
      if (!name) {
        showStatus('El nombre es requerido', 'error', 'editStatus');
        return;
      }
      
      showStatus('Guardando cambios...', 'info', 'editStatus');
      
      try {
        const response = await fetch(API_URL + '/api/profiles/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, description: desc, active: active })
        });
        
        const data = await response.json();
        
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
    
    // Cerrar modales al hacer click fuera
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
      }
    }
    
    // Resto de funciones...
    
    // Subir archivos
    function updateFileInputText() {
      const fileInput = document.getElementById('fileInput');
      const fileInputText = document.getElementById('fileInputText');
      if (fileInput.files && fileInput.files.length > 0) {
        const count = fileInput.files.length;
        fileInputText.textContent = count === 1 ? fileInput.files[0].name : `${count} archivos seleccionados`;
        fileInputText.style.color = '#ececf7';
      } else {
        fileInputText.textContent = 'Ningún archivo seleccionado';
        fileInputText.style.color = '#8e8ea9';
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
      
      // Ocultar perfiles durante el upload
      document.getElementById('profilesCard').style.display = 'none';
      
      showStatus('Procesando ' + files.length + ' archivo(s)...', 'info', 'trainStatus');
      
      for (let i = 0; i < files.length; i++) {
        try {
          await processFile(files[i], profileSelect.value);
        } catch (error) {
          showStatus('Error con ' + files[i].name + ': ' + error.message, 'error', 'trainStatus');
          // Mostrar perfiles si hay error
          document.getElementById('profilesCard').style.display = '';
          return;
        }
      }
      
      showStatus(files.length + ' archivo(s) enviados a procesamiento', 'success', 'trainStatus');
      loadJobs();
      
      // Mostrar perfiles al finalizar
      document.getElementById('profilesCard').style.display = '';
    }
    
    // Procesar archivo individual
    async function processFile(file, profileId) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileId', profileId);
      
      const uploadRes = await fetch(API_URL + '/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Error al subir');
      }
      
      const processRes = await fetch(API_URL + '/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadData.file.id,
          profileId: profileId
        })
      });
      
      const processData = await processRes.json();
      
      if (!processData.success) {
        throw new Error(processData.error);
      }
    }
    
    // Subir texto
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
        // Crear un blob de texto y enviarlo como archivo
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
    
    // Mostrar estado
    function showStatus(message, type, elementId) {
      const status = document.getElementById(elementId);
      status.textContent = message;
      status.className = 'status ' + type;
      status.style.display = 'block';
    }
    
    // Cargar jobs
    async function loadJobs() {
      try {
        const response = await fetch(API_URL + '/api/process/jobs');
        const data = await response.json();
        
        const container = document.getElementById('jobsList');
        if (data.jobs && data.jobs.length > 0) {
          container.innerHTML = data.jobs.map(function(job) {
            return '<div class="job-item"><div><strong>' + job.id.slice(0, 20) + '...</strong><br><small style="color: #8e8ea9;">Perfil: ' + job.profileId + '</small></div><span class="job-status ' + job.status + '">' + job.status + '</span></div>';
          }).join('');
        } else {
          container.innerHTML = '<p style="color: #8e8ea9; text-align: center;">No hay jobs activos</p>';
        }
      } catch (error) {
        document.getElementById('jobsList').innerHTML = 
          '<p style="color: #ff4c6b; text-align: center;">Error cargando jobs</p>';
      }
    }
    
    // Cargar estado del sistema
    async function loadSystemStatus() {
      try {
        const response = await fetch(API_URL + '/api/status');
        const data = await response.json();
        
        document.getElementById('systemStatus').innerHTML = 
          '<p><strong>Estado:</strong> ' + data.status + '</p>' +
          '<p><strong>n8n Webhook:</strong> ' + data.n8nWebhook + '</p>' +
          '<p><strong>Upload Path:</strong> ' + data.uploadPath + '</p>';
      } catch (error) {
        document.getElementById('systemStatus').innerHTML = 
          '<p style="color: #ff4c6b;">Error: ¿Está corriendo el training backend? (npm run train)</p>';
      }
    }
    
    // Inicializar
    loadProfiles();
    loadSystemStatus();
    loadJobs();
    setInterval(loadJobs, 5000);
    
    // Drop zone global para arrastrar archivos
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
          <h3>Suelta los archivos aquí</h3>
          <p>Se procesarán automáticamente</p>
        </div>
      `;
      document.body.appendChild(overlay);
      
      let dragCounter = 0;
      
      // Mostrar overlay cuando se arrastra algo a la página
      document.addEventListener('dragenter', function(e) {
        e.preventDefault();
        dragCounter++;
        if (e.dataTransfer.types.includes('Files')) {
          overlay.classList.add('active');
        }
      });
      
      // Ocultar overlay cuando se sale
      document.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
          overlay.classList.remove('active');
        }
      });
      
      // Prevenir comportamiento por defecto
      document.addEventListener('dragover', function(e) {
        e.preventDefault();
      });
      
      // Manejar el drop
      document.addEventListener('drop', function(e) {
        e.preventDefault();
        dragCounter = 0;
        overlay.classList.remove('active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          // Cambiar a la tab de archivo si no está activa
          if (!document.getElementById('tab-file').classList.contains('active')) {
            switchTab('file');
          }
          
          // Asignar archivos al input
          const fileInput = document.getElementById('fileInput');
          const dt = new DataTransfer();
          for (let i = 0; i < files.length; i++) {
            dt.items.add(files[i]);
          }
          fileInput.files = dt.files;
          
          // Actualizar texto del input
          updateFileInputText();
          
          // Mostrar mensaje
          showStatus(files.length + ' archivo(s) listo(s) para subir. Haz clic en "Subir y Procesar Archivos"', 'info', 'trainStatus');
        }
      });
    })();
