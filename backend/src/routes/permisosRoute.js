const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/autenticacion');
const
{
    compartirRecurso,
    eliminarPermiso,
    obtenerCompartidosConmigo,
    obtenerCompartidosPorMi,
} = require('../controllers/permisosController.js');

router.use(verificarToken);

router.post('/', compartirRecurso);
router.get('/conmigo', obtenerCompartidosConmigo);
router.get('/por-mi', obtenerCompartidosPorMi);
router.delete('/:id', eliminarPermiso);

module.exports = router;