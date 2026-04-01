// ============================================================
// controllers/AuthController.js
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

      req.session.usuario = {
        id:             usuario._id.toString(),
        username:       usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        rol:            usuario.rol
      };

      res.redirect('/dashboard');
    } catch (err) {
      console.error('[AuthController.login]', err);
      req.flash('error', 'Error interno al iniciar sesión.');
      res.redirect('/login');
    }
  },

  logout(req, res) {
    req.session.destroy(() => res.redirect('/login'));
  },

  // POST /cambiar-password — cambiar contraseña desde el login
  async cambiarPassword(req, res) {
    try {
      const { username, passwordActual, passwordNueva, passwordConfirm } = req.body;

      // Validaciones básicas
      if (!username || !passwordActual || !passwordNueva || !passwordConfirm) {
        req.flash('error', 'Todos los campos son obligatorios.');
        return res.redirect('/login');
      }

      if (passwordNueva.length < 6) {
        req.flash('error', 'La nueva contrasena debe tener al menos 6 caracteres.');
        return res.redirect('/login');
      }

      if (passwordNueva !== passwordConfirm) {
        req.flash('error', 'Las contrasenas no coinciden.');
        return res.redirect('/login');
      }

      // Verificar que el usuario existe y la contraseña actual es correcta
      const usuario = await Usuario.findOne({ username: username.toLowerCase(), activo: true });
      if (!usuario) {
        req.flash('error', 'Usuario no encontrado o inactivo.');
        return res.redirect('/login');
      }

      const valido = await usuario.validarPassword(passwordActual);
      if (!valido) {
        req.flash('error', 'La contrasena actual es incorrecta.');
        return res.redirect('/login');
      }

      // Guardar nueva contraseña hasheada
      const bcrypt = require('bcryptjs');
      const nuevoHash = await bcrypt.hash(passwordNueva, 10);
      await Usuario.findByIdAndUpdate(usuario._id, { passwordHash: nuevoHash });

      req.flash('success', 'Contrasena actualizada correctamente. Inicia sesion con tu nueva contrasena.');
      res.redirect('/login');

    } catch (err) {
      console.error('[AuthController.cambiarPassword]', err);
      req.flash('error', 'Error al cambiar la contrasena.');
      res.redirect('/login');
    }
  }
};

module.exports = AuthController;
