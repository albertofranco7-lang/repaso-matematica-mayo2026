const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const ANSWERS_FILE = path.join(__dirname, 'data', 'answers.json');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Asegurar que existe la carpeta data
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Inicializar el archivo de datos si no existe
if (!fs.existsSync(DATA_FILE)) {
  const initialContent = fs.readFileSync(
    path.join(__dirname, 'data', 'initial_content.html'),
    'utf8'
  );
  fs.writeFileSync(DATA_FILE, JSON.stringify({ content: initialContent, updatedAt: new Date().toISOString() }));
}

// Inicializar el archivo de respuestas si no existe
if (!fs.existsSync(ANSWERS_FILE)) {
  fs.writeFileSync(ANSWERS_FILE, JSON.stringify([]));
}

// GET - obtener el contenido
app.get('/api/content', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer el contenido' });
  }
});

// POST - guardar el contenido
app.post('/api/content', (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Contenido inválido' });
    }
    const data = { content, updatedAt: new Date().toISOString() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.json({ ok: true, updatedAt: data.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el contenido' });
  }
});

// GET - obtener todas las respuestas (para el docente)
app.get('/api/answers', (req, res) => {
  try {
    const answers = JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8'));
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer respuestas' });
  }
});

// POST - enviar respuesta de un ejercicio
app.post('/api/answers', (req, res) => {
  try {
    const { exerciseId, exerciseTitle, studentName, imageBase64, mimeType } = req.body;
    if (!exerciseId || !imageBase64 || !studentName) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    const answers = JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8'));
    const answer = {
      id: Date.now().toString(),
      exerciseId,
      exerciseTitle,
      studentName: studentName.trim(),
      imageBase64,
      mimeType: mimeType || 'image/jpeg',
      sentAt: new Date().toISOString()
    };
    answers.push(answer);
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify(answers));
    res.json({ ok: true, id: answer.id });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar respuesta' });
  }
});

// DELETE - eliminar una respuesta
app.delete('/api/answers/:id', (req, res) => {
  try {
    let answers = JSON.parse(fs.readFileSync(ANSWERS_FILE, 'utf8'));
    answers = answers.filter(a => a.id !== req.params.id);
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify(answers));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar respuesta' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
