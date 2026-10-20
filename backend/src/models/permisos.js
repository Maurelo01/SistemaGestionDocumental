const mongoose = require('mongoose');

const esquemaPermisos = new mongoose.Schema
(
  {
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
    propietarioId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    compartidoConId:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nivelAcceso:
    {
      type: String,
      enum: ['LECTURA', 'EDICION', 'COMENTAR'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    versionKey: false,
    collection: 'permisos',
  }
);

// Indice 4
esquemaPermisos.index({ compartidoConId: 1, tipoRecurso: 1 });
esquemaPermisos.index({ recursoId: 1, compartidoConId: 1 }, { unique: true });
esquemaPermisos.index({ propietarioId: 1 });

module.exports = mongoose.model('Permiso', esquemaPermisos);