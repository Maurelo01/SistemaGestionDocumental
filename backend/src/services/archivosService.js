const path = require('path');
const Archivo = require('../models/archivos');
const Carpeta = require('../models/carpetas');
const Usuario = require('../models/usuarios');
const { verificarAccesoRecurso } = require('./acceso');
const { registrarActividad } = require('./actividad');
const { crearError } = require('../utils/http');

const obtenerArchivoValidado = async (archivoId, usuarioId, nivelRequerido = 'LECTURA', poblarPropietario = false) =>
{
    let consulta = Archivo.findOne({ _id: archivoId, 'papelera.eliminado': false });
    if (poblarPropietario)
    {
        consulta = consulta.populate('propietarioId', 'nombreUsuario correo');
    }

    const archivo = await consulta;
    if (!archivo)
    {
        throw crearError(404, 'Archivo no encontrado.');
    }

    const idPropietario = archivo.propietarioId._id || archivo.propietarioId;
    const acceso = await verificarAccesoRecurso
    (
        usuarioId,
        { _id: archivo._id, propietarioId: idPropietario, carpetaId: archivo.carpetaId },
        'ARCHIVO',
        nivelRequerido
    );

    if (!acceso.autorizado) throw crearError(403, `No tienes permiso de ${nivelRequerido} en este archivo.`);

    return { archivo, nivelAcceso: acceso.nivel };
};

const listarYFiltrarArchivos = async (usuarioId, { buscar, extension, carpetaId, ordenarPor = 'fechaCreacion', orden = 'desc' }) =>
{
    const filtro = { propietarioId: usuarioId, 'papelera.eliminado': false };

    if (extension && ['.txt', '.md'].includes(extension)) filtro.extension = extension;
    if (carpetaId) filtro.carpetaId = carpetaId === 'raiz' ? null : carpetaId;
    if (buscar)
    {
        filtro.$or =
        [
            { nombre: { $regex: buscar,$options: 'i' } },
            { contenido: { $regex: buscar,$options: 'i' } },
        ];
    }

    return await Archivo.find(filtro).select('-contenido').sort({ [ordenarPor]: orden === 'asc' ? 1 : -1 });
};

const guardarNuevoArchivo = async (usuario, body, archivoFisico) =>
{
    let { nombre, extension, contenido = '', carpetaId = null } = body;

    if (archivoFisico)
    {
        const extOriginal = path.extname(archivoFisico.originalname).toLowerCase();
        nombre = nombre || path.basename(archivoFisico.originalname, extOriginal);
        extension = extOriginal;
        contenido = archivoFisico.buffer.toString('utf-8');
    }

    if (!nombre || !extension) throw crearError(400, 'El nombre y la extensión .txt o .md son obligatorios.');

    extension = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
    if (!['.txt', '.md'].includes(extension)) throw crearError(400, 'Solo se permiten archivos con formato .txt y .md.');

    let propietarioArchivoId = usuario._id;

    if (carpetaId && carpetaId !== 'null')
    {
        const carpetaDestino = await Carpeta.findOne({ _id: carpetaId, 'papelera.eliminado': false });
        if (!carpetaDestino) throw crearError(404, 'La carpeta destino no existe.');
        const acceso = await verificarAccesoRecurso(usuario._id, carpetaDestino, 'CARPETA', 'EDICION');
        if (!acceso.autorizado) throw crearError(403, 'No tienes permiso para guardar archivos en esta carpeta.');

        propietarioArchivoId = carpetaDestino.propietarioId;
    }
    else carpetaId = null;

    const tamanoBytes = Buffer.byteLength(contenido, 'utf8');
    const nuevoArchivo = await Archivo.create
    ({
        nombre: nombre.trim(),
        extension,
        contenido,
        tamanoBytes,
        propietarioId: propietarioArchivoId,
        carpetaId,
    });

    await Usuario.updateOne
    (
        { _id: propietarioArchivoId },
        { $inc: { 'almacenamiento.bytesUsados': tamanoBytes, 'almacenamiento.cantidadArchivos': 1 } }
    );

    await registrarActividad
    ({
        usuarioId: usuario._id,
        accion: 'CREAR',
        recursoId: nuevoArchivo._id,
        tipoRecurso: 'ARCHIVO',
        nombre: nuevoArchivo.nombre,
        extension: nuevoArchivo.extension,
        detalles: `Archivo '${nuevoArchivo.nombre}${nuevoArchivo.extension}' almacenado (${tamanoBytes} bytes)`,
    });

    return nuevoArchivo;
};

const actualizarContenido = async (archivoId, usuarioId, contenido) =>
{
    if (typeof contenido !== 'string') throw crearError(400, 'El campo contenido es obligatorio.');

    const { archivo } = await obtenerArchivoValidado(archivoId, usuarioId, 'EDICION');
    const nuevoTamano = Buffer.byteLength(contenido, 'utf8');
    const diferenciaBytes = nuevoTamano - archivo.tamanoBytes;

    archivo.contenido = contenido;
    archivo.tamanoBytes = nuevoTamano;
    await archivo.save();

    if (diferenciaBytes !== 0)
    {
        await Usuario.updateOne
        (
            { _id: archivo.propietarioId },
            { $inc: { 'almacenamiento.bytesUsados': diferenciaBytes } }
        );
    }

    await registrarActividad
    ({
        usuarioId,
        accion: 'EDITAR',
        recursoId: archivo._id,
        tipoRecurso: 'ARCHIVO',
        nombre: archivo.nombre,
        extension: archivo.extension,
        detalles: `Contenido actualizado (${nuevoTamano} bytes)`,
    });

    return archivo;
};

const cambiarNombreArchivo = async (archivoId, usuarioId, nuevoNombre) =>
{
    if (!nuevoNombre || !nuevoNombre.trim()) throw crearError(400, 'El nombre es obligatorio.');

    const { archivo } = await obtenerArchivoValidado(archivoId, usuarioId, 'EDICION');
    const nombreAnterior = archivo.nombre;
    archivo.nombre = nuevoNombre.trim();
    await archivo.save();

    await registrarActividad
    ({
        usuarioId,
        accion: 'RENOMBRAR',
        recursoId: archivo._id,
        tipoRecurso: 'ARCHIVO',
        nombre: archivo.nombre,
        extension: archivo.extension,
        detalles: `Renombrado de '${nombreAnterior}' a '${archivo.nombre}'`,
    });
    return archivo;
};

const cambiarUbicacionArchivo = async (archivoId, usuarioId, carpetaDestinoId = null) =>
{
    const { archivo } = await obtenerArchivoValidado(archivoId, usuarioId, 'EDICION');

    if (archivo.propietarioId.toString() !== usuarioId.toString()) throw crearError(403, 'Solo el propietario puede mover el archivo de carpeta.');

    if (carpetaDestinoId)
    {
        const carpetaDestino = await Carpeta.findOne
        ({
            _id: carpetaDestinoId,
            propietarioId: usuarioId,
            'papelera.eliminado': false,
        });
        if (!carpetaDestino) throw crearError(404, 'La carpeta destino no existe.');
    }

    archivo.carpetaId = carpetaDestinoId || null;
    await archivo.save();

    await registrarActividad
    ({
        usuarioId,
        accion: 'MOVER',
        recursoId: archivo._id,
        tipoRecurso: 'ARCHIVO',
        nombre: archivo.nombre,
        extension: archivo.extension,
        detalles: 'Archivo movido de ubicación',
    });

    return archivo;
};

const insertarComentario = async (archivoId, usuario, texto) =>
{
    if (!texto || !texto.trim()) throw crearError(400, 'El comentario no puede estar vacío.');

    const { archivo } = await obtenerArchivoValidado(archivoId, usuario._id, 'COMENTAR');

    archivo.comentarios.push
    ({
        usuarioId: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        texto: texto.trim(),
        fechaCreacion: new Date(),
    });
    await archivo.save();

    await registrarActividad
    ({
        usuarioId: usuario._id,
        accion: 'COMENTAR',
        recursoId: archivo._id,
        tipoRecurso: 'ARCHIVO',
        nombre: archivo.nombre,
        extension: archivo.extension,
        detalles: `Comentario agregado por ${usuario.nombreUsuario}`,
    });

    return archivo.comentarios;
};

module.exports = 
{
    obtenerArchivoValidado,
    listarYFiltrarArchivos,
    guardarNuevoArchivo,
    actualizarContenido,
    cambiarNombreArchivo,
    cambiarUbicacionArchivo,
    insertarComentario,
};