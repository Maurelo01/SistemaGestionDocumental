import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentosService } from '../../../../core/services/documentosService';
import { AuthService } from '../../../../core/services/auth';
import { Archivo } from '../../../../core/models/documentos';
import { FormatoUtil } from '../../../../core/utils/formato';

@Component({
  selector: 'app-visor-archivo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visor-archivo.html',
})
export class VisorArchivo implements OnChanges
{
    private readonly docService = inject(DocumentosService);
    private readonly authService = inject(AuthService);

    @Input({ required: true }) archivoId!: string;
    @Output() cerrar = new EventEmitter<void>();
    @Output() actualizado = new EventEmitter<void>();

    readonly archivo = signal<Archivo | null>(null);
    readonly nivelAcceso = signal<string>('LECTURA');
    contenido = '';
    nuevoComentario = '';

    ngOnChanges(): void
    {
        if (this.archivoId) this.cargarArchivo();
    }

    formatearBytes = FormatoUtil.formatearBytes;

    get puedeEditar(): boolean
    {
        return ['PROPIETARIO', 'EDICION'].includes(this.nivelAcceso());
    }

    get puedeComentar(): boolean
    {
        return ['PROPIETARIO', 'EDICION', 'COMENTAR'].includes(this.nivelAcceso());
    }

    cargarArchivo(): void
    {
        this.docService.obtenerArchivoPorId(this.archivoId).subscribe
        ({
            next: (res) =>
            {
                this.archivo.set(res.datos.archivo);
                this.nivelAcceso.set(res.datos.nivelAcceso);
                this.contenido = res.datos.archivo.contenido || '';
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    guardarContenido(): void
    {
        const actual = this.archivo();
        if (!actual) return;

        this.docService.editarContenidoArchivo(actual._id, this.contenido).subscribe
        ({
            next: (res) =>
            {
                this.archivo.set(res.datos);
                FormatoUtil.mostrarExito('Contenido actualizado');
                this.authService.actualizarPerfil().subscribe();
                this.actualizado.emit();
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    comentar(): void
    {
        const actual = this.archivo();
        if (!actual || !this.nuevoComentario.trim()) return;

        this.docService.agregarComentario(actual._id, this.nuevoComentario.trim()).subscribe
        ({
            next: (res) =>
            {
                this.nuevoComentario = '';
                this.archivo.set({ ...actual, comentarios: res.datos });
                FormatoUtil.mostrarExito('Comentario agregado');
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    descargar(): void
    {
        const actual = this.archivo();
        if (!actual) return;

        this.docService.descargarArchivo(actual._id).subscribe
        ({
            next: (blob) => FormatoUtil.dispararDescargaNavegador(blob, `${actual.nombre}${actual.extension}`),
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }
}