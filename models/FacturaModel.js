// ============================================================
// models/FacturaModel.js — Esquema y modelo de Facturas
// ============================================================
//
// ESTRUCTURA DEL DOCUMENTO FACTURA:
// {
//   numeroFactura   : string   — "FAC-0001" (generado automático)
//   nombreEmpresa   : string   — Nombre empresa [centro encabezado]
//   telefonoEmpresa : string   — Teléfono       [derecha encabezado]
//   nombreComprador : string   — Nombre del comprador
//   nombreVendedor  : string   — Nombre del vendedor
//   fecha           : string   — "DD-MM-AAAA" (tal como lo ingresa el usuario)
//   items           : Array<{
//                       conceptoId : ObjectId  (ref a Concepto)
//                       concepto   : string    (nombre guardado al facturar)
//                       cantidad   : number
//                       precio     : number
//                       subtotal   : number    (calculado: cantidad × precio)
//                     }>
//   total           : number   — Suma de todos los subtotales
//   anulada         : boolean  — Soft delete
//   creadoPor       : ObjectId — ref a Usuario
// }
//
// Para agregar un campo nuevo:
//   1. Agregarlo al Schema abajo con su tipo y descripción
//   2. Incluirlo en FacturaController.crear() desde req.body
//   3. Agregarlo al formulario en views/facturas/nueva.ejs
//   4. Renderizarlo en views/partials/factura-paper.ejs
//   5. Estilizarlo en public/css/main.css (sección INVOICE)
// ============================================================

const mongoose = require('mongoose');

// ── Sub-esquema de ítems ──────────────────────────────────────
const ItemSchema = new mongoose.Schema({
  conceptoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Concepto',
    default: null
  },
  // CAMPO: Concepto — nombre del tipo de facturación
  concepto: {
    type:     String,
    required: true,
    trim:     true
  },
  // CAMPO: Cantidad de unidades
  cantidad: {
    type:    Number,
    default: 1,
    min:     0
  },
  // CAMPO: Precio unitario
  precio: {
    type:    Number,
    default: 0,
    min:     0
  },
  // CAMPO: Subtotal calculado (cantidad × precio)
  subtotal: {
    type:    Number,
    default: 0
  }
}, { _id: false });

// ── Esquema principal de Factura ──────────────────────────────
const FacturaSchema = new mongoose.Schema({

  // CAMPO: Número de factura (generado automáticamente)
  numeroFactura: {
    type:   String,
    unique: true
  },

  // CAMPO: Nombre de la empresa — ESTÁTICO, guardado para referencia histórica
  nombreEmpresa: {
    type:    String,
    default: 'Junta Administrativa Liceo Laboratorio Emma Gamboa'
  },

  // CAMPO: Teléfono de la empresa — ESTÁTICO
  telefonoEmpresa: {
    type:    String,
    default: '2235-6785'
  },

  // CAMPO: Nombre del comprador
  nombreComprador: {
    type:     String,
    required: true,
    trim:     true
  },

  // CAMPO: Nombre del vendedor
  nombreVendedor: {
    type:     String,
    required: true,
    trim:     true
  },

  // CAMPO: Fecha en formato DD-MM-AAAA (string, tal como lo ingresa el usuario)
  fecha: {
    type:     String,
    required: true,
    match:    [/^\d{2}-\d{2}-\d{4}$/, 'La fecha debe tener formato DD-MM-AAAA']
  },

  // CAMPO: Hora en formato HH:MM 24h (guardada automáticamente al crear)
  hora: {
    type:    String,
    default: ''
  },

  // CAMPO: Ítems de la factura (array de conceptos)
  items: [ItemSchema],

  // CAMPO: Total (suma de subtotales)
  total: {
    type:    Number,
    default: 0
  },

  // Soft delete — no elimina físicamente
  anulada: {
    type:    Boolean,
    default: false
  },

  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Usuario',
    required: true
  }

}, { timestamps: true });

// ── Hook: generar número de factura antes de guardar ──────────
FacturaSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Factura').countDocuments();
    const num   = String(count + 1).padStart(4, '0');

    // Extraer el año de la fecha DD-MM-AAAA ingresada
    // Si la fecha es "15-04-2026", el año es "2026"
    var anio = new Date().getFullYear();
    if (this.fecha && this.fecha.length === 10) {
      anio = this.fecha.substring(6, 10);
    }

    // Formato: 0001-2026 (sin prefijo FAC-)
    this.numeroFactura = num + '-' + anio;

    // Guardar la hora actual en formato HH:MM (24h)
    if (!this.hora) {
      var ahora = new Date();
      var hh    = String(ahora.getHours()).padStart(2, '0');
      var mm    = String(ahora.getMinutes()).padStart(2, '0');
      this.hora = hh + ':' + mm;
    }

    // Calcular subtotales y total automáticamente
    this.items = this.items.map(function(item) {
      return {
        conceptoId: item.conceptoId,
        concepto:   item.concepto,
        cantidad:   item.cantidad,
        precio:     item.precio,
        subtotal:   parseFloat((item.cantidad * item.precio).toFixed(2))
      };
    });
    this.total = parseFloat(
      this.items.reduce(function(s, i) { return s + i.subtotal; }, 0).toFixed(2)
    );
  }
  next();
});

const Factura = mongoose.model('Factura', FacturaSchema);
module.exports = Factura;
