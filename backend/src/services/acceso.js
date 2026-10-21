const Permiso = require('../models/permisos');
const Carpeta = require('../models/carpetas');

const cumpleNivel = (nivelOtorgado, nivelRequerido) =>
    {
    if (nivelRequerido === 'LECTURA')
        {
        return ['LECTURA', 'COMENTAR', 'EDICION'].includes(nivelOtorgado);
    }
    if (nivelRequerido === 'COMENTAR')
        {
        return ['COMENTAR', 'EDICION'].includes(nivelOtorgado);
    }
    if (nivelRequerido === 'EDICION')
    {
        return nivelOtorgado === 'EDICION';
    }
    return false;
};

const verificarAccesoRecurso = async (usuarioId, recurso, tipoRecurso, nivelRequerido = 'LECTURA') =>
{
    const idUsuarioStr = usuarioId.toString();
    if (recurso.propietarioId.toString() === idUsuarioStr)
    {
        return { autorizado: true, esPropietario: true, nivel: 'PROPIETARIO' };
    }
    const permisoDirecto = await Permiso.findOne
    ({
        recursoId: recurso._id,
        tipoRecurso,
        compartidoConId: usuarioId,
    });

    if (permisoDirecto && cumpleNivel(permisoDirecto.nivelAcceso, nivelRequerido))
    {
        return { autorizado: true, esPropietario: false, nivel: permisoDirecto.nivelAcceso };
    }
    let carpetasAncestrosIds = [];
    if (tipoRecurso === 'CARPETA' && recurso.ancestros && recurso.ancestros.length > 0)
    {
        carpetasAncestrosIds = recurso.ancestros;
    }
    else if (tipoRecurso === 'ARCHIVO' && recurso.carpetaId)
    {
        const carpetaContenedora = await Carpeta.findById(recurso.carpetaId);
        if (carpetaContenedora)
        {
            carpetasAncestrosIds = [...carpetaContenedora.ancestros, carpetaContenedora._id];
        }
    }

    if (carpetasAncestrosIds.length > 0)
    {
        const permisosHeredados = await Permiso.find
        ({
            recursoId: { $in: carpetasAncestrosIds },
            tipoRecurso: 'CARPETA',
            compartidoConId: usuarioId,
        });

        for (const perm of permisosHeredados)
        {
            if (cumpleNivel(perm.nivelAcceso, nivelRequerido))
            {
                return { autorizado: true, esPropietario: false, nivel: perm.nivelAcceso };
            }
        }
    }
    return { autorizado: false, esPropietario: false, nivel: null };
};

module.exports = { verificarAccesoRecurso };