const crearError = (codigoEstado, mensaje) =>
{
    const error = new Error(mensaje);
    error.codigoEstado = codigoEstado;
    return error;
};

const manejarError = (res, error, mensajePorDefecto = 'Error interno del servidor.') =>
{
    const codigo = error.codigoEstado || 500;
    return res.status(codigo).json({
        exito: false,
        mensaje: error.codigoEstado ? error.message : mensajePorDefecto,
        error: error.message,
    });
};

module.exports = { crearError, manejarError };