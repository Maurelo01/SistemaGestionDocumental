const mongoose = require('mongoose');

const esquemaPapelera = new mongoose.Schema
(
    {
        eliminado: { type: Boolean, default: false },
        fechaEliminacion: { type: Date, default: null },
        eliminadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    },
    { _id: false }
);

const esquemaCarpetas = new mongoose.Schema
(
    {
        nombre:
        {
            type: String,
            required: [true, 'El nombre de la carpeta es obligatorio'],
            trim: true,
        },
        propietarioId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        carpetaPadreId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Carpeta',
            default: null,
        },
        ancestros:
        [
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Carpeta',
            },
        ],
        papelera:
        {
            type: esquemaPapelera,
            default: () => ({ eliminado: false, fechaEliminacion: null, eliminadoPor: null }),
        },
    },
    {
        timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
        versionKey: false,
        collection: 'carpetas',
    }
);

// Indice 3
esquemaCarpetas.index({ ancestros: 1 });
esquemaCarpetas.index({ propietarioId: 1, carpetaPadreId: 1, 'papelera.eliminado': 1 });

module.exports = mongoose.model('Carpeta', esquemaCarpetas);