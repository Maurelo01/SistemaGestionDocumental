const Permiso = require('../models/permisos');
const Archivo = require('../models/archivos');
const Carpeta = require('../models/carpetas');
const Usuario = require('../models/usuarios');
const { registrarActividad } = require('./actividad');
const { crearError } = require('../utils/http');

const buscarRecursoActivo = async (recursoId, tipoRecurso) =>
{
    if (tipoRecurso === 'ARCHIVO') return await Archivo.findOne({ _id: recursoId, 'papelera.eliminado': false }).select('-contenido');
    if (tipoRecurso === 'CARPETA') return await Carpeta.findOne({ _id: recursoId, 'papelera.eliminado': false });
    throw crearError(400, 'El tipo de recurso debe ser ARCHIVO o CARPETA.');
};

const otorgarOActualizarPermiso = async (propietarioId, { recursoId, tipoRecurso, compartidoConId, nivelAcceso }) => {
    if (!['LECTURA', 'EDICION', 'COMENTAR'].includes(nivelAcceso)) throw crearError(400, 'El nivel de acceso debe ser LECTURA, EDICION o COMENTAR.');

    if (propietarioId.toString() === compartidoConId.toString()) throw crearError(400, 'No puedes compartir un recurso a ti mismo.');

    const receptor = await Usuario.findOne({ _id: compartidoConId, activo: true });
    if (!receptor) throw crearError(404, 'El usuario destinatario no existe o está inactivo.');

    const recurso = await buscarRecursoActivo(recursoId, tipoRecurso);
    if (!recurso) throw crearError(404, 'El recurso no existe o se encuentra en la papelera.');

    if (recurso.propietarioId.toString() !== propietarioId.toString()) throw crearError(403, 'Solo el propietario del recurso puede compartirlo.');

    const permiso = await Permiso.findOneAndUpdate
    (
        { recursoId, compartidoConId },
        {
            $set:
            {
                tipoRecurso,
                propietarioId,
                nivelAcceso,
            },
        },
        { new: true, upsert: true }
    );

    await registrarActividad
    ({
        usuarioId: propietarioId,
        accion: 'COMPARTIR',
        recursoId: recurso._id,
        tipoRecurso,
        nombre: recurso.nombre,
        extension: recurso.extension || null,
        detalles: `Compartido con ${receptor.nombreUsuario} (${nivelAcceso})`,
    });

    return permiso;
};

const revocarAcceso = async (permisoId, propietarioId) =>
{
    const permiso = await Permiso.findById(permisoId);
    if (!permiso) throw crearError(404, 'Permiso no encontrado.');

    if (permiso.propietarioId.toString() !== propietarioId.toString()) throw crearError(403, 'Solo el propietario puede retirar permisos.');

    const recurso = await buscarRecursoActivo(permiso.recursoId, permiso.tipoRecurso);
    await Permiso.deleteOne({ _id: permisoId });

    await registrarActividad
    ({
        usuarioId: propietarioId,
        accion: 'REVOCAR_PERMISO',
        recursoId: permiso.recursoId,
        tipoRecurso: permiso.tipoRecurso,
        nombre: recurso ? recurso.nombre : 'Recurso',
        extension: recurso ? recurso.extension : null,
        detalles: 'Permiso de acceso revocado',
    });
};

const poblarDetallesPermisos = async (listaPermisos) =>
{
    const resultados = [];
    for (const perm of listaPermisos)
    {
        const recurso = await buscarRecursoActivo(perm.recursoId, perm.tipoRecurso);
        if (recurso)
        {
            resultados.push
            ({
                ...perm.toObject(),
                recurso,
            });
        }
    }
    return resultados;
};

const listarCompartidosConUsuario = async (usuarioId) =>
    {
    const permisos = await Permiso.find({ compartidoConId: usuarioId }).populate('propietarioId', 'nombreUsuario correo').sort({ fechaCreacion: -1 });
    return await poblarDetallesPermisos(permisos);
};

const listarCompartidosPorPropietario = async (propietarioId) =>
{
    const permisos = await Permiso.find({ propietarioId }).populate('compartidoConId', 'nombreUsuario correo').sort({ fechaCreacion: -1 });
    return await poblarDetallesPermisos(permisos);
};

module.exports =
{
    otorgarOActualizarPermiso,
    revocarAcceso,
    listarCompartidosConUsuario,
    listarCompartidosPorPropietario,
};