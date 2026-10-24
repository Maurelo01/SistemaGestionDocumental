import Swal from 'sweetalert2';
import { Carpeta, NivelAcceso } from '../models/documentos';
import { Usuario } from '../models/usuarios';

export class FormatoUtil
{
    static formatearBytes(bytes: number = 0): string 
    {
        if (!bytes || bytes <= 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    static dispararDescargaNavegador(blob: Blob, nombreCompleto: string): void
    {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreCompleto;
        enlace.click();
        window.URL.revokeObjectURL(url);
    }

    static mostrarError(error: any, mensajePorDefecto = 'No se pudo completar la operación.'): void
    {
        Swal.fire('Error', error?.error?.mensaje || mensajePorDefecto, 'error');
    }

    static mostrarExito(titulo: string, texto = ''): void
    {
        Swal.fire
        ({
            title: titulo,
            text: texto,
            icon: 'success',
            timer: 1300,
            showConfirmButton: false,
        });
    }

    static async pedirNuevoNombre(tipo: string, nombreActual: string): Promise<string | null>
    {
        const { value } = await Swal.fire
        ({
            title: `Renombrar ${tipo}`,
            input: 'text',
            inputValue: nombreActual,
            showCancelButton: true,
            confirmButtonColor: '#102A43',
            confirmButtonText: 'Guardar',
        });
        return value?.trim() && value.trim() !== nombreActual ? value.trim() : null;
    }

    static async pedirDatosCompartir
    (
        nombre: string,
        usuarios: Usuario[]
    ): Promise<{ compartidoConId: string; nivelAcceso: NivelAcceso } | null>
    {
        const renderizarOpciones = (lista: Usuario[]) =>
        lista.length
            ? lista.map((u) => `<option value="${u._id}"> ${u.nombreUsuario} — ${u.correo}</option>`).join('')
            : `<option value="" disabled>Sin coincidencias</option>`;

        const { value } = await Swal.fire
        ({
            title: `Compartir "${nombre}"`,
            background: '#F8F5E6',
            color: '#081C2F',
            confirmButtonColor: '#102A43',
            cancelButtonColor: '#6c757d',
            showCancelButton: true,
            confirmButtonText: 'Dar Permiso',
            cancelButtonText: 'Cancelar',
            html: `
                <div class="text-start mt-2">
                <label class="form-label small fw-bold" style="color: #243B53;">1. Buscar usuario</label>
                <input id="swal-buscar-user" type="text" class="form-control form-control-sm mb-2" placeholder="Escribe nombre o correo...">
                
                <label class="form-label small fw-bold" style="color: #243B53;">2. Seleccionar destinatario</label>
                <select id="swal-user" class="form-select form-select-sm mb-3" size="4">
                    ${renderizarOpciones(usuarios)}
                </select>

                <label class="form-label small fw-bold" style="color: #243B53;">3. Nivel de acceso</label>
                <select id="swal-nivel" class="form-select form-select-sm">
                    <option value="LECTURA">LECTURA (Solo consultar y descargar)</option>
                    <option value="COMENTAR">COMENTAR (Consultar y agregar comentarios)</option>
                    <option value="EDICION">EDICIÓN (Modificar contenido y renombrar)</option>
                </select>
                </div>
            `,
            didOpen: () =>
            {
                const inputBuscar = document.getElementById('swal-buscar-user') as HTMLInputElement;
                const selectUser = document.getElementById('swal-user') as HTMLSelectElement;
                if (selectUser.options.length > 0) selectUser.selectedIndex = 0;

                inputBuscar.addEventListener('input', () =>
                {
                    const termino = inputBuscar.value.toLowerCase().trim();
                    const filtrados = usuarios.filter
                    (
                        (u) => u.nombreUsuario.toLowerCase().includes(termino) || u.correo.toLowerCase().includes(termino)
                    );
                    selectUser.innerHTML = renderizarOpciones(filtrados);
                    if (selectUser.options.length > 0 && filtrados.length > 0) selectUser.selectedIndex = 0;
                });
            },
            preConfirm: () =>
            {
                const compartidoConId = (document.getElementById('swal-user') as HTMLSelectElement).value;
                const nivelAcceso = (document.getElementById('swal-nivel') as HTMLSelectElement).value as NivelAcceso;
                if (!compartidoConId)
                {
                    Swal.showValidationMessage('Debes seleccionar un usuario válido.');
                    return null;
                }
                return { compartidoConId, nivelAcceso };
            },
        });

        return value?.compartidoConId ? value : null;
    }
}