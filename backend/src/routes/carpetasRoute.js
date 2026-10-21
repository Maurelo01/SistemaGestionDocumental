const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/autenticacion');
const
{
    obtenerRaiz,
    obtenerContenidoCarpeta,
    crearCarpeta,
    renombrarCarpeta,
    moverCarpeta,
} = require('../controllers/carpetasController');

router.use(verificarToken);

router.get('/raiz', obtenerRaiz);
router.get('/:id/contenido', obtenerContenidoCarpeta);
router.post('/', crearCarpeta);
router.patch('/:id/renombrar', renombrarCarpeta);
router.patch('/:id/mover', moverCarpeta);

module.exports = router;