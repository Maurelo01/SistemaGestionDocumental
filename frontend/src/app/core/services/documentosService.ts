import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../models/usuarios';
import
{
    Archivo,
    Carpeta,
    ComentarioArchivo,
    ContenidoNivel,
    ContenidoPapelera,
    NivelAcceso,
    PermisoRecurso,
    TipoRecurso,
} from '../models/documentos';

@Injectable({
    providedIn: 'root',
})
export class DocumentosService
{
    private readonly http = inject(HttpClient);
    private readonly API = environment.apiUrl;

    obtenerRaiz(): Observable<RespuestaApi<ContenidoNivel>>
    {
        return this.http.get<RespuestaApi<ContenidoNivel>>(`${this.API}/carpetas/raiz`);
    }

    obtenerContenidoCarpeta(carpetaId: string): Observable<RespuestaApi<ContenidoNivel>>
    {
        return this.http.get<RespuestaApi<ContenidoNivel>>(`${this.API}/carpetas/${carpetaId}/contenido`);
    }

    crearCarpeta(nombre: string, carpetaPadreId: string | null = null): Observable<RespuestaApi<Carpeta>>
    {
        return this.http.post<RespuestaApi<Carpeta>>(`${this.API}/carpetas`, { nombre, carpetaPadreId });
    }

    renombrarRecurso(tipo: TipoRecurso, id: string, nombre: string): Observable<RespuestaApi<any>>
    {
        const coleccion = tipo === 'CARPETA' ? 'carpetas' : 'archivos';
        return this.http.patch<RespuestaApi<any>>(`${this.API}/${coleccion}/${id}/renombrar`, { nombre });
    }

    moverRecurso(tipo: TipoRecurso, id: string, carpetaDestinoId: string | null): Observable<RespuestaApi<any>>
    {
        const coleccion = tipo === 'CARPETA' ? 'carpetas' : 'archivos';
        return this.http.patch<RespuestaApi<any>>(`${this.API}/${coleccion}/${id}/mover`, { carpetaDestinoId });
    }

    buscarArchivos(filtros: { buscar?: string; extension?: string; ordenarPor?: string; orden?: string }): Observable<RespuestaApi<Archivo[]>>
    {
        let params = new HttpParams();
        if (filtros.buscar) params = params.set('buscar', filtros.buscar);
        if (filtros.extension) params = params.set('extension', filtros.extension);
        if (filtros.ordenarPor) params = params.set('ordenarPor', filtros.ordenarPor);
        if (filtros.orden) params = params.set('orden', filtros.orden);
        return this.http.get<RespuestaApi<Archivo[]>>(`${this.API}/archivos`, { params });
    }

    crearArchivoTexto(datos:
    {
        nombre: string;
        extension: '.txt' | '.md';
        contenido: string;
        carpetaId: string | null;
    }):
    Observable<RespuestaApi<Archivo>>
    {
        return this.http.post<RespuestaApi<Archivo>>(`${this.API}/archivos`, datos);
    }

    subirArchivoFisico(archivo: File, carpetaId: string | null = null): Observable<RespuestaApi<Archivo>>
    {
        const formData = new FormData();
        formData.append('archivo', archivo);
        if (carpetaId) formData.append('carpetaId', carpetaId);

        return this.http.post<RespuestaApi<Archivo>>(`${this.API}/archivos`, formData);
    }

    obtenerArchivoPorId(id: string): Observable<RespuestaApi<{ archivo: Archivo; nivelAcceso: string }>>
    {
        return this.http.get<RespuestaApi<{ archivo: Archivo; nivelAcceso: string }>>(`${this.API}/archivos/${id}`);
    }

    descargarArchivo(id: string): Observable<Blob>
    {
        return this.http.get(`${this.API}/archivos/${id}/descargar`, { responseType: 'blob' });
    }

    editarContenidoArchivo(id: string, contenido: string): Observable<RespuestaApi<Archivo>>
    {
        return this.http.put<RespuestaApi<Archivo>>(`${this.API}/archivos/${id}/contenido`, { contenido });
    }

    agregarComentario(archivoId: string, texto: string): Observable<RespuestaApi<ComentarioArchivo[]>>
    {
        return this.http.post<RespuestaApi<ComentarioArchivo[]>>(`${this.API}/archivos/${archivoId}/comentarios`, { texto });
    }

    compartirRecurso(datos:
    {
        recursoId: string;
        tipoRecurso: TipoRecurso;
        compartidoConId: string;
        nivelAcceso: NivelAcceso;
    }):
    Observable<RespuestaApi<PermisoRecurso>>
    {
        return this.http.post<RespuestaApi<PermisoRecurso>>(`${this.API}/permisos`, datos);
    }

    obtenerCompartidosConmigo(): Observable<RespuestaApi<PermisoRecurso[]>>
    {
        return this.http.get<RespuestaApi<PermisoRecurso[]>>(`${this.API}/permisos/conmigo`);
    }

    obtenerCompartidosPorMi(): Observable<RespuestaApi<PermisoRecurso[]>>
    {
        return this.http.get<RespuestaApi<PermisoRecurso[]>>(`${this.API}/permisos/por-mi`);
    }

    revocarPermiso(permisoId: string): Observable<RespuestaApi<void>>
    {
        return this.http.delete<RespuestaApi<void>>(`${this.API}/permisos/${permisoId}`);
    }

    obtenerPapelera(): Observable<RespuestaApi<ContenidoPapelera>>
    {
        return this.http.get<RespuestaApi<ContenidoPapelera>>(`${this.API}/papelera`);
    }

    enviarAPapelera(tipoRecurso: TipoRecurso, id: string): Observable<RespuestaApi<any>>
    {
        return this.http.post<RespuestaApi<any>>(`${this.API}/papelera/${tipoRecurso}/${id}`, {});
    }

    restaurarDePapelera(tipoRecurso: TipoRecurso, id: string): Observable<RespuestaApi<any>>
    {
        return this.http.post<RespuestaApi<any>>(`${this.API}/papelera/${tipoRecurso}/${id}/restaurar`, {});
    }

    eliminarDefinitivo(tipoRecurso: TipoRecurso, id: string): Observable<RespuestaApi<void>>
    {
        return this.http.delete<RespuestaApi<void>>(`${this.API}/papelera/${tipoRecurso}/${id}`);
    }
}