const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verificarToken } = require('../middlewares/autenticacion');
const
{
    buscarArchivos,
    crearOSubirArchivo,
    obtenerArchivoPorId,
    descargarArchivo,
    editarContenidoArchivo,
    renombrarArchivo,
    moverArchivo,
    agregarComentario,
} = require('../controllers/archivosController');

const subidaMemoria = multer
({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(verificarToken);

router.get('/', buscarArchivos);
router.post('/', subidaMemoria.single('archivo'), crearOSubirArchivo);
router.get('/:id', obtenerArchivoPorId);
router.get('/:id/descargar', descargarArchivo);
router.put('/:id/contenido', editarContenidoArchivo);
router.patch('/:id/renombrar', renombrarArchivo);
router.patch('/:id/mover', moverArchivo);
router.post('/:id/comentarios', agregarComentario);

module.exports = router;