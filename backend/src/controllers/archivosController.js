const archivoServicio = require('../services/archivosService');
const { registrarActividad } = require('../services/actividad');
const { manejarError } = require('../utils/http');

const buscarArchivos = async (req, res) =>
{
    try
    {
        const archivos = await archivoServicio.listarYFiltrarArchivos(req.usuario._id, req.query);
        return res.status(200).json({ exito: true, datos: archivos });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al buscar archivos.');
    }
};

const crearOSubirArchivo = async (req, res) => 
{
    try
    {
        const nuevoArchivo = await archivoServicio.guardarNuevoArchivo(req.usuario, req.body, req.file);
        return res.status(201).json({
            exito: true,
            mensaje: 'Archivo almacenado exitosamente en MongoDB.',
            datos: nuevoArchivo,
        });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al almacenar el archivo.');
    }
};

const obtenerArchivoPorId = async (req, res) => 
{
    try
    {
        const { archivo, nivelAcceso } = await archivoServicio.obtenerArchivoValidado
        (
            req.params.id,
            req.usuario._id,
            'LECTURA',
            true
        );

        await registrarActividad
        ({
            usuarioId: req.usuario._id,
            accion: 'LEER',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            nombre: archivo.nombre,
            extension: archivo.extension,
            detalles: 'Consulta de contenido del archivo',
        });

        return res.status(200).json({ exito: true, datos: { archivo, nivelAcceso } });
    } 
    catch (error)
    {
        return manejarError(res, error, 'Error al obtener el archivo.');
    }
};

const descargarArchivo = async (req, res) => 
{
    try 
    {
        const { archivo } = await archivoServicio.obtenerArchivoValidado
        (
            req.params.id,
            req.usuario._id,
            'LECTURA'
        );

        await registrarActividad
        ({
            usuarioId: req.usuario._id,
            accion: 'DESCARGAR',
            recursoId: archivo._id,
            tipoRecurso: 'ARCHIVO',
            nombre: archivo.nombre,
            extension: archivo.extension,
            detalles: `Descarga de '${archivo.nombre}${archivo.extension}'`,
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombre}${archivo.extension}"`);
        return res.status(200).send(archivo.contenido);
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al descargar el archivo.');
    }
};

const editarContenidoArchivo = async (req, res) =>
{
    try
    {
        const archivo = await archivoServicio.actualizarContenido(req.params.id, req.usuario._id, req.body.contenido);
        return res.status(200).json({ exito: true, mensaje: 'Contenido actualizado.', datos: archivo });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al editar el archivo.');
    }
};

const renombrarArchivo = async (req, res) =>
{
    try
    {
        const archivo = await archivoServicio.cambiarNombreArchivo(req.params.id, req.usuario._id, req.body.nombre);
        return res.status(200).json({ exito: true, mensaje: 'Archivo renombrado.', datos: archivo });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al renombrar el archivo.');
    }
};

const moverArchivo = async (req, res) =>
{
    try
    {
        const archivo = await archivoServicio.cambiarUbicacionArchivo(req.params.id, req.usuario._id, req.body.carpetaDestinoId);
        return res.status(200).json({ exito: true, mensaje: 'Archivo movido.', datos: archivo });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al mover el archivo.');
    }
};

const agregarComentario = async (req, res) =>
{
    try
    {
        const comentarios = await archivoServicio.insertarComentario(req.params.id, req.usuario, req.body.texto);
        return res.status(201).json({ exito: true, mensaje: 'Comentario agregado.', datos: comentarios });
    }
    catch (error)
    {
        return manejarError(res, error, 'Error al agregar el comentario.');
    }
};

module.exports =
{
    buscarArchivos,
    crearOSubirArchivo,
    obtenerArchivoPorId,
    descargarArchivo,
    editarContenidoArchivo,
    renombrarArchivo,
    moverArchivo,
    agregarComentario,
};