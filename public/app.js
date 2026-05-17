const contentArea = document.getElementById('content-area');
const toolbar = document.getElementById('toolbar');
const btnEdit = document.getElementById('btn-edit');
const statusText = document.getElementById('status-text');
const toast = document.getElementById('toast');

let isEditing = false;
let saveTimeout = null;

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

// Guardar contenido
async function saveContent() {
  const btnSave = document.getElementById('btn-save');
  btnSave.textContent = '⏳ Guardando...';
  btnSave.disabled = true;

  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: contentArea.innerHTML })
    });
    if (!res.ok) throw new Error('Error del servidor');
    const data = await res.json();
    const date = new Date(data.updatedAt);
    statusText.textContent = `Guardado: ${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    showToast('✅ Guardado correctamente', 'success');
  } catch (err) {
    showToast('❌ Error al guardar', 'error');
  } finally {
    btnSave.textContent = '💾 Guardar';
    btnSave.disabled = false;
  }
}

// Activar/desactivar modo edición
function toggleEdit() {
  isEditing = !isEditing;
  contentArea.contentEditable = isEditing ? 'true' : 'false';
  toolbar.classList.toggle('hidden', !isEditing);
  btnEdit.classList.toggle('active', isEditing);
  btnEdit.textContent = isEditing ? '👁️ Ver' : '✏️ Editar';

  if (isEditing) {
    contentArea.focus();
    showToast('Modo edición activado', '');
  } else {
    showToast('Modo lectura', '');
  }
}

// Formatear texto seleccionado
function fmt(command) {
  document.execCommand(command, false, null);
  contentArea.focus();
}

// Insertar etiqueta HTML alrededor de la selección
function insertTag(tag) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  const el = document.createElement(tag);
  try {
    range.surroundContents(el);
  } catch (e) {
    el.appendChild(range.extractContents());
    range.insertNode(el);
  }
  contentArea.focus();
}

// Mostrar notificación toast
function showToast(message, type) {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Iniciar
loadContent();
