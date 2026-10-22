import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

export type VistaDashboard = 'unidad' | 'compartidos' | 'papelera' | 'usuarios' | 'reportes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard
{
  readonly authService = inject(AuthService);
  readonly vistaActual = signal<VistaDashboard>('unidad');

  cambiarVista(vista: VistaDashboard): void
  {
    this.vistaActual.set(vista);
  }

  formatearBytes(bytes: number = 0): string
  {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
}