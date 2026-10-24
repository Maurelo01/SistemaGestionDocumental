import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentosService } from '../../../../core/services/documentosService';
import { Carpeta, MigaPan, TipoRecurso } from '../../../../core/models/documentos';
import { FormatoUtil } from '../../../../core/utils/formato';

export interface RecursoMovimiento {
    id: string;
    nombre: string;
    tipo: TipoRecurso;
}

@Component({
    selector: 'app-modal-mover',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-mover.html',
    styleUrl: './modal-mover.css',
})
export class ModalMover implements OnInit {
    private readonly docService = inject(DocumentosService);

    @Input({ required: true }) recurso!: RecursoMovimiento;
    @Output() cerrar = new EventEmitter<void>();
    @Output() movido = new EventEmitter<void>();

    readonly carpetaUbicacion = signal<Carpeta | null>(null);
    readonly subcarpetas = signal<Carpeta[]>([]);
    readonly rutaMigas = signal<MigaPan[]>([]);
    readonly carpetaSeleccionada = signal<Carpeta | null>(null);
    readonly cargando = signal<boolean>(false);
    readonly maximizado = signal<boolean>(false);

    ngOnInit(): void
    {
        this.navegarA(null);
    }

    @HostListener('document:keydown.escape')
    alPresionarEscape(): void
    {
        this.cerrar.emit();
    }

    alternarTamano(): void
    {
        this.maximizado.update((valor) => !valor);
    }

    get destinoId(): string | null
    {
        return this.carpetaSeleccionada()?._id ?? this.carpetaUbicacion()?._id ?? null;
    }

    get destinoNombre(): string
    {
        return(this.carpetaSeleccionada()?.nombre ?? this.carpetaUbicacion()?.nombre ?? 'Mi Unidad (Raíz)');
    }

    navegarA(carpetaId: string | null): void
    {
        if (carpetaId === this.recurso.id) return;
        this.cargando.set(true);
        this.carpetaSeleccionada.set(null);

        const peticion$ = carpetaId
        ? this.docService.obtenerContenidoCarpeta(carpetaId)
        : this.docService.obtenerRaiz();

        peticion$.subscribe
        ({
        next: (res) =>
        {
            this.carpetaUbicacion.set(res.datos.carpetaActual);
            this.rutaMigas.set(res.datos.rutaMigas);
            this.subcarpetas.set(res.datos.carpetas);
            this.cargando.set(false);
        },
        error: (err) =>
        {
            this.cargando.set(false);
            FormatoUtil.mostrarError(err);
        },
        });
    }

    subirUnNivel(): void
    {
        const actual = this.carpetaUbicacion();
        if (!actual) return;
        this.navegarA(actual.carpetaPadreId);
    }

    seleccionarCarpeta(carpeta: Carpeta): void
    {
        if (carpeta._id === this.recurso.id) return;
        const actualSel = this.carpetaSeleccionada();
        this.carpetaSeleccionada.set(actualSel?._id === carpeta._id ? null : carpeta);
    }

    confirmarMoverAqui(): void
    {
        this.docService.moverRecurso(this.recurso.tipo, this.recurso.id, this.destinoId).subscribe({
        next: () =>
        {
            FormatoUtil.mostrarExito(`Movido a "${this.destinoNombre}"`);
            this.movido.emit();
        },
        error: (err) => FormatoUtil.mostrarError(err),
        });
    }
}