const Actividad = require('../models/reportes');

const registrarActividad = async ({
    usuarioId,
    accion,
    recursoId,
    tipoRecurso,
    nombre,
    extension = null,
    detalles = '',
}) =>
{
    try
    {
        await Actividad.create
        ({
            usuarioId,
            accion,
            recursoId,
            tipoRecurso,
            datosRecurso:
            {
                nombre,
                extension,
            },
            detalles,
        });
    }
    catch (error)
    {
        console.error('Auditoría: Error al registrar actividad:', error.message);
    }
};

module.exports = { registrarActividad };