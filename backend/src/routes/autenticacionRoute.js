const express = require('express');
const router = express.Router();
const { iniciarSesion, obtenerPerfil } = require('../controllers/autenticacionController');
const { verificarToken } = require('../middlewares/autenticacion');

router.post('/login', iniciarSesion);
router.get('/perfil', verificarToken, obtenerPerfil);

module.exports = router;