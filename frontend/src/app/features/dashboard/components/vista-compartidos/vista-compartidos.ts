import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentosService } from '../../../../core/services/documentosService';
import { Archivo, Carpeta, NivelAcceso, PermisoRecurso } from '../../../../core/models/documentos';
import { FormatoUtil } from '../../../../core/utils/formato';
import { VisorArchivo } from '../visor-archivo/visor-archivo';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vista-compartidos',
    standalone: true,
    imports: [CommonModule, FormsModule, VisorArchivo],
    templateUrl: './vista-compartidos.html',
})
export class VistaCompartidos implements OnInit
{
    private readonly docService = inject(DocumentosService);

    readonly recibidos = signal<PermisoRecurso[]>([]);
    readonly enviados = signal<PermisoRecurso[]>([]);
    readonly archivoSeleccionadoId = signal<string | null>(null);
    readonly carpetaCompartidaAbierta = signal<Carpeta | null>(null);
    readonly archivosCarpetaCompartida = signal<Archivo[]>([]);

    ngOnInit(): void
    {
        this.cargarCompartidos();
    }

    cargarCompartidos(): void
    {
        this.docService.obtenerCompartidosConmigo().subscribe((res) => this.recibidos.set(res.datos));
        this.docService.obtenerCompartidosPorMi().subscribe((res) => this.enviados.set(res.datos));
    }

    abrirRecursoRecibido(item: PermisoRecurso): void
    {
        if (item.tipoRecurso === 'ARCHIVO')
        {
            this.archivoSeleccionadoId.set(item.recursoId);
        }
        else
        {
        this.docService.obtenerContenidoCarpeta(item.recursoId).subscribe({
            next: (res) =>
            {
                this.carpetaCompartidaAbierta.set(res.datos.carpetaActual);
                this.archivosCarpetaCompartida.set(res.datos.archivos);
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
        }
    }

    cambiarNivelPermiso(item: PermisoRecurso, nuevoNivel: NivelAcceso): void
    {
        const destinatarioId = item.compartidoConId?._id || item.compartidoConId;
        this.docService
        .compartirRecurso
        ({
            recursoId: item.recursoId,
            tipoRecurso: item.tipoRecurso,
            compartidoConId: destinatarioId,
            nivelAcceso: nuevoNivel,
        })
        .subscribe
        ({
            next: () =>
            {
                FormatoUtil.mostrarExito('Permiso actualizado a ' + nuevoNivel);
                this.cargarCompartidos();
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    revocarAcceso(permisoId: string): void
    {
        this.docService.revocarPermiso(permisoId).subscribe
        ({
            next: () =>
            {
                FormatoUtil.mostrarExito('Permiso retirado');
                this.cargarCompartidos();
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }
}