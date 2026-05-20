/**
 * Service to interact with Google Workspace APIs (Drive, Sheets)
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export interface SheetData {
  range: string;
  values: string[][];
}

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const googleWorkspaceService = {
  /**
   * List files in a specific folder
   */
  async listFilesFromFolder(accessToken: string, folderId: string): Promise<GoogleDriveFile[]> {
    const q = `'${folderId}' in parents and trashed = false`;
    const url = `${DRIVE_BASE_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,webViewLink)`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error de Google Drive: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  },

  /**
   * Get spreadsheet data
   */
  async getSheetData(accessToken: string, spreadsheetId: string, range: string = 'Sheet1!A1:Z100'): Promise<SheetData> {
    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error de Google Sheets: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Fetch data from an App Script Web App URL
   * Note: App Scripts usually require a redirect (CORS) or can be called directly if configured properly.
   */
  async fetchFromWebApp(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error de App Script: ${response.statusText}`);
    }
    return await response.json();
  },

  /**
   * Create or upload a file in a specific folder in Google Drive
   */
  async createFileMultipart(
    accessToken: string,
    folderId: string,
    name: string,
    mimeType: string,
    content: string
  ): Promise<any> {
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';
    
    const metadata = {
      name: name,
      parents: [folderId],
      mimeType: mimeType
    };

    const boundary = 'foo_bar_boundary';
    
    // Construct real multipart/related body
    const body = [
      `\r\n--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
      content,
      `\r\n--${boundary}--\r\n`
    ].join('');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error subiendo archivo: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }
};
