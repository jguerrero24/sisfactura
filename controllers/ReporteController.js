// ============================================================
// controllers/ReporteController.js — Controlador de Reportes
// CORREGIDO: Escape de regex, validaciones mejoradas
// ============================================================

const Factura = require('../models/FacturaModel');

// Función para escapar caracteres especiales en expresiones regulares
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ReporteController = {

  // GET /reportes — vista con filtros
  async index(req, res) {
    try {
      res.render('reportes/index', {
        titulo:   'Reportes',
        facturas: [],
        filtros:  {},
        stats:    null,
        buscado:  false
      });
    } catch (err) {
      console.error('[ReporteController.index] Error interno del servidor');
      req.flash('error', 'Error al cargar los reportes.');
      res.redirect('/dashboard');
    }
  },

  // POST /reportes/buscar — aplicar filtros
  async buscar(req, res) {
    try {
      const {
        fechaDesde,
        fechaHasta,
        montoMin,
        montoMax,
        numeroFactura,
        nombreComprador,
        nombreVendedor
      } = req.body;

      // Construir query de MongoDB
      const query = { anulada: false };

      // ── Filtro por rango de fechas (formato DD-MM-AAAA) ──────
      if (fechaDesde || fechaHasta) {
        query.createdAt = {};
        if (fechaDesde) {
          const partsD = fechaDesde.split('-');
          if (partsD.length === 3 && /^\d{2}-\d{2}-\d{4}$/.test(fechaDesde)) {
            const d = new Date(partsD[2], partsD[1] - 1, partsD[0], 0, 0, 0);
            // Validar que sea fecha válida
            if (!isNaN(d.getTime())) {
              query.createdAt.$gte = d;
            }
          }
        }
        if (fechaHasta) {
          const partsH = fechaHasta.split('-');
          if (partsH.length === 3 && /^\d{2}-\d{2}-\d{4}$/.test(fechaHasta)) {
            const d = new Date(partsH[2], partsH[1] - 1, partsH[0], 23, 59, 59);
            if (!isNaN(d.getTime())) {
              query.createdAt.$lte = d;
            }
          }
        }
      }

      // ── Filtro por rango de monto ────────────────────────────
      if (montoMin || montoMax) {
        query.total = {};
        if (montoMin && !isNaN(parseFloat(montoMin))) {
          const min = parseFloat(montoMin);
          if (min >= 0) {
            query.total.$gte = min;
          }
        }
        if (montoMax && !isNaN(parseFloat(montoMax))) {
          const max = parseFloat(montoMax);
          if (max >= 0 && max <= 999999.99) {
            query.total.$lte = max;
          }
        }
      }

      // ── Filtro por número de recibo (búsqueda parcial con escape) ───────
      if (numeroFactura && numeroFactura.trim()) {
        const numFact = numeroFactura.trim();
        if (numFact.length <= 50) { // Limitar longitud
          query.numeroFactura = { $regex: escapeRegex(numFact), $options: 'i' };
        }
      }

      // ── Filtro por nombre de asociado ────────────────────────
      if (nombreComprador && nombreComprador.trim()) {
        const nomComp = nombreComprador.trim();
        if (nomComp.length <= 200) {
          query.nombreComprador = { $regex: escapeRegex(nomComp), $options: 'i' };
        }
      }

      // ── Filtro por cobrador ──────────────────────────────────
      if (nombreVendedor && nombreVendedor.trim()) {
        const nomVend = nombreVendedor.trim();
        if (nomVend.length <= 200) {
          query.nombreVendedor = { $regex: escapeRegex(nomVend), $options: 'i' };
        }
      }

      // Ejecutar búsqueda con límite de resultados
      const facturas = await Factura.find(query)
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 })
        .limit(1000); // Limitar a 1000 resultados

      // Calcular estadísticas del resultado
      const totalMonto = facturas.reduce(function(s, f) { return s + f.total; }, 0);
      const stats = {
        cantidad:    facturas.length,
        totalMonto:  totalMonto,
        promedioMonto: facturas.length ? totalMonto / facturas.length : 0,
        montoMax:    facturas.length ? Math.max.apply(null, facturas.map(function(f) { return f.total; })) : 0,
        montoMin:    facturas.length ? Math.min.apply(null, facturas.map(function(f) { return f.total; })) : 0
      };

      const filtros = { fechaDesde, fechaHasta, montoMin, montoMax, numeroFactura, nombreComprador, nombreVendedor };

      res.render('reportes/index', {
        titulo:   'Reportes',
        facturas: facturas,
        filtros:  filtros,
        stats:    stats,
        buscado:  true
      });

    } catch (err) {
      console.error('[ReporteController.buscar] Error interno del servidor');
      req.flash('error', 'Error al generar el reporte.');
      res.redirect('/reportes');
    }
  },

  // GET /reportes/imprimir — vista imprimible del reporte
  async imprimir(req, res) {
    try {
      // Recibir filtros como query params
      const { fechaDesde, fechaHasta, montoMin, montoMax, numeroFactura, nombreComprador, nombreVendedor } = req.query;

      const query = { anulada: false };

      // Mismo proceso de validación que en buscar()
      if (fechaDesde || fechaHasta) {
        query.createdAt = {};
        if (fechaDesde && /^\d{2}-\d{2}-\d{4}$/.test(fechaDesde)) {
          const p = fechaDesde.split('-');
          const d = new Date(p[2], p[1]-1, p[0], 0, 0, 0);
          if (!isNaN(d.getTime())) query.createdAt.$gte = d;
        }
        if (fechaHasta && /^\d{2}-\d{2}-\d{4}$/.test(fechaHasta)) {
          const p = fechaHasta.split('-');
          const d = new Date(p[2], p[1]-1, p[0], 23, 59, 59);
          if (!isNaN(d.getTime())) query.createdAt.$lte = d;
        }
      }
      
      if (montoMin && !isNaN(parseFloat(montoMin))) {
        const min = parseFloat(montoMin);
        if (min >= 0) {
          query.total = query.total || {};
          query.total.$gte = min;
        }
      }
      if (montoMax && !isNaN(parseFloat(montoMax))) {
        const max = parseFloat(montoMax);
        if (max >= 0 && max <= 999999.99) {
          query.total = query.total || {};
          query.total.$lte = max;
        }
      }
      
      if (numeroFactura && numeroFactura.trim().length <= 50) {
        query.numeroFactura = { $regex: escapeRegex(numeroFactura.trim()), $options: 'i' };
      }
      if (nombreComprador && nombreComprador.trim().length <= 200) {
        query.nombreComprador = { $regex: escapeRegex(nombreComprador.trim()), $options: 'i' };
      }
      if (nombreVendedor && nombreVendedor.trim().length <= 200) {
        query.nombreVendedor = { $regex: escapeRegex(nombreVendedor.trim()), $options: 'i' };
      }

      const facturas = await Factura.find(query)
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 })
        .limit(1000);

      const totalMonto = facturas.reduce(function(s, f) { return s + f.total; }, 0);

      res.render('reportes/imprimir', {
        titulo:      'Reporte de Recibos',
        facturas:    facturas,
        totalMonto:  totalMonto,
        filtros:     req.query,
        generadoEn:  new Date().toLocaleString('es-CR')
      });
    } catch (err) {
      console.error('[ReporteController.imprimir] Error interno del servidor');
      res.redirect('/reportes');
    }
  }
};

module.exports = ReporteController;
