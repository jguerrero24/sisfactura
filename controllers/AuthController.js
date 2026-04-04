// ============================================================
// controllers/AuthController.js — CORREGIDO
// - Regeneración de session ID post-login
// - Validación de contraseña mejorada (10+ caracteres, complejidad)
// - Mejor manejo de errores
// ============================================================

const Usuario = require('../models/UsuarioModel');

const AuthController = {

  showLogin(req, res) {
    if (req.session.usuario) return res.redirect('/dashboard');
    res.render('auth/login', { titulo: 'Iniciar Sesión' });
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        req.flash('error', 'Usuario y contraseña son obligatorios.');
        return res.redirect('/login');
      }

      // Validar formato básico del username
      if (username.length > 50) {
        req.flash('error', 'Usuario o contraseña incorrectos.');
        return res.redirect('/login');
      }

      const usuario = await Usuario.findOne({ username: username.toLowerCase(), activo: true });
      if (!usuario) {
        req.flash('error', 'Usuario o contraseña incorrectos.');
        return res.redirect('/login');
      }

      const valido = await usuario.validarPassword(password);
      if (!valido) {
        req.flash('error', 'Usuario o contraseña incorrectos.');
        return res.redirect('/login');
      }

      // ── CRÍTICO: Regenerar session ID para evitar session fixation ──
      req.session.regenerate((err) => {
        if (err) {
          console.error('[AuthController.login] Session regenerate error');
          req.flash('error', 'Error al iniciar sesión.');
          return res.redirect('/login');
        }

        req.session.usuario = {
          id:             usuario._id.toString(),
          username:       usuario.username,
          nombreCompleto: usuario.nombreCompleto,
          rol:            usuario.rol,
          loginTime:      new Date() // Agregar timestamp de login
        };

        req.session.save((err) => {
          if (err) {
            console.error('[AuthController.login] Session save error');
            req.flash('error', 'Error al iniciar sesión.');
            return res.redirect('/login');
          }
          res.redirect('/dashboard');
        });
      });
    } catch (err) {
      console.error('[AuthController.login] Error interno del servidor');
      req.flash('error', 'Error al iniciar sesión.');
      res.redirect('/login');
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[AuthController.logout] Session destroy error');
      }
      res.redirect('/login');
    });
  },

  // POST /cambiar-password — cambiar contraseña desde el login
  async cambiarPassword(req, res) {
    try {
      const { username, passwordActual, passwordNueva, passwordConfirm } = req.body;

      // ── Validaciones básicas ────────────────────────────────
      if (!username || !passwordActual || !passwordNueva || !passwordConfirm) {
        req.flash('error', 'Todos los campos son obligatorios.');
        return res.redirect('/login');
      }

      // Validar longitud mínima y máxima
      if (passwordNueva.length < 10) {
        req.flash('error', 'La contraseña debe tener al menos 10 caracteres.');
        return res.redirect('/login');
      }

      if (passwordNueva.length > 128) {
        req.flash('error', 'La contraseña es demasiado larga (máx 128 caracteres).');
        return res.redirect('/login');
      }

      // ── Validar complejidad de contraseña ────────────────────
      if (!/(?=.*[a-z])/.test(passwordNueva)) {
        req.flash('error', 'La contraseña debe contener al menos una letra minúscula.');
        return res.redirect('/login');
      }

      if (!/(?=.*[A-Z])/.test(passwordNueva)) {
        req.flash('error', 'La contraseña debe contener al menos una letra mayúscula.');
        return res.redirect('/login');
      }

      if (!/(?=.*\d)/.test(passwordNueva)) {
        req.flash('error', 'La contraseña debe contener al menos un número.');
        return res.redirect('/login');
      }

      if (passwordNueva !== passwordConfirm) {
        req.flash('error', 'Las contraseñas no coinciden.');
        return res.redirect('/login');
      }

      // Verificar que no sea igual a la actual
      const usuario = await Usuario.findOne({ username: username.toLowerCase(), activo: true });
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado o inactivo.');
        return res.redirect('/login');
      }

      const valido = await usuario.validarPassword(passwordActual);
      if (!valido) {
        req.flash('error', 'La contraseña actual es incorrecta.');
        return res.redirect('/login');
      }

      // Validar que nueva contraseña sea diferente a la actual
      const nuevaEsIgual = await usuario.validarPassword(passwordNueva);
      if (nuevaEsIgual) {
        req.flash('error', 'La nueva contraseña debe ser diferente a la actual.');
        return res.redirect('/login');
      }

      // ── Guardar nueva contraseña ────────────────────────────
      const bcrypt = require('bcryptjs');
      const nuevoHash = await bcrypt.hash(passwordNueva, 10);
      
      await Usuario.findByIdAndUpdate(usuario._id, { passwordHash: nuevoHash });

      req.flash('success', 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.');
      res.redirect('/login');

    } catch (err) {
      console.error('[AuthController.cambiarPassword] Error interno del servidor');
      req.flash('error', 'Error al cambiar la contraseña.');
      res.redirect('/login');
    }
  }
};

module.exports = AuthController;
