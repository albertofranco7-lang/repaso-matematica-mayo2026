const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper REST para tablas
async function supabase(method, table, body = null, filter = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  };
  const options = { method, headers, signal: AbortSignal.timeout(25000) };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// Helper para subir archivo a Supabase Storage
async function uploadToStorage(fileName, buffer, mimeType) {
  const url = `${SUPABASE_URL}/storage/v1/object/respuestas/${fileName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true'
    },
    body: buffer,
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage error: ${err}`);
  }
  // URL pública
  return `${SUPABASE_URL}/storage/v1/object/public/respuestas/${fileName}`;
}

// GET - contenido del repaso
app.get('/api/content', async (req, res) => {
  try {
    const rows = await supabase('GET', 'content', null, '?id=eq.1');
    if (!rows.length || !rows[0].html) {
      const fs = require('fs');
      const html = fs.readFileSync(path.join(__dirname, 'data', 'initial_content.html'), 'utf8');
      await supabase('POST', 'content', { id: 1, html, updated_at: new Date().toISOString() });
      return res.json({ content: html, updatedAt: new Date().toISOString() });
    }
    res.json({ content: rows[0].html, updatedAt: rows[0].updated_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer el contenido' });
  }
});

// POST - guardar contenido del repaso
app.post('/api/content', async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') return res.status(400).json({ error: 'Contenido inválido' });
    const now = new Date().toISOString();
    await supabase('POST', 'content', { id: 1, html: content, updated_at: now });
    res.json({ ok: true, updatedAt: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el contenido' });
  }
});

// GET - todas las respuestas (sin imagen base64, solo URL)
app.get('/api/answers', async (req, res) => {
  try {
    const rows = await supabase('GET', 'answers', null, '?order=sent_at.desc&select=id,exercise_id,exercise_title,student_name,image_url,mime_type,sent_at');
    const answers = rows.map(r => ({
      id: r.id,
      exerciseId: r.exercise_id,
      exerciseTitle: r.exercise_title,
      studentName: r.student_name,
      imageUrl: r.image_url,
      mimeType: r.mime_type,
      sentAt: r.sent_at
    }));
    res.json(answers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer respuestas' });
  }
});

// POST - guardar respuesta (sube imagen a Storage)
app.post('/api/answers', async (req, res) => {
  try {
    const { exerciseId, exerciseTitle, studentName, imageBase64, mimeType } = req.body;
    if (!exerciseId || !imageBase64 || !studentName) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Convertir base64 a buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Nombre único para el archivo
    const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
    const fileName = `${Date.now()}_${studentName.replace(/\s+/g, '_')}_${exerciseId}.${ext}`;

    // Subir a Storage
    const imageUrl = await uploadToStorage(fileName, buffer, mimeType || 'image/jpeg');

    // Guardar en tabla (solo URL, sin base64)
    const row = {
      id: Date.now().toString(),
      exercise_id: exerciseId,
      exercise_title: exerciseTitle,
      student_name: studentName.trim(),
      image_url: imageUrl,
      mime_type: mimeType || 'image/jpeg',
      sent_at: new Date().toISOString()
    };
    await supabase('POST', 'answers', row);
    res.json({ ok: true, id: row.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar respuesta' });
  }
});

// DELETE - eliminar respuesta
app.delete('/api/answers/:id', async (req, res) => {
  try {
    await supabase('DELETE', 'answers', null, `?id=eq.${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar respuesta' });
  }
});

// GET - sesiones finalizadas
app.get('/api/sessions', async (req, res) => {
  try {
    const rows = await supabase('GET', 'sessions', null, '?order=finished_at.desc');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer sesiones' });
  }
});

// POST - registrar finalización
app.post('/api/sessions', async (req, res) => {
  try {
    const { studentName } = req.body;
    if (!studentName) return res.status(400).json({ error: 'Nombre requerido' });
    const row = {
      id: Date.now().toString(),
      student_name: studentName.trim(),
      finished_at: new Date().toISOString()
    };
    await supabase('POST', 'sessions', row);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar sesión' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
