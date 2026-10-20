const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');

const JWT_SECRETO = process.env.JWT_SECRETO || '1234';
const JWT_EXPIRACION = process.env.JWT_EXPIRACION || '24h';

const iniciarSesion = async (req, res) =>
{
    try
    {
        const { nombreUsuario, contrasena } = req.body;

        if (!nombreUsuario || !contrasena)
        {
            return res.status(400).json({
                exito: false,
                mensaje: 'Debes ingresar el nombre de usuario y contraseña.',
            });
        }

        const usuario = await Usuario.findOne({nombreUsuario: nombreUsuario.trim().toLowerCase(),}).select('+contrasenaHash');

        if (!usuario)
        {
            return res.status(401).json({
                exito: false,
                mensaje: 'Nombre de usuario o contraseña incorrectos.',
            });
        }

        if (!usuario.activo)
        {
            return res.status(403).json({
                exito: false,
                mensaje: 'Usuario inactivo. No puede acceder al sistema.',
            });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);
        if (!contrasenaValida)
        {
            return res.status(401).json({
                exito: false,
                mensaje: 'Nombre de usuario o contraseña incorrectos.',
            });
        }

        const token = jwt.sign(
            {
                id: usuario._id,
                nombreUsuario: usuario.nombreUsuario,
                rol: usuario.rol,
            },
            JWT_SECRETO,
            { expiresIn: JWT_EXPIRACION }
        );

        return res.status(200).json({
            exito: true,
            mensaje: 'Inicio de sesión exitoso.',
            datos:
            {
                token,
                usuario:
                {
                    _id: usuario._id,
                    nombreUsuario: usuario.nombreUsuario,
                    correo: usuario.correo,
                    rol: usuario.rol,
                    activo: usuario.activo,
                    almacenamiento: usuario.almacenamiento,
                },
            },
        });
    }
    catch (error)
    {
        return res.status(500).json({
            exito: false,
            mensaje: 'Error interno al iniciar sesión.',
            error: error.message,
        });
    }
};

const obtenerPerfil = async (req, res) =>
{
    try
    {
        const usuario = await Usuario.findById(req.usuario._id);
        return res.status(200).json({
            exito: true,
            datos: usuario,
        });
    }
    catch (error)
    {
        return res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener el perfil del usuario.',
        });
    }
};

module.exports = { iniciarSesion, obtenerPerfil };