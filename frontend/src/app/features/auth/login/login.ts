import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})

export class Login
{
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly formularioLogin: FormGroup = this.fb.group
  ({
    nombreUsuario: ['', [Validators.required]],
    contrasena: ['', [Validators.required]],
  });

  readonly cargando = signal<boolean>(false);

  constructor()
  {
    if (this.authService.estaAutenticado()) this.router.navigate(['/dashboard']);
  }

  iniciarSesion(): void
  {
    if (this.formularioLogin.invalid)
    {
      Swal.fire('Campos vacíos', 'Por favor, escriba usuario y contraseña.', 'warning');
      return;
    }

    this.cargando.set(true);

    const { nombreUsuario, contrasena } = this.formularioLogin.value;

    this.authService.iniciarSesion(nombreUsuario, contrasena).subscribe
    ({
      next: (respuesta) =>
      {
        this.cargando.set(false);
        const usuario = respuesta.datos.usuario;
        Swal.fire
        ({
          title: '¡Bienvenido!',
          text: `Hola, ${usuario.nombreUsuario}`,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false,
        }).then(() =>
        {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) =>
      {
        this.cargando.set(false);
        Swal.fire
        (
          'Acceso denegado',
          err.error?.mensaje || 'Datos incorrectas o error de conexión.',
          'error'
        );
      },
    });
  }

  usarCuentaRapida(usuario: string): void
  {
    this.formularioLogin.patchValue
    ({
      nombreUsuario: usuario,
      contrasena: '1234',
    });
    this.iniciarSesion();
  }
}