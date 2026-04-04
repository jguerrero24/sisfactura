// ============================================================
// config/app.js — CORREGIDO
// Permisos por rol — agregado 'anular_factura' separado
// ============================================================

module.exports = {
  port:          process.env.PORT        || 3000,
  sessionSecret: process.env.SESSION_KEY || 'sisfactura_secret_2024',
  sessionMaxAge: 1000 * 60 * 60 * 4,   // 4 horas

  // ── Permisos por rol — CORREGIDO ────────────────────────
  // Ahora 'anular_factura' es permiso separado (solo admin)
  permisos: {
    admin:      [
      'ver_facturas',
      'crear_factura',
      'imprimir_factura',
      'gestionar_conceptos',
      'gestionar_usuarios',
      'anular_factura'  // Nuevo: solo admin puede anular
    ],
    privileged: [
      'ver_facturas',
      'crear_factura',
      'imprimir_factura',
      'gestionar_conceptos'
      // NOTA: no puede anular facturas
    ],
    viewer:     [
      'ver_facturas'
      // NOTA: solo lectura
    ]
  }
};
