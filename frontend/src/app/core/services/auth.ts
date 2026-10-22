import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { DatosLogin, RespuestaApi, Usuario } from '../models/usuarios';

@Injectable({
  providedIn: 'root',
})

export class AuthService
{
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly usuarioAutenticado = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioAutenticado.asObservable();

  constructor()
  {
    this.cargarUsuarioDesdeStorage();
  }

  iniciarSesion(nombreUsuario: string, contrasena: string): Observable<RespuestaApi<DatosLogin>>
  {
    return this.http.post<RespuestaApi<DatosLogin>>(`${this.API_URL}/login`, { nombreUsuario, contrasena }).pipe
    (
      tap((respuesta: any) =>
      {
        if (respuesta.exito && respuesta.datos) this.guardarSesion(respuesta.datos.token, respuesta.datos.usuario);
      })
    );
  }

  actualizarPerfil(): Observable<RespuestaApi<Usuario>>
  {
    return this.http.get<RespuestaApi<Usuario>>(`${this.API_URL}/perfil`).pipe(
      tap((respuesta) =>
      {
        if (respuesta.exito && respuesta.datos)
        {
          localStorage.setItem('usuario', JSON.stringify(respuesta.datos));
          this.usuarioAutenticado.next(respuesta.datos);
        }
      })
    );
  }

  cerrarSesion(): void
  {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioAutenticado.next(null);
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null
  {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('token');
  }

  obtenerUsuarioActual(): Usuario | null
  {
    return this.usuarioAutenticado.value;
  }

  estaAutenticado(): boolean
  {
    return !!this.obtenerToken();
  }

  esAdmin(): boolean
  {
    return this.usuarioAutenticado.value?.rol === 'ADMIN';
  }

  private guardarSesion(token: string, usuario: Usuario): void {
    if (typeof localStorage !== 'undefined')
    {
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
    this.usuarioAutenticado.next(usuario);
  }

  private cargarUsuarioDesdeStorage(): void
  {
    if (typeof localStorage === 'undefined') return;
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr)
    {
      try
      {
        this.usuarioAutenticado.next(JSON.parse(usuarioStr) as Usuario);
      }
      catch
      {
        this.cerrarSesion();
      }
    }
  }
}