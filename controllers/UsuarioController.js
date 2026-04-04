// ============================================================
// controllers/UsuarioController.js — CORREGIDO
// Validaciones mejoradas: username, password, sanitización
// ============================================================

const Usuario  = require('../models/UsuarioModel');
const Factura  = require('../models/FacturaModel');
const Concepto = require('../models/ConceptoModel');

// Validar formato de username: 3-20 caracteres, solo letras minúsculas, números, guiones bajos
function validarUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return /^[a-z0-9_]{3,20}$/.test(username.toLowerCase());
}

// Validar nombre completo
function validarNombreCompleto(nombre) {
  if (!nombre || typeof nombre !== 'string') return false;
  const trimmed = nombre.trim();
  return trimmed.length > 0 && trimmed.length <= 150;
}

// Validar password: mínimo 10 caracteres, complejidad
function validarPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 10 || password.length > 128) return false;
  if (!/(?=.*[a-z])/.test(password)) return false;
  if (!/(?=.*[A-Z])/.test(password)) return false;
  if (!/(?=.*\d)/.test(password)) return false;
  return true;
}

// Mensajes de error descriptivos
function getMensajeValidacionPassword() {
  return 'La contraseña debe tener: 10+ caracteres, una mayúscula, una minúscula y un número.';
}

const UsuarioController = {

  async dashboard(req, res) {
    try {
      const [totalFacturas, totalFacturado, totalConceptos, totalUsuarios, facturas] = await Promise.all([
        Factura.countDocuments({ anulada: false }),
        Factura.aggregate([{ $match: { anulada: false } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
        Concepto.countDocuments({ activo: true }),
        Usuario.countDocuments(),
        Factura.find({ anulada: false }).populate('creadoPor', 'nombreCompleto').sort({ createdAt: -1 }).limit(5)
      ]);

      const stats = {
        TotalFacturas:   totalFacturas,
        TotalFacturado:  totalFacturado[0]?.total || 0,
        Anuladas:        await Factura.countDocuments({ anulada: true })
      };

      res.render('dashboard', { titulo: 'Dashboard', stats, facturas, totalConceptos, totalUsuarios });
    } catch (err) {
      console.error('[UsuarioController.dashboard] Error interno del servidor');
      res.render('dashboard', { titulo: 'Dashboard', stats: {}, facturas: [], totalConceptos: 0, totalUsuarios: 0 });
    }
  },

  async index(req, res) {
    try {
      const usuarios = await Usuario.find().sort({ createdAt: 1 });
      res.render('usuarios/index', { titulo: 'Usuarios', usuarios });
    } catch (err) {
      console.error('[UsuarioController.index] Error interno del servidor');
      req.flash('error', 'Error al cargar los usuarios.');
      res.redirect('/dashboard');
    }
  },

  async cambiarRol(req, res) {
    try {
      const { id } = req.params;
      const { rol } = req.body;

      if (id === req.session.usuario.id) {
        req.flash('error', 'No puede cambiar su propio rol.');
        return res.redirect('/usuarios');
      }

      // Validar que el rol sea válido
      if (!['admin', 'privileged', 'viewer'].includes(rol)) {
        req.flash('error', 'Rol inválido.');
        return res.redirect('/usuarios');
      }

      const usuario = await Usuario.findById(id);
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado.');
        return res.redirect('/usuarios');
      }

      await Usuario.findByIdAndUpdate(id, { rol });
      req.flash('success', `Rol actualizado a "${rol}".`);
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.cambiarRol] Error interno del servidor');
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
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado.');
        return res.redirect('/usuarios');
      }

      await Usuario.findByIdAndUpdate(id, { activo: !usuario.activo });
      req.flash('success', 'Usuario ' + (usuario.activo ? 'desactivado' : 'activado') + '.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.toggleActivo] Error interno del servidor');
      req.flash('error', 'Error al actualizar el usuario.');
      res.redirect('/usuarios');
    }
  },

  // POST /usuarios/crear — crear nuevo usuario (solo admin)
  async crear(req, res) {
    try {
      const { username, nombreCompleto, rol, password, passwordConfirm } = req.body;

      // ── Validaciones ────────────────────────────────────────
      if (!username || !nombreCompleto || !rol || !password) {
        req.flash('error', 'Todos los campos son obligatorios.');
        return res.redirect('/usuarios');
      }

      // Validar username
      if (!validarUsername(username)) {
        req.flash('error', 'Username: 3-20 caracteres, solo letras minúsculas, números y guiones bajos.');
        return res.redirect('/usuarios');
      }

      // Validar nombre completo
      if (!validarNombreCompleto(nombreCompleto)) {
        req.flash('error', 'Nombre completo: 1-150 caracteres.');
        return res.redirect('/usuarios');
      }

      // Validar rol
      if (!['admin', 'privileged', 'viewer'].includes(rol)) {
        req.flash('error', 'Rol inválido.');
        return res.redirect('/usuarios');
      }

      // Validar contraseña (mínimo 10 caracteres, complejidad)
      if (!validarPassword(password)) {
        req.flash('error', getMensajeValidacionPassword());
        return res.redirect('/usuarios');
      }

      if (password !== passwordConfirm) {
        req.flash('error', 'Las contraseñas no coinciden.');
        return res.redirect('/usuarios');
      }

      // Verificar que el username no exista
      const existe = await Usuario.findOne({ username: username.toLowerCase() });
      if (existe) {
        req.flash('error', 'El nombre de usuario "' + username + '" ya está en uso.');
        return res.redirect('/usuarios');
      }

      await Usuario.crearConHash({ username: username.toLowerCase(), nombreCompleto, password, rol });

      req.flash('success', 'Usuario "' + username + '" creado correctamente.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.crear] Error interno del servidor');
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

      // No eliminar si tiene facturas creadas (soft delete mejor)
      const facturas = await Factura.countDocuments({ creadoPor: id });
      if (facturas > 0) {
        req.flash('error', `No puede eliminar usuario con ${facturas} factura(s). Desactívelo en su lugar.`);
        return res.redirect('/usuarios');
      }

      await Usuario.findByIdAndDelete(id);
      req.flash('success', 'Usuario "' + usuario.username + '" eliminado.');
      res.redirect('/usuarios');
    } catch (err) {
      console.error('[UsuarioController.eliminar] Error interno del servidor');
      req.flash('error', 'Error al eliminar el usuario.');
      res.redirect('/usuarios');
    }
  }
};

module.exports = UsuarioController;
