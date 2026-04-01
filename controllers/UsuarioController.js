// ============================================================
// controllers/UsuarioController.js
// ============================================================

const Usuario  = require('../models/UsuarioModel');
const Factura  = require('../models/FacturaModel');
const Concepto = require('../models/ConceptoModel');

const UsuarioController = {

  async dashboard(req, res) {
    try {
      const [totalFacturas, totalFacturado, totalConceptos, totalUsuarios, facturas] = await Promise.all([
        Factura.countDocuments(),
        Factura.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        Concepto.countDocuments({ activo: true }),
        Usuario.countDocuments(),
        Factura.find().populate('creadoPor', 'nombreCompleto').sort({ createdAt: -1 }).limit(5)
      ]);

      const stats = {
        TotalFacturas:   totalFacturas,
        TotalFacturado:  totalFacturado[0]?.total || 0,
        Anuladas:        await Factura.countDocuments({ anulada: true })
      };

      res.render('dashboard', { titulo: 'Dashboard', stats, facturas, totalConceptos, totalUsuarios });
    } catch (err) {
      console.error('[UsuarioController.dashboard]', err);
      res.render('dashboard', { titulo: 'Dashboard', stats: {}, facturas: [], totalConceptos: 0, totalUsuarios: 0 });
    }
  },

  async index(req, res) {
    try {
      const usuarios = await Usuario.find().sort({ createdAt: 1 });
      res.render('usuarios/index', { titulo: 'Usuarios', usuarios });
    } catch (err) {
      console.error('[UsuarioController.index]', err);
      req.flash('error', 'Error al cargar los usuarios.');
      res.redirect('/dashboard');
    }
  },

  async cambiarRol(req, res) {
    try {
      const { id } = req.params;
      if (id === req.session.usuario.id) {
        req.flash('error', 'No puede cambiar su propio rol.');
        return res.redirect('/usuarios');
      }
      await Usuario.findByIdAndUpdate(id, { rol: req.body.rol });
      req.flash('success', 'Rol actualizado.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.cambiarRol]', err);
      req.flash('error', 'Error al cambiar el rol.');
      res.redirect('/usuarios');
    }
  },

  async toggleActivo(req, res) {
    try {
      const { id } = req.params;
      if (id === req.session.usuario.id) {
        req.flash('error', 'No puede desactivar su propia cuenta.');
        return res.redirect('/usuarios');
      }
      const usuario = await Usuario.findById(id);
      await Usuario.findByIdAndUpdate(id, { activo: !usuario.activo });
      req.flash('success', 'Usuario ' + (usuario.activo ? 'desactivado' : 'activado') + '.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.toggleActivo]', err);
      req.flash('error', 'Error al actualizar el usuario.');
      res.redirect('/usuarios');
    }
  },

  // POST /usuarios/crear — crear nuevo usuario (solo admin)
  async crear(req, res) {
    try {
      const { username, nombreCompleto, rol, password, passwordConfirm } = req.body;

      // Validaciones
      if (!username || !nombreCompleto || !rol || !password) {
        req.flash('error', 'Todos los campos son obligatorios.');
        return res.redirect('/usuarios');
      }

      if (password.length < 6) {
        req.flash('error', 'La contrasena debe tener al menos 6 caracteres.');
        return res.redirect('/usuarios');
      }

      if (password !== passwordConfirm) {
        req.flash('error', 'Las contrasenas no coinciden.');
        return res.redirect('/usuarios');
      }

      // Verificar que el username no exista
      const existe = await Usuario.findOne({ username: username.toLowerCase() });
      if (existe) {
        req.flash('error', 'El nombre de usuario "' + username + '" ya esta en uso.');
        return res.redirect('/usuarios');
      }

      await Usuario.crearConHash({ username, nombreCompleto, password, rol });

      req.flash('success', 'Usuario "' + username + '" creado correctamente.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.crear]', err);
      req.flash('error', 'Error al crear el usuario.');
      res.redirect('/usuarios');
    }
  },

  // POST /usuarios/:id/eliminar — eliminar usuario (solo admin)
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      if (id === req.session.usuario.id) {
        req.flash('error', 'No puede eliminar su propia cuenta.');
        return res.redirect('/usuarios');
      }
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado.');
        return res.redirect('/usuarios');
      }
      await Usuario.findByIdAndDelete(id);
      req.flash('success', 'Usuario "' + usuario.username + '" eliminado.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.eliminar]', err);
      req.flash('error', 'Error al eliminar el usuario.');
      res.redirect('/usuarios');
    }
  }
};

module.exports = UsuarioController;
