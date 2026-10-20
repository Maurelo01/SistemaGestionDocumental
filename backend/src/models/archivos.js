const mongoose = require('mongoose');

const esquemaComentario = new mongoose.Schema
(
    {
        usuarioId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        nombreUsuario:
        {
            type: String,
            required: true,
        },
        texto: {
            type: String,
            required: [true, 'El comentario no puede estar vacío'],
            trim: true,
        },
        fechaCreacion:
        {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const esquemaPapelera = new mongoose.Schema
(
    {
        eliminado: { type: Boolean, default: false },
        fechaEliminacion: { type: Date, default: null },
        eliminadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    },
    { _id: false }
);

const esquemaArchivos = new mongoose.Schema
(
    {
        nombre:
        {
            type: String,
            required: [true, 'El nombre del archivo es obligatorio'],
            trim: true,
        },
        extension:
        {
            type: String,
            enum: ['.txt', '.md'],
            required: [true, 'La extensión debe ser .txt o .md'],
        },
        contenido:
        {
            type: String,
            default: '',
        },
        tamanoBytes:
        {
            type: Number,
            required: true,
            min: 0,
        },
        propietarioId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        carpetaId:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Carpeta',
            default: null,
        },
        comentarios:
        {
            type: [esquemaComentario],
            default: [],
        },
        papelera:
        {
            type: esquemaPapelera,
            default: () => ({ eliminado: false, fechaEliminacion: null, eliminadoPor: null }),
        },
    },
    {
        timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
        versionKey: false,
        collection: 'archivos',
    }
);

// Indice 2
esquemaArchivos.index({ propietarioId: 1, carpetaId: 1, 'papelera.eliminado': 1 });
esquemaArchivos.index({ extension: 1, fechaCreacion: -1 });

module.exports = mongoose.model('Archivo', esquemaArchivos);