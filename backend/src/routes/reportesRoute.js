const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/autenticacion');
const
{
    reporteArchivosPorTipo,
    reporteArchivosPorFechas,
    reporteArchivosMasOperaciones,
    reporteTopUsuariosArchivos,
    reporteUsuariosMasCompartidos,
    reporteArchivosMasCompartidos,
    reporteCompartidosPorUsuario,
    reporteRecibidosPorUsuario,
    reporteHistorialUsuario,
    reporteOperacionesPorTipo,
    reporteOperacionesPorPeriodo,
    reportePrincipalesAcciones,
} = require('../controllers/reportesController');

router.use(verificarToken);

// Reportes de archivos y almacenamiento
router.get('/archivos/por-tipo', reporteArchivosPorTipo);
router.get('/archivos/por-fechas', reporteArchivosPorFechas);
router.get('/archivos/mas-operaciones', reporteArchivosMasOperaciones);

// Reportes de usuarios
router.get('/usuarios/top-archivos', reporteTopUsuariosArchivos);
router.get('/usuarios/mas-compartidos', reporteUsuariosMasCompartidos);

// Reportes de comparticion
router.get('/comparticion/archivos-mas-compartidos', reporteArchivosMasCompartidos);
router.get('/comparticion/por-usuario/:usuarioId', reporteCompartidosPorUsuario);
router.get('/comparticion/recibidos/:usuarioId', reporteRecibidosPorUsuario);

// Reportes de actividad
router.get('/actividad/usuario/:usuarioId', reporteHistorialUsuario);
router.get('/actividad/por-tipo', reporteOperacionesPorTipo);
router.get('/actividad/por-periodo', reporteOperacionesPorPeriodo);
router.get('/actividad/principales-acciones', reportePrincipalesAcciones);

module.exports = router;