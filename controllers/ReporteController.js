// ============================================================
// controllers/ReporteController.js — Controlador de Reportes
// ============================================================

const Factura = require('../models/FacturaModel');

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
      console.error('[ReporteController.index]', err);
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
      // Convertimos a comparación de strings porque fecha se guarda como DD-MM-AAAA
      // Usamos createdAt para filtrar por rango real de tiempo
      if (fechaDesde || fechaHasta) {
        query.createdAt = {};
        if (fechaDesde) {
          // Convertir DD-MM-AAAA a Date
          const partsD = fechaDesde.split('-');
          if (partsD.length === 3) {
            const d = new Date(partsD[2], partsD[1] - 1, partsD[0], 0, 0, 0);
            query.createdAt.$gte = d;
          }
        }
        if (fechaHasta) {
          const partsH = fechaHasta.split('-');
          if (partsH.length === 3) {
            const d = new Date(partsH[2], partsH[1] - 1, partsH[0], 23, 59, 59);
            query.createdAt.$lte = d;
          }
        }
      }

      // ── Filtro por rango de monto ────────────────────────────
      if (montoMin || montoMax) {
        query.total = {};
        if (montoMin && !isNaN(parseFloat(montoMin))) {
          query.total.$gte = parseFloat(montoMin);
        }
        if (montoMax && !isNaN(parseFloat(montoMax))) {
          query.total.$lte = parseFloat(montoMax);
        }
      }

      // ── Filtro por número de recibo (búsqueda parcial) ───────
      if (numeroFactura && numeroFactura.trim()) {
        query.numeroFactura = { $regex: numeroFactura.trim(), $options: 'i' };
      }

      // ── Filtro por nombre de asociado ────────────────────────
      if (nombreComprador && nombreComprador.trim()) {
        query.nombreComprador = { $regex: nombreComprador.trim(), $options: 'i' };
      }

      // ── Filtro por cobrador ──────────────────────────────────
      if (nombreVendedor && nombreVendedor.trim()) {
        query.nombreVendedor = { $regex: nombreVendedor.trim(), $options: 'i' };
      }

      // Ejecutar búsqueda
      const facturas = await Factura.find(query)
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 });

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
      console.error('[ReporteController.buscar]', err);
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

      if (fechaDesde || fechaHasta) {
        query.createdAt = {};
        if (fechaDesde) {
          const p = fechaDesde.split('-');
          if (p.length === 3) query.createdAt.$gte = new Date(p[2], p[1]-1, p[0], 0, 0, 0);
        }
        if (fechaHasta) {
          const p = fechaHasta.split('-');
          if (p.length === 3) query.createdAt.$lte = new Date(p[2], p[1]-1, p[0], 23, 59, 59);
        }
      }
      if (montoMin)         query.total             = { ...query.total, $gte: parseFloat(montoMin) };
      if (montoMax)         query.total             = { ...query.total, $lte: parseFloat(montoMax) };
      if (numeroFactura)    query.numeroFactura      = { $regex: numeroFactura, $options: 'i' };
      if (nombreComprador)  query.nombreComprador    = { $regex: nombreComprador, $options: 'i' };
      if (nombreVendedor)   query.nombreVendedor     = { $regex: nombreVendedor, $options: 'i' };

      const facturas = await Factura.find(query)
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 });

      const totalMonto = facturas.reduce(function(s, f) { return s + f.total; }, 0);

      res.render('reportes/imprimir', {
        titulo:      'Reporte de Recibos',
        facturas:    facturas,
        totalMonto:  totalMonto,
        filtros:     req.query,
        generadoEn:  new Date().toLocaleString('es-CR')
      });
    } catch (err) {
      console.error('[ReporteController.imprimir]', err);
      res.redirect('/reportes');
    }
  }
};

module.exports = ReporteController;
