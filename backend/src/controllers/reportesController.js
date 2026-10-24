const reportesServicio = require('../services/reportesService');
const { manejarError } = require('../utils/http');

const responderReporte = (ejecutarConsulta, mensajeError) => async (req, res) => 
{
    try
    {
        const datos = await ejecutarConsulta(req);
        return res.status(200).json({ exito: true, datos });
    }
    catch (error)
    {
        return manejarError(res, error, mensajeError);
    }
};

// Reportes de archivos y almacenamiento
const reporteArchivosPorTipo = responderReporte
(
    () => reportesServicio.obtenerArchivosPorTipo(),
    'Error al generar reporte de archivos por tipo.'
);

const reporteArchivosPorFechas = responderReporte
(
    (req) => reportesServicio.obtenerArchivosPorRangoFechas(req.query),
    'Error al generar reporte de archivos por fechas.'
);

const reporteArchivosMasOperaciones = responderReporte
(
    (req) => reportesServicio.obtenerArchivosConMasOperaciones(req.query.limite),
    'Error al generar reporte de archivos con más operaciones.'
);

const reporteArchivosNuncaCompartidos = responderReporte
(
    () => reportesServicio.obtenerArchivosNuncaCompartidos(),
    'Error al generar reporte de archivos nunca compartidos.'
);

const reporteCarpetasMasArchivos = responderReporte
(
    (req) => reportesServicio.obtenerCarpetasConMasArchivos(req.query.limite),
    'Error al generar reporte de carpetas con más archivos.'
);

// Reportes de usuarios
const reporteTopUsuariosArchivos = responderReporte
(
    (req) => reportesServicio.obtenerTopUsuariosArchivos(req.query.limite),
    'Error al generar el Top 10 de usuarios por archivos.'
);

const reporteUsuariosMasCompartidos = responderReporte
(
    (req) => reportesServicio.obtenerUsuariosConMasCompartidos(req.query.limite),
    'Error al generar reporte de usuarios que más comparten.'
);

// Reportes de comparticion
const reporteArchivosMasCompartidos = responderReporte
(
    (req) => reportesServicio.obtenerArchivosMasCompartidos(req.query.limite),
    'Error al generar reporte de archivos más compartidos.'
);

const reporteCompartidosPorUsuario = responderReporte
(
    (req) => reportesServicio.obtenerRecursosCompartidosPorUsuario(req.params.usuarioId),
    'Error al consultar recursos compartidos por el usuario.'
);

const reporteRecibidosPorUsuario = responderReporte
(
    (req) => reportesServicio.obtenerRecursosRecibidosPorUsuario(req.params.usuarioId),
    'Error al consultar recursos recibidos por el usuario.'
);

// Reportes de actividad
const reporteHistorialUsuario = responderReporte
(
    (req) => reportesServicio.obtenerHistorialUsuario(req.params.usuarioId, req.query),
    'Error al generar el historial de actividad del usuario.'
);

const reporteOperacionesPorTipo = responderReporte
(
    () => reportesServicio.obtenerOperacionesPorTipo(),
    'Error al generar reporte de operaciones por tipo.'
);

const reporteOperacionesPorPeriodo = responderReporte
(
    (req) => reportesServicio.obtenerOperacionesPorPeriodo(req.query.periodo),
    'Error al generar reporte de operaciones por período.'
);

const reportePrincipalesAcciones = responderReporte
(
    (req) => reportesServicio.obtenerPrincipalesAcciones(req.query.limite),
    'Error al generar reporte de principales acciones.'
);

module.exports =
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
    reporteArchivosNuncaCompartidos,
    reporteCarpetasMasArchivos,
};