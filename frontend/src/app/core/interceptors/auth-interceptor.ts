import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { CargaService } from '../services/carga';

export const authInterceptor: HttpInterceptorFn = (req, next) =>
{
  const authService = inject(AuthService);
  const token = authService.obtenerToken();
  const cargaService = inject(CargaService);

  cargaService.mostrar();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe
  (
    catchError((error: HttpErrorResponse) =>
    {
      if (error.status === 401 && !req.url.includes('/auth/login')) authService.cerrarSesion();
      return throwError(() => error);
    }),
    finalize(() => cargaService.ocultar())
  );
};