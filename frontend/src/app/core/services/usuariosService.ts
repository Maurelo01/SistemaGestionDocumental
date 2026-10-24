import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaApi, RolUsuario, Usuario } from '../models/usuarios';

@Injectable({
  providedIn: 'root',
})

export class UsuariosService
{
    private readonly http = inject(HttpClient);
    private readonly API_URL = `${environment.apiUrl}/usuarios`;

    listarUsuarios(buscar?: string, soloActivos?: boolean): Observable<RespuestaApi<Usuario[]>>
    {
        let params = new HttpParams();
        if (buscar) params = params.set('buscar', buscar);
        if (soloActivos !== undefined) params = params.set('soloActivos', String(soloActivos));

        return this.http.get<RespuestaApi<Usuario[]>>(this.API_URL, { params });
    }

    crearUsuario(datos:
    {
        nombreUsuario: string;
        correo: string;
        contrasena: string;
        rol: RolUsuario;
        bytesAsignados?: number;
    }):
    Observable<RespuestaApi<Usuario>>
    {
        return this.http.post<RespuestaApi<Usuario>>(this.API_URL, datos);
    }

    cambiarEstado(id: string, activo: boolean): Observable<RespuestaApi<Usuario>>
    {
        return this.http.patch<RespuestaApi<Usuario>>(`${this.API_URL}/${id}/estado`, { activo });
    }

    cambiarCuota(id: string, bytesAsignados: number): Observable<RespuestaApi<Usuario>>
    {
        return this.http.patch<RespuestaApi<Usuario>>(`${this.API_URL}/${id}/cuota`, { bytesAsignados });
    }
}