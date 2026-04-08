// Asegúrate de que la ruta sea correcta y usa desestructuración
const config = require('../config/app');
const permisos = config.permisos; 

function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  req.flash('error', 'Debe iniciar sesión para continuar.');
  res.redirect('/login');
}

function requirePermiso(permiso) {
  return (req, res, next) => {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect('/login');
    // Verificación segura de la existencia del rol en el objeto de permisos
    if (permisos && permisos[usuario.rol] && permisos[usuario.rol].includes(permiso)) {
      return next();
    }
    req.flash('error', 'No tiene permisos para realizar esta acción.');
    res.redirect('/dashboard');
  };
}

function exposeUser(req, res, next) {
  // Guardamos el usuario en locals
  res.locals.usuario = req.session.usuario || null;

  // IMPORTANTE: Garantizar que permisosUser sea SIEMPRE un array (aunque sea vacío)
  let listaPermisos = [];
  if (req.session.usuario && permisos && permisos[req.session.usuario.rol]) {
    listaPermisos = permisos[req.session.usuario.rol];
  }
  
  res.locals.permisosUser = listaPermisos;
  res.locals.messages = req.flash();
  next();
}

module.exports = { requireLogin, requirePermiso, exposeUser };
