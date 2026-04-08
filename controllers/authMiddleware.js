// ============================================================
// controllers/authMiddleware.js
// ============================================================

const { permisos } = require('../config/app');

function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  req.flash('error', 'Debe iniciar sesión para continuar.');
  res.redirect('/login');
}

function requirePermiso(permiso) {
  return (req, res, next) => {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect('/login');
    if ((permisos[usuario.rol] || []).includes(permiso)) return next();
    req.flash('error', 'No tiene permisos para realizar esta acción.');
    res.redirect('/dashboard');
  };
}

function exposeUser(req, res, next) {
  res.locals.usuario      = req.session.usuario || null;
  res.locals.permisosUser = req.session.usuario
    ? (permisos[req.session.usuario.rol] || [])
    : [];
  res.locals.messages = req.flash();
  next();
}

module.exports = { requireLogin, requirePermiso, exposeUser };


