const permisoServicio = require('../services/permisosService');
const { manejarError } = require('../utils/http');

const compartirRecurso = async (req, res) =>
{
    try
    {
        const datos = await permisoServicio.otorgarOActualizarPermiso(req.usuario._id, req.body);
        return res.status(200).json({ exito: true, mensaje: 'Permiso asignado correctamente.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al compartir el recurso.');
    }
};

const eliminarPermiso = async (req, res) =>
{
    try
    {
        await permisoServicio.revocarAcceso(req.params.id, req.usuario._id);
        return res.status(200).json({ exito: true, mensaje: 'Permiso revocado exitosamente.' });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al quitar el permiso.');
    }
};

const obtenerCompartidosConmigo = async (req, res) =>
{
    try
    {
        const datos = await permisoServicio.listarCompartidosConUsuario(req.usuario._id);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al consultar recursos compartidos contigo.');
    }
};

const obtenerCompartidosPorMi = async (req, res) =>
{
    try
    {
        const datos = await permisoServicio.listarCompartidosPorPropietario(req.usuario._id);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al consultar recursos compartidos por ti.');
    }
};

module.exports =
{
    compartirRecurso,
    eliminarPermiso,
    obtenerCompartidosConmigo,
    obtenerCompartidosPorMi,
};