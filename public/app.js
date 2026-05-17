const contentArea = document.getElementById('content-area');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');

// Cargar contenido al iniciar
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error('Error del servidor');
    const data = await res.json();
    contentArea.innerHTML = data.content;
    const date = new Date(data.updatedAt);
    statusText.textContent = `Actualizado: ${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    statusText.textContent = 'Error al cargar';
    showToast('No se pudo cargar el contenido', 'error');
  }
}

function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

loadContent();
