export interface RespuestaApi<T>
{
    exito: boolean;
    mensaje?: string;
    datos: T;
    error?: string;
}

export interface Almacenamiento
{
    bytesUsados: number;
    cantidadArchivos: number;
}

export type RolUsuario = 'ADMIN' | 'USUARIO';

export interface Usuario
{
    _id: string;
    nombreUsuario: string;
    correo: string;
    rol: RolUsuario;
    activo: boolean;
    almacenamiento: Almacenamiento;
    fechaCreacion?: string;
fechaActualizacion?: string;
}

export interface DatosLogin
{
    token: string;
    usuario: Usuario;
}