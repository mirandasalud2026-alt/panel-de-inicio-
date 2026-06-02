// Contrato de Datos Centralizado - Salud Miranda v3.3

export interface ContactoNominal {
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
}

export interface AutoridadesASIC {
  director: ContactoNominal;
  epidemiologia?: ContactoNominal;
  coordinador_aseguramiento?: ContactoNominal;
  pai_coordinador?: ContactoNominal;
  poder_popular?: ContactoNominal;
}

export interface EjeDisplayData {
  cod_eje: 'AMI' | 'VTY' | 'GGU' | 'BAR' | 'MET';
  nombre_eje: string;
  poblacion_estimada: number;
  responsable: string;           // Director de Eje
  contacto_emergencia: string;   // Teléfono de contacto oficial
  total_asics_oficial: number;
  total_cdis_oficial: number;
  cumplimiento_global: number;
}

export interface ASICData {
  id: string;                    // Clave Primaria física (Ej: 'ES-9006')
  nombre: string;
  cod_eje: 'AMI' | 'VTY' | 'GGU' | 'BAR' | 'MET';
  municipio: string;
  parroquia?: string;
  poblacion_estimada?: number;
  numero_centros?: number;
  autoridades: AutoridadesASIC;  // Campo Estructurado JSONB
}

export const defaultAutoridades = (init?: Partial<AutoridadesASIC>): AutoridadesASIC => ({
  director: { nombre: "Sin Asignar", cedula: "", telefono: "", correo: "" },
  epidemiologia: { nombre: "Sin Asignar", cedula: "", telefono: "", correo: "" },
  ...init
});