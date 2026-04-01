// ============================================================
// models/ConceptoModel.js — Esquema y modelo de Conceptos
// ============================================================
// Catálogo de tipos de facturación:
// donación, almuerzo, pago de mantenimiento, etc.
// ============================================================

const mongoose = require('mongoose');

const ConceptoSchema = new mongoose.Schema({
  nombre: {
    type:     String,
    required: true,
    trim:     true
  },
  descripcion: {
    type:  String,
    trim:  true,
    default: ''
  },
  precioSugerido: {
    type:    Number,
    default: 0,
    min:     0
  },
  activo: {
    type:    Boolean,
    default: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Usuario'
  }
}, { timestamps: true });

const Concepto = mongoose.model('Concepto', ConceptoSchema);
module.exports = Concepto;
