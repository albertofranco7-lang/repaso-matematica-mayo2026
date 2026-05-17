const imageData = {}; // { exId: { base64, mimeType } }

function previewImage(exId, input) {
  const file = input.files[0];
  if (!file) return;

  // Validar tamaño (máx 8MB)
  if (file.size > 8 * 1024 * 1024) {
    showToast('La imagen es muy grande. Máximo 8MB.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    imageData[exId] = { base64, mimeType: file.type };

    document.getElementById(`img-${exId}`).src = base64;
    document.getElementById(`preview-${exId}`).classList.remove('hidden');
    document.getElementById(`upload-${exId}`).classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function removeImage(exId) {
  delete imageData[exId];
  document.getElementById(`img-${exId}`).src = '';
  document.getElementById(`preview-${exId}`).classList.add('hidden');
  document.getElementById(`upload-${exId}`).classList.remove('hidden');
  document.getElementById(`file-${exId}`).value = '';
}

async function sendAnswer(exId, exerciseTitle) {
  const studentName = document.getElementById('student-name').value.trim();
  if (!studentName) {
    showToast('Primero escribí tu nombre arriba', 'error');
    document.getElementById('student-name').focus();
    return;
  }

  if (!imageData[exId]) {
    showToast('Primero adjuntá una foto de tu respuesta', 'error');
    return;
  }

  const btn = document.querySelector(`#${exId} .btn-send`);
  const statusEl = document.getElementById(`status-${exId}`);
  btn.disabled = true;
  btn.textContent = '⏳ Enviando...';

  try {
    const res = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: exId,
        exerciseTitle,
        studentName,
        imageBase64: imageData[exId].base64,
        mimeType: imageData[exId].mimeType
      })
    });

    if (!res.ok) throw new Error('Error del servidor');

    statusEl.textContent = '✅ Respuesta enviada correctamente';
    statusEl.className = 'send-status ok';
    statusEl.classList.remove('hidden');
    btn.textContent = '✅ Enviado';
    showToast('Respuesta enviada', 'success');
  } catch (err) {
    statusEl.textContent = '❌ No se pudo enviar. Intentá de nuevo.';
    statusEl.className = 'send-status error';
    statusEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = '📤 Enviar respuesta';
    showToast('Error al enviar', 'error');
  }
}

// Toast
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

async function finishExam() {
  const studentName = document.getElementById('student-name').value.trim();
  if (!studentName) {
    showToast('Primero escribí tu nombre arriba', 'error');
    document.getElementById('student-name').focus();
    return;
  }

  if (!confirm(`¿Estás seguro de que querés finalizar, ${studentName}? Esta acción no se puede deshacer.`)) return;

  const btn = document.querySelector('.btn-finish');
  btn.disabled = true;
  btn.textContent = '⏳ Finalizando...';

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName })
    });
    if (!res.ok) throw new Error('Error del servidor');
    // Redirigir a la página de finalización
    window.location.href = `finalizado.html?nombre=${encodeURIComponent(studentName)}`;
  } catch (err) {
    showToast('Error al finalizar. Intentá de nuevo.', 'error');
    btn.disabled = false;
    btn.textContent = '✅ Finalizar Ejercicios';
  }
}
