const papeleraServicio = require('../services/papeleraService');
const { manejarError } = require('../utils/http');

const listarPapelera = async (req, res) =>
{
    try
    {
        const datos = await papeleraServicio.obtenerElementosEnPapelera(req.usuario._id);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al consultar la papelera.');
    }
};

const enviarAPapelera = async (req, res) =>
{
    try
    {
        const { tipoRecurso, id } = req.params;
        const datos = await papeleraServicio.moverAPapelera(req.usuario._id, tipoRecurso.toUpperCase(), id);
        return res.status(200).json({ exito: true, mensaje: 'Recurso enviado a la papelera.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al enviar el recurso a la papelera.');
    }
};

const restaurarRecurso = async (req, res) =>
{
    try
    {
        const { tipoRecurso, id } = req.params;
        const datos = await papeleraServicio.restaurarDePapelera(req.usuario._id, tipoRecurso.toUpperCase(), id);
        return res.status(200).json({ exito: true, mensaje: 'Recurso restaurado exitosamente.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al restaurar el recurso.');
    }
};

const eliminarDefinitivo = async (req, res) =>
{
    try
    {
        const { tipoRecurso, id } = req.params;
        await papeleraServicio.eliminarPermanentemente(req.usuario._id, tipoRecurso.toUpperCase(), id);
        return res.status(200).json({ exito: true, mensaje: 'Recurso eliminado permanentemente.' });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al eliminar permanentemente el recurso.');
    }
};

module.exports =
{
    listarPapelera,
    enviarAPapelera,
    restaurarRecurso,
    eliminarDefinitivo,
};