const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');

const JWT_SECRETO = process.env.JWT_SECRETO || '1234';

const verificarToken = async (req, res, next) =>
{
    try
    {
        const cabeceraAuth = req.headers.authorization;
        if (!cabeceraAuth || !cabeceraAuth.startsWith('Bearer '))
        {
            return res.status(401).json({
                exito: false,
                mensaje: 'Acceso denegado. No se proporcionó un token válido.',
            });
        }

        const token = cabeceraAuth.split(' ')[1];
        const decodificado = jwt.verify(token, JWT_SECRETO);

        const usuarioActual = await Usuario.findById(decodificado.id);
        if (!usuarioActual)
        {
            return res.status(401).json({
                exito: false,
                mensaje: 'Este usuario asociado a este token no existe.',
            });
        }

        if (!usuarioActual.activo)
        {
            return res.status(403).json({
                exito: false,
                mensaje: 'Tu cuenta está desactivada. Contacta al administrador.',
            });
        }

        req.usuario = usuarioActual;
        next();
    }
    catch (error)
    {
        return res.status(401).json({
            exito: false,
            mensaje: 'Token inválido o sesión expirada.',
        });
    }
};

const requerirRol = (...rolesPermitidos) =>
{
    return (req, res, next) =>
    {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol))
        {
            return res.status(403).json({
                exito: false,
                mensaje: 'No tienes permisos para esta operación.',
            });
        }
        next();
    };
};

module.exports = { verificarToken, requerirRol };