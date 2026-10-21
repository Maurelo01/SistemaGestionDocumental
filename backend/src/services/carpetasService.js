const Carpeta = require('../models/carpetas');
const Archivo = require('../models/archivos');
const { verificarAccesoRecurso } = require('./acceso');
const { registrarActividad } = require('./actividad');
const { crearError } = require('../utils/http');

const obtenerCarpetaValidada = async (carpetaId, usuarioId, nivelRequerido = 'LECTURA') =>
{
    const carpeta = await Carpeta.findOne({ _id: carpetaId, 'papelera.eliminado': false });
    if (!carpeta) throw crearError(404, 'Carpeta no encontrada o se encuentra en la papelera.');

    const acceso = await verificarAccesoRecurso(usuarioId, carpeta, 'CARPETA', nivelRequerido);
    if (!acceso.autorizado) throw crearError(403, `No tienes permiso de ${nivelRequerido} sobre esta carpeta.`);

    return { carpeta, nivelAcceso: acceso.nivel };
};

const listarRaizUsuario = async (usuarioId) =>
{
    const [carpetas, archivos] = await Promise.all([
        Carpeta.find({ propietarioId: usuarioId, carpetaPadreId: null, 'papelera.eliminado': false }).sort({ nombre: 1 }),
        Archivo.find({ propietarioId: usuarioId, carpetaId: null, 'papelera.eliminado': false }).select('-contenido').sort({ nombre: 1 }),
    ]);

    return { carpetaActual: null, rutaMigas: [], carpetas, archivos };
};

const listarContenidoSubcarpeta = async (carpetaId, usuarioId) =>
{
    const { carpeta, nivelAcceso } = await obtenerCarpetaValidada(carpetaId, usuarioId, 'LECTURA');

    const [carpetas, archivos, ancestrosDocs] = await Promise.all
    ([
        Carpeta.find({ carpetaPadreId: carpeta._id, 'papelera.eliminado': false }).sort({ nombre: 1 }),
        Archivo.find({ carpetaId: carpeta._id, 'papelera.eliminado': false }).select('-contenido').sort({ nombre: 1 }),
        Carpeta.find({ _id: { $in: carpeta.ancestros } }).select('_id nombre'),
    ]);

    const mapaAncestros = new Map(ancestrosDocs.map((doc) => [doc._id.toString(), doc]));
    const rutaMigas = carpeta.ancestros.map((id) => mapaAncestros.get(id.toString())).filter(Boolean);

    return { carpetaActual: carpeta, nivelAcceso, rutaMigas, carpetas, archivos };
};

const crearNuevaCarpeta = async (usuarioId, { nombre, carpetaPadreId = null }) =>
{
    if (!nombre || !nombre.trim()) throw crearError(400, 'El nombre de la carpeta es obligatorio.');
    
    let ancestros = [];
    let propietarioId = usuarioId;

    if (carpetaPadreId)
    {
        const { carpeta: padre } = await obtenerCarpetaValidada(carpetaPadreId, usuarioId, 'EDICION');
        ancestros = [...padre.ancestros, padre._id];
        propietarioId = padre.propietarioId;
    }

    const nuevaCarpeta = await Carpeta.create
    ({
        nombre: nombre.trim(),
        propietarioId,
        carpetaPadreId: carpetaPadreId || null,
        ancestros,
    });

    await registrarActividad
    ({
        usuarioId,
        accion: 'CREAR',
        recursoId: nuevaCarpeta._id,
        tipoRecurso: 'CARPETA',
        nombre: nuevaCarpeta.nombre,
        detalles: `Carpeta '${nuevaCarpeta.nombre}' creada`,
    });

    return nuevaCarpeta;
};

const cambiarNombreCarpeta = async (carpetaId, usuarioId, nuevoNombre) =>
{
    if (!nuevoNombre || !nuevoNombre.trim()) throw crearError(400, 'El nuevo nombre es obligatorio.');

    const { carpeta } = await obtenerCarpetaValidada(carpetaId, usuarioId, 'EDICION');
    const nombreAnterior = carpeta.nombre;
    carpeta.nombre = nuevoNombre.trim();
    await carpeta.save();

    await registrarActividad
    ({
        usuarioId,
        accion: 'RENOMBRAR',
        recursoId: carpeta._id,
        tipoRecurso: 'CARPETA',
        nombre: carpeta.nombre,
        detalles: `Carpeta renombrada de '${nombreAnterior}' a '${carpeta.nombre}'`,
    });

    return carpeta;
};

const moverCarpetaConValidacion = async (carpetaId, usuarioId, carpetaDestinoId = null) =>
{
    const { carpeta } = await obtenerCarpetaValidada(carpetaId, usuarioId, 'EDICION');

    if (carpeta.propietarioId.toString() !== usuarioId.toString()) throw crearError(403, 'Solo el propietario puede mover una carpeta.');

    let nuevosAncestros = [];

    if (carpetaDestinoId)
    {
        if (carpeta._id.toString() === carpetaDestinoId.toString()) throw crearError(409, 'No se puede mover una carpeta dentro de sí misma.');

        const destino = await Carpeta.findOne
        ({
            _id: carpetaDestinoId,
            propietarioId: usuarioId,
            'papelera.eliminado': false,
        });

        if (!destino) throw crearError(404, 'La carpeta destino no existe o no eres el propietario.');

        const creaCiclo = destino.ancestros.some((ancId) => ancId.toString() === carpeta._id.toString());
        if (creaCiclo) throw crearError(409, 'Operación inválida: no puedes mover una carpeta dentro de una de sus subcarpetas.');
        nuevosAncestros = [...destino.ancestros, destino._id];
    }

    carpeta.carpetaPadreId = carpetaDestinoId || null;
    carpeta.ancestros = nuevosAncestros;
    await carpeta.save();

    const descendientes = await Carpeta.find({ ancestros: carpeta._id });
    for (const sub of descendientes)
    {
        const idx = sub.ancestros.findIndex((id) => id.toString() === carpeta._id.toString());
        sub.ancestros = [...nuevosAncestros, ...sub.ancestros.slice(idx)];
        await sub.save();
    }

    await registrarActividad
    ({
        usuarioId,
        accion: 'MOVER',
        recursoId: carpeta._id,
        tipoRecurso: 'CARPETA',
        nombre: carpeta.nombre,
        detalles: 'Carpeta movida manteniendo consistencia jerárquica',
    });

    return carpeta;
};

module.exports =
{
    obtenerCarpetaValidada,
    listarRaizUsuario,
    listarContenidoSubcarpeta,
    crearNuevaCarpeta,
    cambiarNombreCarpeta,
    moverCarpetaConValidacion,
};