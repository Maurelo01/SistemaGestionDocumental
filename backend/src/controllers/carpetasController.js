const carpetaServicio = require('../services/carpetasService');
const { manejarError } = require('../utils/http');

const obtenerRaiz = async (req, res) =>
{
    try
    {
        const datos = await carpetaServicio.listarRaizUsuario(req.usuario._id);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al obtener la raíz.');
    }
};

const obtenerContenidoCarpeta = async (req, res) =>
{
    try
    {
        const datos = await carpetaServicio.listarContenidoSubcarpeta(req.params.id, req.usuario._id);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al obtener el contenido de la carpeta.');
    }
};

const crearCarpeta = async (req, res) =>
{
    try
    {
        const datos = await carpetaServicio.crearNuevaCarpeta(req.usuario._id, req.body);
        return res.status(201).json({ exito: true, mensaje: 'Carpeta creada.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al crear la carpeta.');
    }
};

const renombrarCarpeta = async (req, res) =>
{
    try
    {
        const datos = await carpetaServicio.cambiarNombreCarpeta(req.params.id, req.usuario._id, req.body.nombre);
        return res.status(200).json({ exito: true, mensaje: 'Carpeta renombrada.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al renombrar la carpeta.');
    }
};

const moverCarpeta = async (req, res) =>
{
    try
    {
        const datos = await carpetaServicio.moverCarpetaConValidacion(
            req.params.id,
            req.usuario._id,
            req.body.carpetaDestinoId
        );
        return res.status(200).json({ exito: true, mensaje: 'Carpeta movida.', datos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al mover la carpeta.');
    }
};

module.exports =
{
    obtenerRaiz,
    obtenerContenidoCarpeta,
    crearCarpeta,
    renombrarCarpeta,
    moverCarpeta,
};