// ============================================================
// controllers/FacturaController.js — CORREGIDO
// Validaciones: fecha, cantidad, precio, límite de ítems
// ============================================================

const Factura  = require('../models/FacturaModel');
const Concepto = require('../models/ConceptoModel');

// Función para validar fecha en formato DD-MM-AAAA
function validarFecha(fecha) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(fecha)) return false;
  
  const [dd, mm, yyyy] = fecha.split('-').map(Number);
  
  // Validar rango de mes
  if (mm < 1 || mm > 12) return false;
  
  // Validar rango de día (simple)
  if (dd < 1 || dd > 31) return false;
  
  // Validar año (1900-2100)
  if (yyyy < 1900 || yyyy > 2100) return false;
  
  // Validar fecha real (ej: 30-02-2024 es inválida)
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return false;
  }
  
  return true;
}

// Validar cadenas: sin espacios en blanco solamente
function validarNombre(nombre, maxLen = 200) {
  if (!nombre || typeof nombre !== 'string') return false;
  
  const trimmed = nombre.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return false;
  
  return trimmed;
}

const FacturaController = {

  async index(req, res) {
    try {
      const pagina  = parseInt(req.query.pagina) || 1;
      const porPag  = 20;
      // CORREGIDO: Filtrar anuladas = false
      const facturas = await Factura.find({ anulada: false })
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 })
        .skip((pagina - 1) * porPag)
        .limit(porPag);
      res.render('facturas/index', { titulo: 'Facturas', facturas, pagina });
    } catch (err) {
      console.error('[FacturaController.index] Error interno del servidor');
      req.flash('error', 'Error al cargar las facturas.');
      res.redirect('/dashboard');
    }
  },

  async nueva(req, res) {
    try {
      const conceptos = await Concepto.find({ activo: true }).sort({ nombre: 1 });
      res.render('facturas/nueva', { titulo: 'Nueva Factura', conceptos });
    } catch (err) {
      console.error('[FacturaController.nueva] Error interno del servidor');
      req.flash('error', 'Error al cargar el formulario.');
      res.redirect('/facturas');
    }
  },

  async crear(req, res) {
    try {
      // Datos de la empresa — ESTÁTICOS
      const nombreEmpresa    = 'Junta Administrativa Liceo Laboratorio Emma Gamboa';
      const telefonoEmpresa  = '2235-6785';

      const { nombreComprador, nombreVendedor, fecha } = req.body;

      // ── Validar campos obligatorios ────────────────────────
      const nomComp = validarNombre(nombreComprador);
      const nomVend = validarNombre(nombreVendedor);
      
      if (!nomComp || !nomVend) {
        req.flash('error', 'Nombre de asociado y cobrador son obligatorios (1-200 caracteres).');
        return res.redirect('/facturas/nueva');
      }

      // ── Validar fecha ──────────────────────────────────────
      if (!validarFecha(fecha)) {
        req.flash('error', 'La fecha debe estar en formato DD-MM-AAAA con valores válidos.');
        return res.redirect('/facturas/nueva');
      }

      // ── Parsear ítems del formulario ───────────────────────
      const conceptoIds = [].concat(req.body.conceptoId || []);
      const conceptos   = [].concat(req.body.concepto   || []);
      const cantidades  = [].concat(req.body.cantidad   || []);
      const precios     = [].concat(req.body.precio     || []);

      // ── Validar cantidad de ítems (CRÍTICO) ─────────────────
      if (conceptos.length === 0) {
        req.flash('error', 'Debe agregar al menos un ítem.');
        return res.redirect('/facturas/nueva');
      }
      
      if (conceptos.length > 100) {
        req.flash('error', 'Máximo 100 ítems por factura.');
        return res.redirect('/facturas/nueva');
      }

      // ── Validar y construir ítems ──────────────────────────
      const items = [];
      let totalCalculado = 0;

      for (let i = 0; i < conceptos.length; i++) {
        const concepto = conceptos[i];
        const cantidadVal = parseFloat(cantidades[i]);
        const precioVal = parseFloat(precios[i]);

        // Validar concepto
        if (!concepto || typeof concepto !== 'string') {
          req.flash('error', `Concepto inválido en ítem ${i+1}.`);
          return res.redirect('/facturas/nueva');
        }

        const conceptoTrimmed = concepto.trim();
        if (conceptoTrimmed.length === 0 || conceptoTrimmed.length > 150) {
          req.flash('error', `Concepto en ítem ${i+1}: debe tener 1-150 caracteres.`);
          return res.redirect('/facturas/nueva');
        }

        // Validar cantidad
        if (isNaN(cantidadVal) || cantidadVal <= 0) {
          req.flash('error', `Cantidad inválida en ítem ${i+1}: debe ser mayor a 0.`);
          return res.redirect('/facturas/nueva');
        }

        if (cantidadVal > 999999.99) {
          req.flash('error', `Cantidad muy alta en ítem ${i+1}.`);
          return res.redirect('/facturas/nueva');
        }

        // Validar precio
        if (isNaN(precioVal) || precioVal < 0) {
          req.flash('error', `Precio inválido en ítem ${i+1}: no puede ser negativo.`);
          return res.redirect('/facturas/nueva');
        }

        if (precioVal > 999999.99) {
          req.flash('error', `Precio muy alto en ítem ${i+1}.`);
          return res.redirect('/facturas/nueva');
        }

        const subtotal = cantidadVal * precioVal;
        totalCalculado += subtotal;

        items.push({
          conceptoId: conceptoIds[i] || null,
          concepto: conceptoTrimmed,
          cantidad: cantidadVal,
          precio: precioVal
        });
      }

      // Validar total máximo
      if (totalCalculado > 999999999.99) {
        req.flash('error', 'Total de la factura demasiado alto.');
        return res.redirect('/facturas/nueva');
      }

      // ── Crear factura ──────────────────────────────────────
      const factura = await Factura.create({
        nombreEmpresa,
        telefonoEmpresa,
        nombreComprador: nomComp,
        nombreVendedor: nomVend,
        fecha,
        items,
        creadoPor: req.session.usuario.id
      });

      req.flash('success', `Factura ${factura.numeroFactura} creada correctamente.`);
      res.redirect(`/facturas/${factura._id}`);
    } catch (err) {
      console.error('[FacturaController.crear] Error interno del servidor');
      req.flash('error', 'Error al crear la factura.');
      res.redirect('/facturas/nueva');
    }
  },

  async ver(req, res) {
    try {
      const factura = await Factura.findById(req.params.id)
        .populate('creadoPor', 'nombreCompleto');
      if (!factura) {
        req.flash('error', 'Factura no encontrada.');
        return res.redirect('/facturas');
      }
      const soloImprimir = req.query.imprimir === '1';
      res.render(soloImprimir ? 'facturas/imprimir' : 'facturas/ver',
        { titulo: `Factura ${factura.numeroFactura}`, factura });
    } catch (err) {
      console.error('[FacturaController.ver] Error interno del servidor');
      req.flash('error', 'Error al cargar la factura.');
      res.redirect('/facturas');
    }
  },

  async anular(req, res) {
    try {
      const factura = await Factura.findById(req.params.id);
      if (!factura) {
        req.flash('error', 'Factura no encontrada.');
        return res.redirect('/facturas');
      }

      if (factura.anulada) {
        req.flash('error', 'Esta factura ya está anulada.');
        return res.redirect('/facturas');
      }

      await Factura.findByIdAndUpdate(req.params.id, { anulada: true });
      req.flash('success', `Factura ${factura.numeroFactura} anulada.`);
      res.redirect('/facturas');
    } catch (err) {
      console.error('[FacturaController.anular] Error interno del servidor');
      req.flash('error', 'Error al anular la factura.');
      res.redirect('/facturas');
    }
  }
};

module.exports = FacturaController;
