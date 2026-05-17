const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'content.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
