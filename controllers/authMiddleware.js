// controllers/authMiddleware.js
// Importamos el objeto completo de configuración
const appConfig = require('../config/app'); 

function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) return next();
  req.flash('error', 'Debe iniciar sesión para continuar.');
  res.redirect('/login');
}

function requirePermiso(permiso) {
  return (req, res, next) => {
    const usuario = req.session.usuario;
    if (!usuario) return res.redirect('/login');
    
    // Acceso seguro a la propiedad permisos del objeto exportado
    const listaPermisos = appConfig.permisos[usuario.rol] || [];
    if (listaPermisos.includes(permiso)) return next();
    
    req.flash('error', 'No tiene permisos para realizar esta acción.');
    res.redirect('/dashboard');
  };
}

function exposeUser(req, res, next) {
  // Pasamos el usuario a las vistas
  res.locals.usuario = req.session.usuario || null;
  
  // GARANTÍA: Si no hay usuario o el rol no existe, devolvemos un array vacío.
  // Esto evita que EJS lance el error "is not defined".
  const rolActual = (req.session.usuario && req.session.usuario.rol) ? req.session.usuario.rol : null;
  const todosLosPermisos = appConfig.permisos || {};
  
  res.locals.permisosUser = (rolActual && todosLosPermisos[rolActual]) 
    ? todosLosPermisos[rolActual] 
    : [];
    
  res.locals.messages = req.flash();
  next();
}

module.exports = { requireLogin, requirePermiso, exposeUser };
