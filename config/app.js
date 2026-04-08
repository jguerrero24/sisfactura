// ============================================================
// config/app.js — Configuración general de la aplicación
// ============================================================

module.exports = {
  port:          process.env.PORT        || 3000,
  sessionSecret: process.env.SESSION_KEY || 'sisfactura_secret_2024',
  sessionMaxAge: 1000 * 60 * 60 * 4,   // 4 horas

  // Permisos por rol — modificar aquí afecta toda la app
  permisos: {
    admin:      ['ver_facturas', 'crear_factura', 'imprimir_factura', 'gestionar_conceptos', 'gestionar_usuarios'],
    privileged: ['ver_facturas', 'crear_factura', 'imprimir_factura', 'gestionar_conceptos'],
    viewer:     ['ver_facturas']
  }
};
