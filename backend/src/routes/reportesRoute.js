const express = require('express');
const router = express.Router();
const { verificarToken, requerirRol } = require('../middlewares/autenticacion');
const
{
    reporteArchivosPorTipo,
    reporteArchivosPorFechas,
    reporteArchivosMasOperaciones,
    reporteArchivosNuncaCompartidos,
    reporteCarpetasMasArchivos,
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

const validarPropietarioOAdmin = (req, res, next) =>
{
    if (req.usuario.rol !== 'ADMIN' && req.params.usuarioId !== req.usuario._id.toString()) return res.status(403).json({ exito: false, mensaje: 'Solo puedes consultar tus propios reportes.' });
    next();
};
router.use(verificarToken);

// Reportes de archivos y almacenamiento
router.get('/archivos/por-tipo', requerirRol('ADMIN'), reporteArchivosPorTipo);
router.get('/archivos/por-fechas', requerirRol('ADMIN'), reporteArchivosPorFechas);
router.get('/archivos/mas-operaciones', requerirRol('ADMIN'), reporteArchivosMasOperaciones);
router.get('/comparticion/nunca-compartidos', requerirRol('ADMIN'), reporteArchivosNuncaCompartidos);
router.get('/carpetas/mas-archivos', requerirRol('ADMIN'), reporteCarpetasMasArchivos);

// Reportes de usuarios
router.get('/usuarios/top-archivos', requerirRol('ADMIN'), reporteTopUsuariosArchivos);
router.get('/usuarios/mas-compartidos', requerirRol('ADMIN'), reporteUsuariosMasCompartidos);

// Reportes de comparticion
router.get('/comparticion/archivos-mas-compartidos', requerirRol('ADMIN'), reporteArchivosMasCompartidos);
router.get('/comparticion/por-usuario/:usuarioId', validarPropietarioOAdmin, reporteCompartidosPorUsuario);
router.get('/comparticion/recibidos/:usuarioId', validarPropietarioOAdmin, reporteRecibidosPorUsuario);

// Reportes de actividad
router.get('/actividad/usuario/:usuarioId', validarPropietarioOAdmin, reporteHistorialUsuario);
router.get('/actividad/por-tipo', requerirRol('ADMIN'), reporteOperacionesPorTipo);
router.get('/actividad/por-periodo', requerirRol('ADMIN'), reporteOperacionesPorPeriodo);
router.get('/actividad/principales-acciones', requerirRol('ADMIN'), reportePrincipalesAcciones);

module.exports = router;