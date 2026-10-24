import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { DocumentosService } from '../../../../core/services/documentosService';
import { AuthService } from '../../../../core/services/auth';
import { Archivo, Carpeta, TipoRecurso } from '../../../../core/models/documentos';
import { FormatoUtil } from '../../../../core/utils/formato';

@Component({
    selector: 'app-vista-papelera',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './vista-papelera.html',
})
export class VistaPapelera implements OnInit
{
    private readonly docService = inject(DocumentosService);
    private readonly authService = inject(AuthService);

    readonly carpetas = signal<Carpeta[]>([]);
    readonly archivos = signal<Archivo[]>([]);

    ngOnInit(): void
    {
        this.cargarPapelera();
    }

    formatearBytes(bytes: number): string 
    {
        return FormatoUtil.formatearBytes(bytes);
    }

    cargarPapelera(): void
    {
        this.docService.obtenerPapelera().subscribe
        ({
            next: (res) =>
            {
                this.carpetas.set(res.datos.carpetas);
                this.archivos.set(res.datos.archivos);
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    restaurar(tipo: TipoRecurso, id: string): void
    {
        this.docService.restaurarDePapelera(tipo, id).subscribe
        ({
            next: () =>
            {
                FormatoUtil.mostrarExito('Recurso restaurado');
                this.cargarPapelera();
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    eliminarPermanente(tipo: TipoRecurso, id: string, nombre: string): void
    {
        Swal.fire
        ({
            title: '¿Eliminar definitivamente?',
            text: `'${nombre}' se borrará de forma definitiva y liberará espacio.`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar permanente',
            cancelButtonText: 'Cancelar',
        }).then((res) =>
        {
            if (res.isConfirmed)
            {
                this.docService.eliminarDefinitivo(tipo, id).subscribe
                ({
                    next: () =>
                    {
                        FormatoUtil.mostrarExito('Eliminado definitivamente');
                        this.cargarPapelera();
                        this.authService.actualizarPerfil().subscribe();
                    },
                    error: (err) => FormatoUtil.mostrarError(err),
                });
            }
        });
    }
}