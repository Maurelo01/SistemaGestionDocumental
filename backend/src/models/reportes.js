const mongoose = require('mongoose');

const esquemaDatosRecurso = new mongoose.Schema
(
    {
        nombre: { type: String, required: true },
        extension: { type: String, default: null },
    },
    { _id: false }
);

const esquemaReportes = new mongoose.Schema
(
    {
        usuarioId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        accion:
        {
            type: String,
            enum:
            [
                'CREAR',
                'LEER',
                'EDITAR',
                'RENOMBRAR',
                'MOVER',
                'PAPELERA',
                'RESTAURAR',
                'ELIMINAR_DEFINITIVO',
                'COMPARTIR',
                'REVOCAR_PERMISO',
                'COMENTAR',
                'DESCARGAR',
            ],
            required: true,
        },
        recursoId:
        {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        tipoRecurso:
        {
            type: String,
            enum: ['ARCHIVO', 'CARPETA'],
            required: true,
        },
        datosRecurso:
        {
            type: esquemaDatosRecurso,
            required: true,
        },
        detalles:
        {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: 'fechaCreacion', updatedAt: false },
        versionKey: false,
        collection: 'actividades',
    }
);

// Indice 5
esquemaReportes.index({ usuarioId: 1, fechaCreacion: -1 });
esquemaReportes.index({ tipoRecurso: 1, recursoId: 1 });
esquemaReportes.index({ accion: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Actividad', esquemaReportes);