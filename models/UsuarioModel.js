// ============================================================
// models/UsuarioModel.js — Esquema y modelo de Usuarios
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  username: {
    type:     String,
    required: true,
    unique:   true,
    trim:     true,
    lowercase: true
  },
  nombreCompleto: {
    type:     String,
    required: true,
    trim:     true
  },
  passwordHash: {
    type:     String,
    required: true
  },
  rol: {
    type:    String,
    enum:    ['admin', 'privileged', 'viewer'],
    default: 'viewer'
  },
  activo: {
    type:    Boolean,
    default: true
  }
}, { timestamps: true });

// ── Método: validar contraseña ────────────────────────────────
UsuarioSchema.methods.validarPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// ── Método estático: crear con hash automático ────────────────
UsuarioSchema.statics.crearConHash = async function({ username, nombreCompleto, password, rol }) {
  const hash = await bcrypt.hash(password, 10);
  return this.create({ username, nombreCompleto, passwordHash: hash, rol });
};

const Usuario = mongoose.model('Usuario', UsuarioSchema);
module.exports = Usuario;
