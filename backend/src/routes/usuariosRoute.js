const express = require('express');
const router = express.Router();
const
{
    listarUsuarios,
    crearUsuario,
    cambiarEstadoUsuario,
    cambiarCuotaAlmacenamiento,
} = require('../controllers/usuariosController');
const { verificarToken, requerirRol } = require('../middlewares/autenticacion');

router.get('/', verificarToken, listarUsuarios);
router.post('/', verificarToken, requerirRol('ADMIN'), crearUsuario);
router.patch('/:id/estado', verificarToken, requerirRol('ADMIN'), cambiarEstadoUsuario);
router.patch('/:id/cuota', verificarToken, requerirRol('ADMIN'), cambiarCuotaAlmacenamiento);

module.exports = router;