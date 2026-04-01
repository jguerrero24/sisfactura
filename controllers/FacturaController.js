// ============================================================
// controllers/FacturaController.js
// ============================================================

const Factura  = require('../models/FacturaModel');
const Concepto = require('../models/ConceptoModel');

const FacturaController = {

  async index(req, res) {
    try {
      const pagina  = parseInt(req.query.pagina) || 1;
      const porPag  = 20;
      const facturas = await Factura.find()
        .populate('creadoPor', 'nombreCompleto')
        .sort({ createdAt: -1 })
        .skip((pagina - 1) * porPag)
        .limit(porPag);
      res.render('facturas/index', { titulo: 'Facturas', facturas, pagina });
    } catch (err) {
      console.error('[FacturaController.index]', err);
      req.flash('error', 'Error al cargar las facturas.');
      res.redirect('/dashboard');
    }
  },

  async nueva(req, res) {
    try {
      const conceptos = await Concepto.find({ activo: true }).sort({ nombre: 1 });
      res.render('facturas/nueva', { titulo: 'Nueva Factura', conceptos });
    } catch (err) {
      console.error('[FacturaController.nueva]', err);
      req.flash('error', 'Error al cargar el formulario.');
      res.redirect('/facturas');
    }
  },

  async crear(req, res) {
    try {
      // Datos de la empresa — ESTÁTICOS, no vienen del formulario
      const nombreEmpresa    = 'Junta Administrativa Liceo Laboratorio Emma Gamboa';
      const telefonoEmpresa  = '2235-6785';

      const { nombreComprador, nombreVendedor, fecha } = req.body;

      if (!nombreComprador || !nombreVendedor || !fecha) {
        req.flash('error', 'Todos los campos obligatorios deben completarse.');
        return res.redirect('/facturas/nueva');
      }

      if (!/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
        req.flash('error', 'La fecha debe estar en formato DD-MM-AAAA.');
        return res.redirect('/facturas/nueva');
      }

      // Parsear ítems del formulario
      const conceptoIds = [].concat(req.body.conceptoId || []);
      const conceptos   = [].concat(req.body.concepto   || []);
      const cantidades  = [].concat(req.body.cantidad   || []);
      const precios     = [].concat(req.body.precio     || []);

      if (!conceptos.length) {
        req.flash('error', 'Debe agregar al menos un ítem.');
        return res.redirect('/facturas/nueva');
      }

      const items = conceptos.map((c, i) => ({
        conceptoId: conceptoIds[i] || null,
        concepto:   c,
        cantidad:   parseFloat(cantidades[i]) || 1,
        precio:     parseFloat(precios[i])    || 0
      }));

      const factura = await Factura.create({
        nombreEmpresa,
        telefonoEmpresa,
        nombreComprador,
        nombreVendedor,
        fecha,
        items,
        creadoPor: req.session.usuario.id
      });

      req.flash('success', `Factura ${factura.numeroFactura} creada correctamente.`);
      res.redirect(`/facturas/${factura._id}`);
    } catch (err) {
      console.error('[FacturaController.crear]', err);
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
      console.error('[FacturaController.ver]', err);
      req.flash('error', 'Error al cargar la factura.');
      res.redirect('/facturas');
    }
  },

  async anular(req, res) {
    try {
      await Factura.findByIdAndUpdate(req.params.id, { anulada: true });
      req.flash('success', 'Factura anulada.');
      res.redirect('/facturas');
    } catch (err) {
      console.error('[FacturaController.anular]', err);
      req.flash('error', 'Error al anular la factura.');
      res.redirect('/facturas');
    }
  }
};

module.exports = FacturaController;
