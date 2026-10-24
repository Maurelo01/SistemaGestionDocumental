import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { FormatoUtil } from '../../core/utils/formato';
import { ExploradorUnidad } from './components/explorador-unidad/explorador-unidad';
import { VistaCompartidos } from './components/vista-compartidos/vista-compartidos';
import { VistaPapelera } from './components/vista-papelera/vista-papelera';
import { VistaUsuarios } from './components/vista-usuarios/vista-usuarios';
import { VistaReportes } from './components/vista-reportes/vista-reportes';

export type VistaDashboard = 'unidad' | 'compartidos' | 'papelera' | 'usuarios' | 'reportes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: 
  [
    CommonModule,
    ExploradorUnidad,
    VistaCompartidos,
    VistaPapelera,
    VistaUsuarios,
    VistaReportes,
  ],
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
    return FormatoUtil.formatearBytes(bytes);
  }
}