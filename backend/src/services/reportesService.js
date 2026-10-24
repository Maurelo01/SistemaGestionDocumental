const mongoose = require('mongoose');
const Archivo = require('../models/archivos');
const Usuario = require('../models/usuarios');
const Permiso = require('../models/permisos');
const Actividad = require('../models/reportes');
const { crearError } = require('../utils/http');


const convertirObjectId = (id, nombreCampo = 'ID') =>
{
    if (!id || !mongoose.Types.ObjectId.isValid(id)) throw crearError(400, `El ${nombreCampo} proporcionado no es válido.`);
    return new mongoose.Types.ObjectId(id);
};

const construirFiltroFechas = (fechaInicio, fechaFin) =>
{
    if (!fechaInicio && !fechaFin) return null;
    const rango = {};
    if (fechaInicio) rango.$gte = new Date(fechaInicio);
    if (fechaFin)
    {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        rango.$lte = fin;
    }
    return rango;
};

const unirColeccion = (from, localField, as, preservarNulos = true) =>
[
    { $lookup: { from, localField, foreignField: '_id', as } },
    { $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: preservarNulos } },
];

const consultarPermisosPorRol = async (campoFiltro, usuarioId, campoRelacion, aliasUsuario, aliasCorreo) =>
{
    const idObj = convertirObjectId(usuarioId, 'ID de usuario');
    return await Permiso.aggregate
    ([
        { $match: { [campoFiltro]: idObj } },
        ...unirColeccion('usuarios', campoRelacion, 'usuarioRel'),
        { $lookup: { from: 'archivos', localField: 'recursoId', foreignField: '_id', as: 'archivo' } },
        { $lookup: { from: 'carpetas', localField: 'recursoId', foreignField: '_id', as: 'carpeta' } },
        {
            $project:
            {
                _id: 1,
                recursoId: 1,
                tipoRecurso: 1,
                nivelAcceso: 1,
                fechaCreacion: 1,
                [aliasUsuario]: '$usuarioRel.nombreUsuario',
                [aliasCorreo]: '$usuarioRel.correo',
                nombreRecurso:
                {
                    $ifNull:
                    [
                        { $arrayElemAt: ['$archivo.nombre', 0] },
                        { $arrayElemAt: ['$carpeta.nombre', 0] },
                    ],
                },
                extension: { $arrayElemAt: ['$archivo.extension', 0] }, }, }, {$sort: { fechaCreacion: -1 } },
    ]);
};

// REPORTES ARCHIVOS Y ALMACENAMIENTO 

const obtenerArchivosPorTipo = async () =>
{
    return await Archivo.aggregate
    ([
        { $match: { 'papelera.eliminado': false } },
        { $group: { _id: '$extension', cantidad: {$sum: 1 }, tamanoTotalBytes: { $sum: '$tamanoBytes' } } },
        { $project: { _id: 0, tipo: '$_id', cantidad: 1, tamanoTotalBytes: 1 } }, {$sort: { cantidad: -1 } },
    ]);
};

const obtenerArchivosPorRangoFechas = async ({ fechaInicio, fechaFin }) =>
{
    const filtroMatch = { 'papelera.eliminado': false };
    const rangoFechas = construirFiltroFechas(fechaInicio, fechaFin);
    if (rangoFechas) filtroMatch.fechaCreacion = rangoFechas;

    return await Archivo.aggregate
    ([
        { $match: filtroMatch },
        ...unirColeccion('usuarios', 'propietarioId', 'propietario'),
        ...unirColeccion('carpetas', 'carpetaId', 'carpeta'),
        {
            $project:
            {
                _id: 1,
                nombre: 1,
                extension: 1,
                tamanoBytes: 1,
                fechaCreacion: 1,
                propietario: '$propietario.nombreUsuario',
                carpeta: { $ifNull: ['$carpeta.nombre', 'Raíz'] },
            },
        },
        { $sort: { fechaCreacion: -1 } },
    ]);
};

const obtenerArchivosConMasOperaciones = async (limite = 10) =>
{
    return await Actividad.aggregate
    ([
        { $match: { tipoRecurso: 'ARCHIVO' } },
        {
            $group:
            {
                _id: '$recursoId',
                nombre: { $last: '$datosRecurso.nombre' },
                extension: { $last: '$datosRecurso.extension' },
                cantidadOperaciones: { $sum: 1 },
                ultimaOperacion: { $max: '$fechaCreacion' },
            },
        },
        { $project: { _id: 0, archivoId: '$_id', nombre: 1, extension: 1, cantidadOperaciones: 1, ultimaOperacion: 1 } },
        { $sort: { cantidadOperaciones: -1 } }, {$limit: Number(limite) || 10 },
    ]);
};

const obtenerArchivosNuncaCompartidos = async () =>
{
    return await Archivo.aggregate([
        { $match: { 'papelera.eliminado': false } },
        {
            $lookup:
            {
                from: 'permisos',
                let: { idArchivo: '$_id' },
                pipeline:
                [
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                [
                                    { $eq: ['$recursoId', '$$idArchivo'] },
                                    { $eq: ['$tipoRecurso', 'ARCHIVO'] },
                                ],
                            },
                        },
                    },
                ],
                as: 'permisosAsociados',
            },
        },
        { $match: { 'permisosAsociados.0': { $exists: false } } },
        ...unirColeccion('usuarios', 'propietarioId', 'propietario'),
        ...unirColeccion('carpetas', 'carpetaId', 'carpeta'),
        {
            $project:
            {
                _id: 1,
                nombre: 1,
                extension: 1,
                tamanoBytes: 1,
                fechaCreacion: 1,
                propietario: '$propietario.nombreUsuario',
                carpeta: { $ifNull: ['$carpeta.nombre', 'Raíz'] },
            },
        },
        { $sort: { fechaCreacion: -1 } },
    ]);
};

const obtenerCarpetasConMasArchivos = async (limite = 10) =>
{
    return await Archivo.aggregate([
        { $match: { 'papelera.eliminado': false, carpetaId: { $ne: null } } },
        {
            $group:
            {
                _id: '$carpetaId',
                cantidadArchivos: { $sum: 1 },
                tamanoTotalBytes: { $sum: '$tamanoBytes' },
            },
        },
        ...unirColeccion('carpetas', '_id', 'carpeta', false),
        { $match: { 'carpeta.papelera.eliminado': false } },
        ...unirColeccion('usuarios', 'carpeta.propietarioId', 'propietario'),
        {
            $project:
            {
                _id: 0,
                carpetaId: '$_id',
                nombreCarpeta: '$carpeta.nombre',
                propietario: '$propietario.nombreUsuario',
                cantidadArchivos: 1,
                tamanoTotalBytes: 1,
            },
        },
        { $sort: { cantidadArchivos: -1, tamanoTotalBytes: -1 } },
        { $limit: Number(limite) || 10 },
    ]);
};

// REPORTES USUARIOS

const obtenerTopUsuariosArchivos = async (limite = 10) =>
{
    return await Usuario.aggregate([
        {
            $project:
            {
                _id: 1,
                nombreUsuario: 1,
                correo: 1,
                rol: 1,
                activo: 1,
                cantidadArchivos: '$almacenamiento.cantidadArchivos',
                bytesUsados: '$almacenamiento.bytesUsados',
            },
        },
        { $sort: { cantidadArchivos: -1, bytesUsados: -1 } }, {$limit: Number(limite) || 10 },
    ]);
};

const obtenerUsuariosConMasCompartidos = async (limite = 10) =>
{
    return await Permiso.aggregate
    ([
        {
            $group:
            {
                _id: '$propietarioId',
                totalCompartidos: { $sum: 1 },
                archivosCompartidos: { $sum: {$cond: [{ $eq: ['$tipoRecurso', 'ARCHIVO'] }, 1, 0] } },
                carpetasCompartidas: { $sum: {$cond: [{ $eq: ['$tipoRecurso', 'CARPETA'] }, 1, 0] } },
            },
        },
        ...unirColeccion('usuarios', '_id', 'usuario', false),
        {
            $project:
            {
                _id: 0,
                usuarioId: '$_id',
                nombreUsuario: '$usuario.nombreUsuario',
                correo: '$usuario.correo',
                totalCompartidos: 1,
                archivosCompartidos: 1,
                carpetasCompartidas: 1,
            },
        },
        { $sort: { totalCompartidos: -1 } }, {$limit: Number(limite) || 10 },
    ]);
};

// REPORTES DE COMPARTICION

const obtenerArchivosMasCompartidos = async (limite = 10) =>
{
    return await Permiso.aggregate
    ([
        { $match: { tipoRecurso: 'ARCHIVO' } },
        { $group: { _id: '$recursoId', cantidadUsuarios: {$sum: 1 }, nivelesOtorgados: { $addToSet: '$nivelAcceso' } } },
        ...unirColeccion('archivos', '_id', 'archivo', false),
        ...unirColeccion('usuarios', 'archivo.propietarioId', 'propietario'),
        {
            $project:
            {
                _id: 0,
                archivoId: '$_id',
                nombre: '$archivo.nombre',
                extension: '$archivo.extension',
                propietario: '$propietario.nombreUsuario',
                cantidadUsuarios: 1,
                nivelesOtorgados: 1,
            },
        },
        { $sort: { cantidadUsuarios: -1 } }, {$limit: Number(limite) || 10 },
    ]);
};

const obtenerRecursosCompartidosPorUsuario = (usuarioId) =>
    consultarPermisosPorRol('propietarioId', usuarioId, 'compartidoConId', 'compartidoCon', 'correoDestinatario');

const obtenerRecursosRecibidosPorUsuario = (usuarioId) =>
    consultarPermisosPorRol('compartidoConId', usuarioId, 'propietarioId', 'propietario', 'correoPropietario');

// REPORTES DE ACTIVIDAD 

const obtenerHistorialUsuario = async (usuarioId, { fechaInicio, fechaFin }) =>
{
    const filtroMatch = { usuarioId: convertirObjectId(usuarioId, 'ID de usuario') };
    const rangoFechas = construirFiltroFechas(fechaInicio, fechaFin);
    if (rangoFechas) filtroMatch.fechaCreacion = rangoFechas;

    return await Actividad.aggregate
    ([
        { $match: filtroMatch },
        ...unirColeccion('usuarios', 'usuarioId', 'usuario'),
        {
            $project:
            {
                _id: 1,
                accion: 1,
                tipoRecurso: 1,
                recursoId: 1,
                datosRecurso: 1,
                detalles: 1,
                fechaCreacion: 1,
                nombreUsuario: '$usuario.nombreUsuario',
            },
        },
        { $sort: { fechaCreacion: -1 } },
    ]);
};

const obtenerOperacionesPorTipo = async () =>
{
    return await Actividad.aggregate([{ $group: { _id: '$accion', cantidad: { $sum: 1 } } }, {$project: { _id: 0, accion: '$_id', cantidad: 1 } }, {$sort: { cantidad: -1 } },]);
};

const obtenerOperacionesPorPeriodo = async (periodo = 'dia') =>
{
    const formato = periodo === 'mes' ? '%Y-%m' : '%Y-%m-%d';
    return await Actividad.aggregate([{ $group: { _id: { $dateToString: { format: formato, date: '$fechaCreacion' } }, cantidad: { $sum: 1 } } }, {$project: { _id: 0, periodo: '$_id', cantidad: 1 } }, {$sort: { periodo: 1 } },]);
};

const obtenerPrincipalesAcciones = async (limite = 10) =>
{
    const total = await Actividad.countDocuments();
    return await Actividad.aggregate([
        {
            $group:
            {
                _id: { accion: '$accion', tipoRecurso: '$tipoRecurso' },
                cantidad: { $sum: 1 },
                ultimaEjecucion: { $max: '$fechaCreacion' },
            },
        },
        {
            $project:
            {
                _id: 0,
                accion: '$_id.accion',
                tipoRecurso: '$_id.tipoRecurso',
                cantidad: 1,
                ultimaEjecucion: 1,
                porcentaje:
                {
                    $cond: [{$eq: [total, 0] }, 0, { $round: [{$multiply: [{ $divide: ['$cantidad', total] }, 100] }, 2] }],
                },
            },
        },
        { $sort: { cantidad: -1 } }, {$limit: Number(limite) || 10 },
    ]);
};

module.exports =
{
    obtenerArchivosPorTipo,
    obtenerArchivosPorRangoFechas,
    obtenerArchivosConMasOperaciones,
    obtenerTopUsuariosArchivos,
    obtenerUsuariosConMasCompartidos,
    obtenerArchivosMasCompartidos,
    obtenerRecursosCompartidosPorUsuario,
    obtenerRecursosRecibidosPorUsuario,
    obtenerHistorialUsuario,
    obtenerOperacionesPorTipo,
    obtenerOperacionesPorPeriodo,
    obtenerPrincipalesAcciones,
    obtenerArchivosNuncaCompartidos,
    obtenerCarpetasConMasArchivos,
};