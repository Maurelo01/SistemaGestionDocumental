export interface EstadoPapelera
{
  eliminado: boolean;
  fechaEliminacion: string | null;
  eliminadoPor: string | null;
}

export interface MigaPan
{
  _id: string;
  nombre: string;
}

export interface Carpeta
{
  _id: string;
  nombre: string;
  propietarioId: string;
  carpetaPadreId: string | null;
  ancestros: string[];
  papelera: EstadoPapelera;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ComentarioArchivo
{
  _id: string;
  usuarioId: string;
  nombreUsuario: string;
  texto: string;
  fechaCreacion: string;
}

export interface Archivo
{
  _id: string;
  nombre: string;
  extension: '.txt' | '.md';
  contenido?: string;
  tamanoBytes: number;
  propietarioId: any;
  carpetaId: string | null;
  comentarios: ComentarioArchivo[];
  papelera: EstadoPapelera;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ContenidoNivel
{
  carpetaActual: Carpeta | null;
  nivelAcceso?: string;
  rutaMigas: MigaPan[];
  carpetas: Carpeta[];
  archivos: Archivo[];
}

export type NivelAcceso = 'LECTURA' | 'EDICION' | 'COMENTAR';
export type TipoRecurso = 'ARCHIVO' | 'CARPETA';

export interface PermisoRecurso
{
  _id: string;
  recursoId: string;
  tipoRecurso: TipoRecurso;
  propietarioId: any;
  compartidoConId: any;
  nivelAcceso: NivelAcceso;
  fechaCreacion: string;
  recurso?: Archivo | Carpeta;
}

export interface ContenidoPapelera
{
  carpetas: Carpeta[];
  archivos: Archivo[];
}