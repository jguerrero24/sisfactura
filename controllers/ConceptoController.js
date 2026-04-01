// ============================================================
// controllers/ConceptoController.js
// ============================================================

const Concepto = require('../models/ConceptoModel');

const ConceptoController = {

  async index(req, res) {
    try {
      const conceptos = await Concepto.find({ activo: true })
        .populate('creadoPor', 'nombreCompleto')
        .sort({ nombre: 1 });
      res.render('conceptos/index', { titulo: 'Conceptos', conceptos });
    } catch (err) {
      console.error('[ConceptoController.index]', err);
      req.flash('error', 'Error al cargar los conceptos.');
      res.redirect('/dashboard');
    }
  },

  async crear(req, res) {
    try {
      const { nombre, descripcion, precioSugerido } = req.body;
      if (!nombre) {
        req.flash('error', 'El nombre del concepto es obligatorio.');
        return res.redirect('/conceptos');
      }
      await Concepto.create({
        nombre,
        descripcion,
        precioSugerido: parseFloat(precioSugerido) || 0,
        creadoPor: req.session.usuario.id
      });
      req.flash('success', `Concepto "${nombre}" creado.`);
      res.redirect('/conceptos');
    } catch (err) {
      console.error('[ConceptoController.crear]', err);
      req.flash('error', 'Error al crear el concepto.');
      res.redirect('/conceptos');
    }
  },

  async desactivar(req, res) {
    try {
      await Concepto.findByIdAndUpdate(req.params.id, { activo: false });
      req.flash('success', 'Concepto desactivado.');
      res.redirect('/conceptos');
    } catch (err) {
      console.error('[ConceptoController.desactivar]', err);
      req.flash('error', 'Error al desactivar el concepto.');
      res.redirect('/conceptos');
    }
  }
};

module.exports = ConceptoController;
