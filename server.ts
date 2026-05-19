import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API - Google Workspace Sync Placeholder
  app.post("/api/sync/workspace", async (req, res) => {
    try {
      // In a real scenario, you'd use the access token from the session/environment
      // The AI Studio environment usually provides access via GOOGLE_ACCESS_TOKEN if configured
      const auth = new google.auth.GoogleAuth({
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly'
        ],
      });
      
      const authClient = await auth.getClient();
      const drive = google.drive({ version: 'v3', auth: authClient as any });
      const sheets = google.sheets({ version: 'v4', auth: authClient as any });

      // Example: List files in a folder (ID would come from settings)
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
      const fileList = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
      });

      console.log('Arquivos encontrados:', fileList.data.files);

      // Add actual sync logic here (e.g., reading a specific spreadsheet)
      
      res.json({ 
        status: "success", 
        message: "Sincronización con Google Workspace iniciada",
        filesFound: fileList.data.files?.length || 0
      });
    } catch (error: any) {
      console.error('Error in sync:', error);
      res.status(500).json({ 
        status: "error", 
        message: error.message || "Error al conectar con Google Workspace" 
      });
    }
  });

  // Proxy seguro para Google Apps Script
  app.post("/api/run-script", async (req, res) => {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ status: "error", message: "Falta el parámetro 'action'." });
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzY4-_rA68AOt1PIClaGgCl5iVjhUlTC-XOcxlT_sVY08SRT_4d8DuDeszi98lWFWnsbw/exec";

    try {
      console.log(`[Script Proxy] Ejecutando acción: ${action} en ${scriptUrl}`);
      const targetUrl = new URL(scriptUrl);
      targetUrl.searchParams.set("action", action);
      targetUrl.searchParams.set("_t", Date.now().toString());

      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });

      console.log(`[Script Proxy] Respuesta: ${response.status}`);
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }

      res.json({
        status: "success",
        action,
        data: responseData
      });
    } catch (error: any) {
      console.error(`[Script Proxy] Error ejecutando ${action}:`, error);
      res.status(500).json({
        status: "error",
        action,
        message: error.message || "Error de comunicación con Google Apps Script"
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
