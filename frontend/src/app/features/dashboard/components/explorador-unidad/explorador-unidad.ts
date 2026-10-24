import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DocumentosService } from '../../../../core/services/documentosService';
import { UsuariosService } from '../../../../core/services/usuariosService';
import { AuthService } from '../../../../core/services/auth';
import { Archivo, Carpeta, MigaPan, TipoRecurso } from '../../../../core/models/documentos';
import { Usuario } from '../../../../core/models/usuarios';
import { FormatoUtil } from '../../../../core/utils/formato';
import { VisorArchivo } from '../visor-archivo/visor-archivo';
import { ModalMover, RecursoMovimiento } from '../modal-mover/modal-mover';

@Component({
    selector: 'app-explorador-unidad',
    standalone: true,
    imports: [CommonModule, FormsModule, VisorArchivo, ModalMover],
    templateUrl: './explorador-unidad.html',
})

export class ExploradorUnidad implements OnInit
{
    private readonly docService = inject(DocumentosService);
    private readonly usuariosService = inject(UsuariosService);
    private readonly authService = inject(AuthService);

    @ViewChild(VisorArchivo) visorComponent?: VisorArchivo;
    
    readonly carpetas = signal<Carpeta[]>([]);
    readonly archivos = signal<Archivo[]>([]);
    readonly carpetaActual = signal<Carpeta | null>(null);
    readonly rutaMigas = signal<MigaPan[]>([]);
    readonly usuariosActivos = signal<Usuario[]>([]);
    readonly archivoAbiertoId = signal<string | null>(null);
    readonly recursoAMover = signal<RecursoMovimiento | null>(null);
    readonly modoBusqueda = signal<boolean>(false);
    readonly terminoBusqueda = signal<string>('');
    readonly filtroSeleccionado = signal<string>('TODOS');
    readonly mostrarSeccionCarpetas = computed(() =>
        ['TODOS', 'CARPETAS'].includes(this.filtroSeleccionado())
    );
    readonly mostrarSeccionArchivos = computed(() =>
        this.filtroSeleccionado() !== 'CARPETAS'
    );
    readonly carpetasVisibles = computed(() => {
        const term = this.terminoBusqueda().toLowerCase().trim();
        if (!term) return this.carpetas();
        return this.carpetas().filter((c) => c.nombre.toLowerCase().includes(term));
    });
    nombreNuevaCarpeta = '';
    nuevoArchivo = { nombre: '', extension: '.txt' as '.txt' | '.md', contenido: '' };
    formatearBytes = FormatoUtil.formatearBytes;

    ngOnInit(): void
    {
        this.cargarNivel(null);
        const miId = this.authService.obtenerUsuarioActual()?._id;
        this.usuariosService.listarUsuarios('', true).subscribe((res) => {this.usuariosActivos.set(res.datos.filter((u) => u._id !== miId));});
    }

    private ejecutarAccion(peticion$: Observable<any>, mensajeExito: string, actualizarEspacio = false): void
    {
        peticion$.subscribe
        ({
        next: () =>
        {
            FormatoUtil.mostrarExito(mensajeExito);
            this.cargarNivel();
            if (actualizarEspacio) this.authService.actualizarPerfil().subscribe();
        },
        error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    cargarNivel(carpetaId: string | null = this.carpetaActual()?._id || null): void 
    {
        this.modoBusqueda.set(false);
        const peticion$ = carpetaId ? this.docService.obtenerContenidoCarpeta(carpetaId) : this.docService.obtenerRaiz();

        peticion$.subscribe
        ({
            next: (res) =>
            {
                this.carpetaActual.set(res.datos.carpetaActual);
                this.rutaMigas.set(res.datos.rutaMigas);
                this.carpetas.set(res.datos.carpetas);
                this.archivos.set(res.datos.archivos);
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    aplicarFiltro(): void
    {
        const tipo = this.filtroSeleccionado();
        const texto = this.terminoBusqueda().trim();

        if (tipo === 'CARPETAS') return;

        const extension = tipo === '.txt' || tipo === '.md' ? tipo : undefined;
        if (!texto && !extension)
        {
            this.cargarNivel();
            return;
        }

        this.docService.buscarArchivos({ buscar: texto, extension }).subscribe
        ({
            next: (res) => this.archivos.set(res.datos),
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    crearCarpeta(): void
    {
        if (!this.nombreNuevaCarpeta.trim()) return;
        const req$ = this.docService.crearCarpeta(this.nombreNuevaCarpeta.trim(), this.carpetaActual()?._id || null);
        this.nombreNuevaCarpeta = '';
        this.ejecutarAccion(req$, 'Carpeta creada');
    }

    crearArchivoTexto(): void
    {
        if (!this.nuevoArchivo.nombre.trim()) return;
        const req$ = this.docService.crearArchivoTexto({ ...this.nuevoArchivo, carpetaId: this.carpetaActual()?._id || null });
        this.nuevoArchivo = { nombre: '', extension: '.txt', contenido: '' };
        this.ejecutarAccion(req$, 'Documento almacenado', true);
    }

    subirArchivoFisico(evento: Event): void
    {
        const input = evento.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;
        input.value = '';
        this.ejecutarAccion(this.docService.subirArchivoFisico(archivo, this.carpetaActual()?._id || null), 'Archivo cargado', true);
    }

    async renombrar(tipo: TipoRecurso, id: string, nombreActual: string): Promise<void>
    {
        const nuevoNombre = await FormatoUtil.pedirNuevoNombre(tipo, nombreActual);
        if (!nuevoNombre) return;

        this.docService.renombrarRecurso(tipo, id, nuevoNombre).subscribe
        ({
            next: () =>
            {
                FormatoUtil.mostrarExito('Renombrado correctamente');
                this.cargarNivel();
                if (tipo === 'ARCHIVO' && this.archivoAbiertoId() === id) this.visorComponent?.cargarArchivo();
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    mover(tipo: TipoRecurso, id: string, nombre: string): void
    {
        this.recursoAMover.set({ id, nombre, tipo });
    }

    async compartir(tipoRecurso: TipoRecurso, recursoId: string, nombre: string): Promise<void>
    {
        const datos = await FormatoUtil.pedirDatosCompartir(nombre, this.usuariosActivos());
        if (datos) this.ejecutarAccion(this.docService.compartirRecurso({ recursoId, tipoRecurso, ...datos }), 'Recurso compartido');
    }

    enviarAPapelera(tipo: TipoRecurso, id: string): void
    { 
        if (this.archivoAbiertoId() === id) this.archivoAbiertoId.set(null);
        this.ejecutarAccion(this.docService.enviarAPapelera(tipo, id), 'Enviado a la papelera');
    }
}