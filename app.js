// ============================================================
// app.js — ARCHIVO PRINCIPAL CORREGIDO
// Incluye permisos en res.locals para las vistas EJS
// ============================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

// Importar configuración y conexión
const dbConnect = require('./config/db');
const config = require('./config/app');
const routes = require('./routes');

const app = express();

// ════════════════════════════════════════════════════════════
// 1. CONECTAR A MONGODB ATLAS
// ════════════════════════════════════════════════════════════
dbConnect();

// ════════════════════════════════════════════════════════════
// 2. CONFIGURAR VISTAS (EJS)
// ════════════════════════════════════════════════════════════
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ════════════════════════════════════════════════════════════
// 3. MIDDLEWARE - PARSER DE DATOS
// ════════════════════════════════════════════════════════════
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ════════════════════════════════════════════════════════════
// 4. ARCHIVOS ESTÁTICOS
// ════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════════════════════
// 5. SESIONES
// ════════════════════════════════════════════════════════════
app.use(session({
  secret: process.env.SESSION_SECRET || config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: config.sessionMaxAge
  }
}));

// ════════════════════════════════════════════════════════════
// 6. FLASH MESSAGES
// ════════════════════════════════════════════════════════════
app.use(flash());

// ════════════════════════════════════════════════════════════
// 7. MIDDLEWARE - USUARIO Y PERMISOS EN VISTAS
// ════════════════════════════════════════════════════════════
// ✅ IMPORTANTE: Este middleware pasa el usuario y permisos a las vistas
app.use((req, res, next) => {
  // Pasar usuario a la vista
  res.locals.usuario = req.session.usuario || null;
  
  // Pasar mensajes flash a la vista
  res.locals.messages = req.flash();
  
  // ✅ NUEVO: Pasar permisos a la vista
  // Esto evita el error "permisosUser is not defined"
  if (req.session.usuario) {
    const rol = req.session.usuario.rol || 'viewer';
    res.locals.permisosUser = config.permisos[rol] || [];
  } else {
    res.locals.permisosUser = [];
  }
  
  next();
});

// ════════════════════════════════════════════════════════════
// 8. RUTAS
// ════════════════════════════════════════════════════════════
app.use('/', routes);

// ════════════════════════════════════════════════════════════
// 9. MANEJO DE ERRORES 404
// ════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página no encontrada' });
});

// ════════════════════════════════════════════════════════════
// 10. INICIAR SERVIDOR
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║            ✅ SISFACTURA INICIADO CORRECTAMENTE        ║');
  console.log('║                                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  🌐 URL: https://sisfactura.onrender.com              ║');
  console.log('║  📊 BD: MongoDB Atlas (Nube)                          ║');
  console.log('║  🔐 Login: admin / admin123                           ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
