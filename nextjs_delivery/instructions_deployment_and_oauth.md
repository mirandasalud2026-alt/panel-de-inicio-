# RECORRIDO PARA EL DESPLIEGUE CLÍNICO Y FLUJO OAUTH 2.0 (GOOGLE DRIVE REFRESH TOKEN)

Este instructivo documenta cómo integrar los formularios construidos, adquirir un token de refresco (`refresh_token`) permanente de larga vida de Google, y desplegar la aplicación en Vercel con Supabase de forma segura.

---

## 1. ADQUISICIÓN DE GOOGLE REFRESH TOKEN (Flujo de Escritorio Oauth 2.0)

Para subir reportes dinámicos a la carpeta de Google Drive sin usar "Cuentas de Servicio" que expiran o requieren permisos empresariales complejos, se utiliza el flujo de consentimiento OAuth Web con Token de Refresco (`refresh_token`).

### Paso 1: Configurar Credenciales en Google Cloud Console
1. Ingrese a [Google Cloud Console](https://console.cloud.google.com/).
2. Cree un Proyecto o seleccione uno existente de la Gobernación / Dirección de Salud.
3. Diríjase a **APIs y Servicios** > **Biblioteca** y habilite la **Google Drive API**.
4. Diríjase a **Pantalla de Consentimiento OAuth** (OAuth Consent Screen):
   - Tipo de Usuario: **Externo**.
   - Defina el nombre de la app (Ej: `Miranda Salud Backup`).
   - Guarde y continúe.
   - En la sección de **Scopes (Permisos)**, agregue el scope descriptivo: `https://www.googleapis.com/auth/drive` o `https://www.googleapis.com/auth/drive.file`.
   - En **Test Users (Usuarios de Prueba)**, agregue obligatoriamente el correo de Google que es propietario o tiene permisos de edición de la carpeta destino (`miranda.salud2026@gmail.com`).
5. Diríjase a **Credenciales**:
   - Haga clic en **Crear Credenciales** > **ID de cliente de OAuth** (OAuth Client ID).
   - Tipo de Aplicación: Seleccione **Aplicación de Escritorio** (Desktop App) o **Web Application** (Si configura `http://localhost:3000/api/auth/callback` como redirect uri).
   - Guarde los valores de **ID de Cliente** (Client ID) y **Secreto de Cliente** (Client Secret).

### Paso 2: Ejecutar el Consentimiento para Obtener el Token de Refresco
El token de refresco permanente se adquiere al solicitar acceso una sola vez de forma local. Puede ejecutar este proceso usando herramientas de API como **Postman**, el [OAuth 2.0 Playground Oficial](https://developers.google.com/oauthplayground/) de Google, o un script rápido de node local:

#### Opción Tradicional con Google OAuth Playground:
1. Ingrese a [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2. Pulse el icono de engranaje (OAuth 2.0 Configuration) en la esquina superior derecha:
   - Marque **Use your own OAuth credentials** (Utilizar sus propias credenciales).
   - Ingrese su **OAuth Client ID** y **OAuth Client Secret** creadores arriba.
3. En el paso 1 (Select & authorize APIs), escriba la URL `https://www.googleapis.com/auth/drive` en el cuadro inferior y pulse **Authorize APIs**.
4. Inicie sesión con la cuenta `miranda.salud2026@gmail.com` y autorice los permisos sobre Drive.
5. De regreso en el Playground, en el **Step 2 (Exchange authorization code for tokens)**, haga clic en el botón **Exchange authorization code for tokens**.
6. En la parte lateral se desplegarán los valores. Copie el campo **Refresh Token**. ¡Este valor nunca expira a menos que cancele los permisos de la aplicación!

---

## 2. VARIABLES DE ENTORNO OBLIGATORIAS (Configuración de Vercel y Local)

Cree o actualice su archivo `.env` o la sección de Environment Variables en el panel administrativo de **Vercel**:

```env
# ----------------- CREDENCIALES SUPABASE -----------------
# URL pública de conexión rápida de la base de datos de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://su_proyecto_supabase.supabase.co
# Clave pública anónima de consulta cliente
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Opcional (Recomendado para Server-Side APIs): Rol Master de Base de datos
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...

# ----------------- CREDENCIALES GOOGLE OAUTH -----------------
# El identificador de cliente obtenido en Google Cloud Console
GOOGLE_CLIENT_ID=324905820984-su_cliente.apps.googleusercontent.com
# El secreto de cliente obtenido en Google Cloud Console
GOOGLE_CLIENT_SECRET=GOCSPX-su_secreto_secreta_939
# El token permanente de refresco obtenido a través del Playground
GOOGLE_REFRESH_TOKEN=1//0gVSu_token_de_refresco_permanente...
```

---

## 3. INSTALACIÓN DE COMPONENTES DEPENDENCIAS DE NEXT.JS
Para el correcto funcionamiento de ExcelJS, Supabase y GoogleDrive, asegúrese de tener configuradas las siguientes dependencias en su `package.json`:

```bash
npm install @supabase/supabase-js exceljs googleapis lucide-react
```

---

## 4. INSTRUCCIONES DE DESPLIEGUE EN VERCEL CLÍNICO
1. Conecte su repositorio GitHub con Next.js 14+ a **Vercel**.
2. En la sección de configuración de proyecto, asigne el framework preset: **Next.js**.
3. Despliegue el acordeón de **Environment Variables** e ingrese las 5 variables de entorno descritas en el bloque superior de esta página.
4. Haga clic en **Deploy**. Vercel compilará de forma estática sus componentes del lado del cliente y aprovisionará Serverless Functions instantáneas para la ruta de la API `/api/generar-reporte`.
5. ¡Listo! Su panel de salud y cargas nominales estará permanentemente activo, seguro y sincronizado contra el drive institucional.

---

## 5. MIGRACIÓN: REEMPLAZO DEL CÓDIGO ACTUAL (Service Account) POR EL NUEVO ENDPOINT API OAUTH2

Si anteriormente utilizaba scripts de sincronización o endpoints basados en **Service Accounts** de Google (los cuales requerían subir archivos de claves JSON comprometidos y propensos a expirar), siga estos simples pasos para reemplazar dicho código por la nueva ruta API Serverless `/api/generar-reporte` basada en OAuth 2.0 (Refresh Token):

### Paso 1: Eliminar el Archivo JSON de Claves de la Cuenta de Servicio
1. Ubique y **elimine permanentemente** cualquier archivo `.json` de credenciales de Google (e.g., `credentials.json`, `service-account.json`) de su directorio de proyecto para evitar subirlo a Git o filtrar claves de seguridad.
2. Elimine cualquier importación o archivo estático de configuración que apunte a ese archivo JSON.

### Paso 2: Reemplazar el Archivo de Conexión a Drive
Si tenía un script separado de Node (por ejemplo, `upload-to-drive.js` o similar), puede reemplazarlo por completo delegando la responsabilidad a Next.js API Routes:
1. Elimine el código que inicializa Google Drive mediante `keyFile` o `JWT`:
   ```javascript
   // ❌ CÓDIGO OBSOLETO A ELIMINAR (Service Account)
   const auth = new google.auth.JWT(
     credentials.client_email,
     null,
     credentials.private_key,
     ['https://www.googleapis.com/auth/drive']
   );
   ```
2. Reemplácelo por el nuevo flujo seguro que usa el cliente OAuth2 y las variables de entorno:
   ```typescript
   // ✅ NUEVO DISEÑO COMPILADO Y CARGADO EN /api/generar-reporte/route.ts
   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET
   );
   oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
   const drive = google.drive({ version: 'v3', auth: oauth2Client });
   ```

### Paso 3: Adaptar las llamadas del Panel Superior o Botones de Sincronización
En lugar de invocar a un script manual Node por terminal, realice un llamado `fetch` HTTP estándar directo al endpoint de su servidor Next.js. El componente visual de sincronización ya realiza este envío internamente:

```javascript
// Ejemplo de llamada segura desde cualquier botón administrador
const respuesta = await fetch('/api/generar-reporte', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tabla: 'nominales',          // O 'registros_quirurgicos', 'registros_obstetricos', 'registros_defunciones'
    fecha_inicio: '2026-05-01',  // Filtro opcional
    fecha_fin: '2026-05-28'      // Filtro opcional
  })
});
const resultado = await respuesta.json();
console.log('Fichero guardado en Drive con ID:', resultado.fileId);
```

### Paso 4: Limpieza de Dependencias Inutilizadas
Si ya no requiere otras librerías obsoletas que utilizaba el script previo, depure su archivo `package.json` ejecutando:
```bash
npm uninstall google-auth-library
```
*(Nota: la librería `@supabase/supabase-js`, `exceljs` y `googleapis` suplen perfectamente todo su flujo moderno).*

