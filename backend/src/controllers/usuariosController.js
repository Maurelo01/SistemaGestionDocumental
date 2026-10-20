const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuarios');

const listarUsuarios = async (req, res) =>
{
    try
    {
        const { buscar, soloActivos } = req.query;
        const filtro = {};
        if (soloActivos === 'true')
        {
            filtro.activo = true;
        }

        if (buscar)
        {
            filtro.$or =
            [
                { nombreUsuario: { $regex: buscar,$options: 'i' } },
                { correo: { $regex: buscar,$options: 'i' } },
            ];
        }

        const usuarios = await Usuario.find(filtro).sort({ fechaCreacion: -1 });
        return res.status(200).json({
            exito: true,
            datos: usuarios,
        });
    }
    catch (error)
    {
        return res.status(500).json({
            exito: false,
            mensaje: 'Error al listar los usuarios.',
            error: error.message,
        });
    }
};

const crearUsuario = async (req, res) => {
    try
    {
        const { nombreUsuario, correo, contrasena, rol } = req.body;

        if (!nombreUsuario || !correo || !contrasena)
        {
            return res.status(400).json({
                exito: false,
                mensaje: 'Nombre de usuario, correo y contraseña son obligatorios.',
            });
        }

        const existe = await Usuario.findOne
        ({
            $or:
            [
                { nombreUsuario: nombreUsuario.trim().toLowerCase() },
                { correo: correo.trim().toLowerCase() },
            ],
        });

        if (existe)
        {
            return res.status(409).json({
                exito: false,
                mensaje: 'El nombre de usuario o correo ya existe.',
            });
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = await Usuario.create
        ({
            nombreUsuario,
            correo,
            contrasenaHash,
            rol: rol === 'ADMIN' ? 'ADMIN' : 'USUARIO',
            activo: true,
        });

        return res.status(201).json
        ({
            exito: true,
            mensaje: 'Usuario creado exitosamente.',
            datos:
            {
                _id: nuevoUsuario._id,
                nombreUsuario: nuevoUsuario.nombreUsuario,
                correo: nuevoUsuario.correo,
                rol: nuevoUsuario.rol,
                activo: nuevoUsuario.activo,
                almacenamiento: nuevoUsuario.almacenamiento,
            },
        });
    }
    catch (error)
    {
        return res.status(500).json
        ({
            exito: false,
            mensaje: 'Error al crear el usuario.',
            error: error.message,
        });
    }
};

const cambiarEstadoUsuario = async (req, res) =>
{
    try 
    {
        const { id } = req.params;
        const { activo } = req.body;

        if (typeof activo !== 'boolean')
        {
            return res.status(400).json({
                exito: false,
                mensaje: 'El campo activo debe ser booleano.',
            });
        }

        if (id === req.usuario._id.toString() && !activo)
        {
            return res.status(400).json({
                exito: false,
                mensaje: 'No puedes desactivar tu propia cuenta en sesión.',
            });
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate
        (
            id,
            { $set: { activo } },
            { new: true }
        );

        if (!usuarioActualizado)
        {
            return res.status(404).json({
                exito: false,
                mensaje: 'Usuario no encontrado.',
            });
        }

        return res.status(200).json({
            exito: true,
            mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente.`,
            datos: usuarioActualizado,
        });
    }
    catch (error)
    {
        return res.status(500).json({
            exito: false,
            mensaje: 'Error al cambiar el estado del usuario.',
            error: error.message,
        });
    }
};

module.exports = { listarUsuarios, crearUsuario, cambiarEstadoUsuario };