const Carpeta = require('../models/carpetas');
const Archivo = require('../models/archivos');
const Permiso = require('../models/permisos');
const Usuario = require('../models/usuarios');
const { registrarActividad } = require('./actividad');
const { crearError } = require('../utils/http');

const obtenerElementosEnPapelera = async (usuarioId) =>
{
    const [carpetas, archivos] = await Promise.all
    ([
        Carpeta.find({ propietarioId: usuarioId, 'papelera.eliminado': true }).sort({ 'papelera.fechaEliminacion': -1 }),
        Archivo.find({ propietarioId: usuarioId, 'papelera.eliminado': true }).select('-contenido').sort({ 'papelera.fechaEliminacion': -1 }),
    ]);

    return { carpetas, archivos };
};

const moverAPapelera = async (usuarioId, tipoRecurso, id) =>
{
    const datosPapelera =
    {
        eliminado: true,
        fechaEliminacion: new Date(),
        eliminadoPor: usuarioId,
    };

    if (tipoRecurso === 'ARCHIVO')
    {
        const archivo = await Archivo.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': false });
        if (!archivo) throw crearError(404, 'Archivo no encontrado o ya está en la papelera.');

        archivo.papelera = datosPapelera;
        await archivo.save();

        await registrarActividad
        ({
            usuarioId,
            accion: 'PAPELERA',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            nombre: archivo.nombre,
            extension: archivo.extension,
            detalles: 'Archivo enviado a la papelera',
        });

        return archivo;
    }

    if (tipoRecurso === 'CARPETA')
    {
        const carpeta = await Carpeta.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': false });
        if (!carpeta) throw crearError(404, 'Carpeta no encontrada o ya está en la papelera.');

        const subcarpetas = await Carpeta.find({ ancestros: carpeta._id }).select('_id');
        const idsCarpetasAfectadas = [carpeta._id, ...subcarpetas.map((c) => c._id)];

        await Promise.all
        ([
            Carpeta.updateMany({ _id: { $in: idsCarpetasAfectadas } }, {$set: { papelera: datosPapelera } }),
            Archivo.updateMany({ carpetaId: { $in: idsCarpetasAfectadas } }, {$set: { papelera: datosPapelera } }),
        ]);

        await registrarActividad
        ({
            usuarioId,
            accion: 'PAPELERA',
            recursoId: carpeta._id,
            tipoRecurso: 'CARPETA',
            nombre: carpeta.nombre,
            detalles: 'Carpeta y su contenido enviados a la papelera',
        });

        return carpeta;
    }

    throw crearError(400, 'Tipo de recurso inválido. Use ARCHIVO o CARPETA.');
};

const restaurarDePapelera = async (usuarioId, tipoRecurso, id) => {
    const papeleraLimpia = { eliminado: false, fechaEliminacion: null, eliminadoPor: null };

    if (tipoRecurso === 'ARCHIVO')
    {
        const archivo = await Archivo.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': true });
        if (!archivo) throw crearError(404, 'Archivo no encontrado en la papelera.');
        if (archivo.carpetaId)
        {
            const carpetaPadre = await Carpeta.findOne({ _id: archivo.carpetaId, 'papelera.eliminado': false });
            if (!carpetaPadre) archivo.carpetaId = null;
        }

        archivo.papelera = papeleraLimpia;
        await archivo.save();

        await registrarActividad
        ({
            usuarioId,
            accion: 'RESTAURAR',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            nombre: archivo.nombre,
            extension: archivo.extension,
            detalles: 'Archivo restaurado desde la papelera',
        });

        return archivo;
    }

    if (tipoRecurso === 'CARPETA')
    {
        const carpeta = await Carpeta.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': true });
        if (!carpeta) throw crearError(404, 'Carpeta no encontrada en la papelera.');

        if (carpeta.carpetaPadreId)
        {
            const padreActivo = await Carpeta.findOne({ _id: carpeta.carpetaPadreId, 'papelera.eliminado': false });
            if (!padreActivo)
            {
                carpeta.carpetaPadreId = null;
                carpeta.ancestros = [];
            }
        }

        carpeta.papelera = papeleraLimpia;
        await carpeta.save();

        const subcarpetas = await Carpeta.find({ ancestros: carpeta._id }).select('_id');
        const idsCarpetas = [carpeta._id, ...subcarpetas.map((c) => c._id)];

        await Promise.all
        ([
            Carpeta.updateMany({ _id: { $in: idsCarpetas } }, {$set: { papelera: papeleraLimpia } }),
            Archivo.updateMany({ carpetaId: { $in: idsCarpetas } }, {$set: { papelera: papeleraLimpia } }),
        ]);

        await registrarActividad
        ({
            usuarioId,
            accion: 'RESTAURAR',
            recursoId: carpeta._id,
            tipoRecurso: 'CARPETA',
            nombre: carpeta.nombre,
            detalles: 'Carpeta y su contenido restaurados desde la papelera',
        });

        return carpeta;
    }

    throw crearError(400, 'Tipo de recurso inválido. Usa ARCHIVO o CARPETA.');
};

const eliminarPermanentemente = async (usuarioId, tipoRecurso, id) => {
    if (tipoRecurso === 'ARCHIVO') {
        const archivo = await Archivo.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': true });
        if (!archivo) throw crearError(404, 'El archivo debe estar en la papelera antes de eliminarse definitivamente.');

        await Promise.all
        ([
            Archivo.deleteOne({ _id: archivo._id }),
            Permiso.deleteMany({ recursoId: archivo._id, tipoRecurso: 'ARCHIVO' }),
            Usuario.updateOne({ _id: usuarioId }, {$inc: {'almacenamiento.bytesUsados': -archivo.tamanoBytes, 'almacenamiento.cantidadArchivos': -1,},}),
        ]);

        await registrarActividad
        ({
            usuarioId,
            accion: 'ELIMINAR_DEFINITIVO',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            nombre: archivo.nombre,
            extension: archivo.extension,
            detalles: `Eliminación definitiva (${archivo.tamanoBytes} bytes liberados)`,
        });

        return;
    }

    if (tipoRecurso === 'CARPETA')
    {
        const carpeta = await Carpeta.findOne({ _id: id, propietarioId: usuarioId, 'papelera.eliminado': true });
        if (!carpeta) throw crearError(404, 'La carpeta debe estar en la papelera antes de eliminarse definitivamente.');

        const subcarpetas = await Carpeta.find({ ancestros: carpeta._id }).select('_id');
        const idsCarpetas = [carpeta._id, ...subcarpetas.map((c) => c._id)];

        const archivosDentro = await Archivo.find({ carpetaId: { $in: idsCarpetas } }).select('_id tamanoBytes');
        const idsArchivos = archivosDentro.map((a) => a._id);
        const totalBytesLiberados = archivosDentro.reduce((acc, a) => acc + a.tamanoBytes, 0);

        await Promise.all
        ([
            Archivo.deleteMany({ _id: { $in: idsArchivos } }),
            Carpeta.deleteMany({ _id: { $in: idsCarpetas } }),
            Permiso.deleteMany({ recursoId: { $in: [...idsCarpetas, ...idsArchivos] } }),
            Usuario.updateOne({ _id: usuarioId },{$inc: {'almacenamiento.bytesUsados': -totalBytesLiberados, 'almacenamiento.cantidadArchivos': -archivosDentro.length,},}),
        ]);

        await registrarActividad
        ({
            usuarioId,
            accion: 'ELIMINAR_DEFINITIVO',
            recursoId: carpeta._id,
            tipoRecurso: 'CARPETA',
            nombre: carpeta.nombre,
            detalles: `Carpeta eliminada definitivamente (${archivosDentro.length} archivos y ${totalBytesLiberados} bytes liberados)`,
        });

        return;
    }

    throw crearError(400, 'Tipo de recurso inválido. Usa ARCHIVO o CARPETA.');
};

module.exports =
{
    obtenerElementosEnPapelera,
    moverAPapelera,
    restaurarDePapelera,
    eliminarPermanentemente,
};