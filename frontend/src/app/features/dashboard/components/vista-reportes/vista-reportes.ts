// frontend/src/app/features/dashboard/components/vista-reportes/vista-reportes.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ReportesService } from '../../../../core/services/reportes';
import { UsuariosService } from '../../../../core/services/usuariosService';
import { AuthService } from '../../../../core/services/auth';
import { Usuario } from '../../../../core/models/usuarios';
import { FormatoUtil } from '../../../../core/utils/formato';

export type CategoriaReporte = 'archivos' | 'usuarios' | 'comparticion' | 'actividad';

@Component({
    selector: 'app-vista-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './vista-reportes.html',
})
export class VistaReportes implements OnInit
{
    private readonly reportesService = inject(ReportesService);
    private readonly usuariosService = inject(UsuariosService);
    readonly authService = inject(AuthService);

    readonly categoriaActiva = signal<CategoriaReporte>('comparticion');
    readonly listaUsuarios = signal<Usuario[]>([]);

    readonly rep1ArchivosPorTipo = signal<any[]>([]);
    readonly rep2ArchivosPorFechas = signal<any[]>([]);
    readonly rep3ArchivosMasOperaciones = signal<any[]>([]);
    readonly rep4TopUsuariosArchivos = signal<any[]>([]);
    readonly rep5UsuariosMasCompartidos = signal<any[]>([]);
    readonly rep6ArchivosMasCompartidos = signal<any[]>([]);
    readonly rep7CompartidosPorUsuario = signal<any[]>([]);
    readonly rep8RecibidosPorUsuario = signal<any[]>([]);
    readonly rep9HistorialUsuario = signal<any[]>([]);
    readonly rep10OperacionesPorTipo = signal<any[]>([]);
    readonly rep11OperacionesPorPeriodo = signal<any[]>([]);
    readonly rep12PrincipalesAcciones = signal<any[]>([]);
    readonly rep13ArchivosNuncaCompartidos = signal<any[]>([]);
    readonly rep14CarpetasMasArchivos = signal<any[]>([]);

    fechaInicioArchivos = '';
    fechaFinArchivos = '';
    usuarioSeleccionadoCompId = '';
    usuarioSeleccionadoActId = '';
    fechaInicioActividad = '';
    fechaFinActividad = '';
    periodoAgrupacion: 'dia' | 'mes' = 'dia';

    formatearBytes = FormatoUtil.formatearBytes;

    ngOnInit(): void
    {
        const miId = this.authService.obtenerUsuarioActual()?._id || '';
        if (!this.authService.esAdmin())
        {
            this.categoriaActiva.set('comparticion');
            this.usuarioSeleccionadoCompId = miId;
            this.usuarioSeleccionadoActId = miId;
            this.consultarReportesUsuarioComparticion();
            this.consultarHistorialActividadUsuario();
            return;
        }

        this.categoriaActiva.set('archivos');
        this.usuariosService.listarUsuarios().subscribe((res) =>
        {
            this.listaUsuarios.set(res.datos);
            const idInicial = res.datos[0]?._id || '';
            this.usuarioSeleccionadoCompId = idInicial;
            this.usuarioSeleccionadoActId = idInicial;
            this.consultarReportesUsuarioComparticion();
            this.consultarHistorialActividadUsuario();
        });

        forkJoin
        ([
            this.reportesService.archivosPorTipo(),
            this.reportesService.archivosPorFechas(),
            this.reportesService.archivosMasOperaciones(),
            this.reportesService.topUsuariosArchivos(),
            this.reportesService.usuariosMasCompartidos(),
            this.reportesService.archivosMasCompartidos(),
            this.reportesService.operacionesPorTipo(),
            this.reportesService.operacionesPorPeriodo(this.periodoAgrupacion),
            this.reportesService.principalesAcciones(),
            this.reportesService.archivosNuncaCompartidos(),
            this.reportesService.carpetasMasArchivos(),
        ]).subscribe(([r1, r2, r3, r4, r5, r6, r10, r11, r12, r13, r14]) =>
        {
            this.rep1ArchivosPorTipo.set(r1.datos);
            this.rep2ArchivosPorFechas.set(r2.datos);
            this.rep3ArchivosMasOperaciones.set(r3.datos);
            this.rep4TopUsuariosArchivos.set(r4.datos);
            this.rep5UsuariosMasCompartidos.set(r5.datos);
            this.rep6ArchivosMasCompartidos.set(r6.datos);
            this.rep10OperacionesPorTipo.set(r10.datos);
            this.rep11OperacionesPorPeriodo.set(r11.datos);
            this.rep12PrincipalesAcciones.set(r12.datos);
            this.rep13ArchivosNuncaCompartidos.set(r13.datos);
            this.rep14CarpetasMasArchivos.set(r14.datos);
        });
    }

    cambiarCategoria(cat: CategoriaReporte): void
    {
        this.categoriaActiva.set(cat);
    }

    filtrarArchivosPorFechas(): void
    {
        this.reportesService.archivosPorFechas(this.fechaInicioArchivos, this.fechaFinArchivos).subscribe((r) =>
        {
            this.rep2ArchivosPorFechas.set(r.datos);
        });
    }

    limpiarFechasArchivos(): void
    {
        this.fechaInicioArchivos = '';
        this.fechaFinArchivos = '';
        this.filtrarArchivosPorFechas();
    }

    consultarReportesUsuarioComparticion(): void
    {
        if (!this.usuarioSeleccionadoCompId) return;
        this.reportesService.compartidosPorUsuario(this.usuarioSeleccionadoCompId).subscribe((r) => this.rep7CompartidosPorUsuario.set(r.datos));
        this.reportesService.recibidosPorUsuario(this.usuarioSeleccionadoCompId).subscribe((r) => this.rep8RecibidosPorUsuario.set(r.datos));
    }

    consultarHistorialActividadUsuario(): void
    {
        if (!this.usuarioSeleccionadoActId) return;
        this.reportesService
        .historialUsuario(this.usuarioSeleccionadoActId, this.fechaInicioActividad, this.fechaFinActividad)
        .subscribe((r) => this.rep9HistorialUsuario.set(r.datos));
    }

    cambiarPeriodoOperaciones(): void
    {
        this.reportesService.operacionesPorPeriodo(this.periodoAgrupacion).subscribe((r) => this.rep11OperacionesPorPeriodo.set(r.datos));
    }
}