export function showStatus(message, type, elementId) {
  const status = document.getElementById(elementId);
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
}
