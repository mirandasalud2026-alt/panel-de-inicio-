// backend/server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Endpoint para sincronizar con Google Apps Script (proxy)
app.post('/api/run-script', async (req, res) => {
  const { action, scriptUrl } = req.body;
  const defaultUrl = 'https://script.google.com/macros/s/AKfycbw-4Wvfp32rueC8ncgONSIbe0BmlXl2L4kFlnAi7IffQ9NXMhs9YfhupMw-eeRoUWS1/exec';
  const url = scriptUrl || process.env.VITE_GOOGLE_SCRIPT_URL || defaultUrl;
  try {
    const response = await fetch(`${url}?action=${action}&_t=${Date.now()}`);
    const data = await response.json();
    res.json({ status: 'success', data });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Endpoint de backup a Drive (simulado o real según credenciales)
app.post('/api/admin/backup-drive', async (req, res) => {
  // Aquí iría la lógica con OAuth2 y googleapis
  res.json({ status: 'success', message: 'Backup ejecutado (simulación)' });
});

// Vite middleware para desarrollo
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`Servidor corriendo en http://localhost:${PORT}`));