const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/autenticacion');
const
{
    listarPapelera,
    enviarAPapelera,
    restaurarRecurso,
    eliminarDefinitivo,
} = require('../controllers/papeleraController');

router.use(verificarToken);

router.get('/', listarPapelera);
router.post('/:tipoRecurso/:id', enviarAPapelera);
router.post('/:tipoRecurso/:id/restaurar', restaurarRecurso);
router.delete('/:tipoRecurso/:id', eliminarDefinitivo);

module.exports = router;