const mongoose = require('mongoose');

const esquemaAlmacenamiento = new mongoose.Schema
(
  {
    bytesUsados: { type: Number, default: 0, min: 0 },
    cantidadArchivos: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const esquemaUsuarios = new mongoose.Schema(
  {
    nombreUsuario:
    {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      trim: true,
      lowercase: true,
    },
    correo:
    {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      trim: true,
      lowercase: true,
    },
    contrasenaHash:
    {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false,
    },
    rol:
    {
      type: String,
      enum: ['ADMIN', 'USUARIO'],
      default: 'USUARIO',
    },
    activo:
    {
      type: Boolean,
      default: true,
    },
    almacenamiento:
    {
      type: esquemaAlmacenamiento,
      default: () => ({ bytesUsados: 0, cantidadArchivos: 0 }),
    },
  },
  {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    versionKey: false,
    collection: 'usuarios',
  }
);

// Indice 1
esquemaUsuarios.index({ nombreUsuario: 1 }, { unique: true });
esquemaUsuarios.index({ correo: 1 }, { unique: true });

esquemaUsuarios.index({ 'almacenamiento.cantidadArchivos': -1 });

module.exports = mongoose.model('Usuario', esquemaUsuarios);