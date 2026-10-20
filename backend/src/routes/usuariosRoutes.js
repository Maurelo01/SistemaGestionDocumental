const express = require('express');
const router = express.Router();
const
{
    listarUsuarios,
    crearUsuario,
    cambiarEstadoUsuario,
} = require('../controllers/usuariosController');
const { verificarToken, requerirRol } = require('../middlewares/autenticacion');

router.get('/', verificarToken, listarUsuarios);
router.post('/', verificarToken, requerirRol('ADMIN'), crearUsuario);
router.patch('/:id/estado', verificarToken, requerirRol('ADMIN'), cambiarEstadoUsuario);

module.exports = router;