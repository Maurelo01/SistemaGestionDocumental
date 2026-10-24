import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../models/usuarios';

@Injectable({
  providedIn: 'root',
})
export class ReportesService
{
    private readonly http = inject(HttpClient);
    private readonly API = `${environment.apiUrl}/reportes`;

    archivosPorTipo(): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/archivos/por-tipo`);
    }

    archivosPorFechas(fechaInicio?: string, fechaFin?: string): Observable<RespuestaApi<any[]>>
    {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/archivos/por-fechas`, { params });
    }

    archivosMasOperaciones(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/archivos/mas-operaciones?limite=${limite}`);
    }

    archivosNuncaCompartidos(): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/comparticion/nunca-compartidos`);
    }

    carpetasMasArchivos(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/carpetas/mas-archivos?limite=${limite}`);
    }

    topUsuariosArchivos(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/usuarios/top-archivos?limite=${limite}`);
    }

    usuariosMasCompartidos(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/usuarios/mas-compartidos?limite=${limite}`);
    }

    archivosMasCompartidos(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/comparticion/archivos-mas-compartidos?limite=${limite}`);
    }

    compartidosPorUsuario(usuarioId: string): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/comparticion/por-usuario/${usuarioId}`);
    }

    recibidosPorUsuario(usuarioId: string): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/comparticion/recibidos/${usuarioId}`);
    }

    historialUsuario(usuarioId: string, fechaInicio?: string, fechaFin?: string): Observable<RespuestaApi<any[]>>
    {
        let params = new HttpParams();
        if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
        if (fechaFin) params = params.set('fechaFin', fechaFin);
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/actividad/usuario/${usuarioId}`, { params });
    }

    operacionesPorTipo(): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/actividad/por-tipo`);
    }

    operacionesPorPeriodo(periodo: 'dia' | 'mes' = 'dia'): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/actividad/por-periodo?periodo=${periodo}`);
    }

    principalesAcciones(limite = 10): Observable<RespuestaApi<any[]>>
    {
        return this.http.get<RespuestaApi<any[]>>(`${this.API}/actividad/principales-acciones?limite=${limite}`);
    }
}