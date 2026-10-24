import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { UsuariosService } from '../../../../core/services/usuariosService';
import { AuthService } from '../../../../core/services/auth';
import { RolUsuario, Usuario } from '../../../../core/models/usuarios';
import { FormatoUtil } from '../../../../core/utils/formato';

const BYTES_POR_MB = 1024 * 1024;

@Component({
    selector: 'app-vista-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './vista-usuarios.html',
})
export class VistaUsuarios implements OnInit
{
    private readonly usuariosService = inject(UsuariosService);
    readonly authService = inject(AuthService);

    readonly usuarios = signal<Usuario[]>([]);
    terminoBusqueda = '';
    filtroSoloActivos = false;

    nuevoUsuario =
    {
        nombreUsuario: '',
        correo: '',
        contrasena: '',
        rol: 'USUARIO' as RolUsuario,
        mbAsignados: 10,
    };

    ngOnInit(): void
    {
        this.cargarUsuarios();
    }

    formatearBytes(bytes: number): string
    {
        return FormatoUtil.formatearBytes(bytes);
    }

    cargarUsuarios(): void
    {
        const filtroActivo = this.filtroSoloActivos ? true : undefined;
        this.usuariosService.listarUsuarios(this.terminoBusqueda.trim(), filtroActivo).subscribe
        ({
            next: (res) => this.usuarios.set(res.datos),
            error: (err) => FormatoUtil.mostrarError(err, 'No se pudo cargar la lista de usuarios.'),
        });
    }

    registrarUsuario(): void
    {
        if (!this.nuevoUsuario.nombreUsuario.trim() || !this.nuevoUsuario.correo.trim() || !this.nuevoUsuario.contrasena.trim())
        {
            Swal.fire('Campos incompletos', 'Todos los campos son obligatorios.', 'warning');
            return;
        }
        const mb = Number(this.nuevoUsuario.mbAsignados) > 0 ? Number(this.nuevoUsuario.mbAsignados) : 10;

        this.usuariosService
        .crearUsuario
        ({
            nombreUsuario: this.nuevoUsuario.nombreUsuario.trim(),
            correo: this.nuevoUsuario.correo.trim(),
            contrasena: this.nuevoUsuario.contrasena,
            rol: this.nuevoUsuario.rol,
            bytesAsignados: Math.round(mb * BYTES_POR_MB),
        })
        .subscribe
        ({
            next: () => 
            {
                this.nuevoUsuario = { nombreUsuario: '', correo: '', contrasena: '', rol: 'USUARIO', mbAsignados: 10 };
                FormatoUtil.mostrarExito('Usuario registrado exitosamente');
                this.cargarUsuarios();
            },
            error: (err) => FormatoUtil.mostrarError(err, 'Error al crear el usuario.'),
        });
    }

    async modificarCuotaUsuario(usuario: Usuario): Promise<void>
    {
        const bytesActuales = usuario.almacenamiento.bytesAsignados || 10 * BYTES_POR_MB;
        const mbActuales = +(bytesActuales / BYTES_POR_MB).toFixed(2);

        const { value: nuevosMb } = await Swal.fire
        ({
            title: `Almacenamiento de ${usuario.nombreUsuario}`,
            text: 'Ingresa la nueva capacidad asignada en MB:',
            input: 'number',
            inputValue: mbActuales,
            inputAttributes: { min: '1', step: '1' },
            background: '#F8F5E6',
            color: '#081C2F',
            confirmButtonColor: '#102A43',
            showCancelButton: true,
            confirmButtonText: 'Actualizar Cuota',
            cancelButtonText: 'Cancelar',
        });

        if (!nuevosMb || Number(nuevosMb) <= 0) return;

        const nuevosBytes = Math.round(Number(nuevosMb) * BYTES_POR_MB);
        this.usuariosService.cambiarCuota(usuario._id, nuevosBytes).subscribe
        ({
            next: () =>
            {
                FormatoUtil.mostrarExito('Cuota actualizada');
                this.cargarUsuarios();
                if (usuario._id === this.authService.obtenerUsuarioActual()?._id)
                {
                    this.authService.actualizarPerfil().subscribe();
                }
            },
            error: (err) => FormatoUtil.mostrarError(err),
        });
    }

    alternarEstadoUsuario(usuario: Usuario): void
    {
        const nuevoEstado = !usuario.activo;
        const accionTexto = nuevoEstado ? 'activar' : 'desactivar';

        Swal.fire
        ({
            title: `¿Deseas ${accionTexto} a ${usuario.nombreUsuario}?`,
            text: 'Sus documentos e historial de actividades se conservarán.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Sí, ${accionTexto}`,
            cancelButtonText: 'Cancelar',
        }).then((res) =>
        {
            if (res.isConfirmed)
            {
                this.usuariosService.cambiarEstado(usuario._id, nuevoEstado).subscribe
                ({
                    next: () =>
                    {
                        FormatoUtil.mostrarExito(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
                        this.cargarUsuarios();
                    },
                    error: (err) => FormatoUtil.mostrarError(err),
                });
            }
        });
    }
}